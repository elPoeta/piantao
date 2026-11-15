import asyncio
import io
import zipfile
from types import SimpleNamespace as NS

import aiohttp
import pytest

from piantao.core import EventBus
from piantao.web import Attachments, PairingManager, SessionStore, WebConfig, WebGateway
from piantao.web.attachments import HEADER, MAX_FILES, MAX_UPLOAD, PER_FILE_CHARS, TOTAL_CHARS, clean_name
from piantao.web.gateway import CSRF_HEADER

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea75b81e30000000049454e44ae426082")


def make_docx(paragraphs):
    from xml.sax.saxutils import escape
    body = "".join(f"<w:p><w:r><w:t>{escape(p)}</w:t></w:r></w:p>" for p in paragraphs)
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("word/document.xml", f'<?xml version="1.0"?><w:document xmlns:w="x"><w:body>{body}</w:body></w:document>')
    return buf.getvalue()


def make_pdf(text):
    from pypdf import PdfWriter
    from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject
    w = PdfWriter()
    page = w.add_blank_page(200, 200)
    font = DictionaryObject({NameObject("/Type"): NameObject("/Font"), NameObject("/Subtype"): NameObject("/Type1"), NameObject("/BaseFont"): NameObject("/Helvetica")})
    page[NameObject("/Resources")] = DictionaryObject({NameObject("/Font"): DictionaryObject({NameObject("/F1"): w._add_object(font)})})
    stream = DecodedStreamObject()
    stream.set_data(f"BT /F1 12 Tf 20 100 Td ({text}) Tj ET".encode())
    page[NameObject("/Contents")] = w._add_object(stream)
    buf = io.BytesIO()
    w.write(buf)
    return buf.getvalue()


def test_clean_name_strips_paths_control_chars_and_brackets():
    assert clean_name("../../etc/passwd") == "passwd" and clean_name("C:\\x\\inf<orme>.txt") == "informe.txt"
    assert clean_name("a\nb\x00.txt") == "ab.txt" and clean_name("") == "adjunto" and clean_name("...") == "adjunto" and len(clean_name("x" * 500)) == 120


def test_text_pdf_docx_and_image_are_extracted_and_binary_is_rejected():
    a = Attachments()
    t = a.add("nota.md", "# Titulo\nhola ñandú".encode())
    assert t["kind"] == "text" and t["chars"] > 5
    assert a.add("sin_extension", b"contenido plano")["kind"] == "text"
    assert a.add("doc.docx", make_docx(["Primera & <linea>", "Segunda"]))["kind"] == "docx"
    assert a.add("x.pdf", make_pdf("Hola desde el PDF"))["kind"] == "pdf"
    assert a.add("foto.png", PNG)["kind"] == "image"
    b = a.block()
    assert "hola ñandú" in b and "Primera & <linea>" in b and "Segunda" in b and "Hola desde el PDF" in b
    assert "(es una imagen" in b and b.startswith(HEADER)
    for bad, data in (("bin.dat", b"\x00\x01\x02" * 100), ("roto.docx", b"no es zip"), ("falso.pdf", b"%PDF-1.4 basura"), ("vacio.txt", b""), ("solo_espacios.txt", b"   \n ")):
        with pytest.raises(ValueError):
            a.add(bad, data)


def test_limits_size_count_and_prompt_budget_and_taint():
    tools = NS(tainted=False)
    a = Attachments(tools)
    assert a.block() is None and tools.tainted is False
    with pytest.raises(ValueError, match="supera"):
        a.add("grande.txt", b"x" * (MAX_UPLOAD + 1))
    for i in range(MAX_FILES):
        a.add(f"f{i}.txt", ("palabra " * 3000).encode())
    with pytest.raises(ValueError, match="adjuntos"):
        a.add("uno_mas.txt", b"x")
    b = a.block()
    assert tools.tainted is True                                 # contenido externo: despues, lo sensible exige confirmacion explicita
    assert len(b) < TOTAL_CHARS + MAX_FILES * 300 + 1500 and "[...recortado" in b
    assert b.count("<<<ADJUNTO:") == MAX_FILES
    big = Attachments()
    big.add("a.txt", b"y" * 50000)
    assert "y" * PER_FILE_CHARS in big.block() and "y" * (PER_FILE_CHARS + 1) not in big.block()


def test_remove_clear_list_and_change_notifications():
    seen = []
    a = Attachments(None, lambda items: seen.append([i["name"] for i in items]))
    x = a.add("a.txt", b"uno")["id"]
    a.add("b.txt", b"dos")
    assert a.remove(x) is True and a.remove(x) is False and a.remove(5) is False and a.remove(None) is False
    assert [i["name"] for i in a.list()] == ["b.txt"] and "text" not in a.list()[0]    # la lista publica no lleva el contenido
    a.clear(); a.clear()
    assert a.block() is None and seen == [["a.txt"], ["a.txt", "b.txt"], ["b.txt"], []]


def test_handlers_list_and_remove():
    a = Attachments()
    aid = a.add("a.txt", b"uno")["id"]
    h = a.handlers()
    assert [i["name"] for i in asyncio.run(h["attachment_list"]({}))] == ["a.txt"]
    assert asyncio.run(h["attachment_remove"]({"id": aid})) is True and asyncio.run(h["attachment_list"]({})) == []


# ---- ruta HTTP ------------------------------------------------------------------------------------------------------
def run(coro):
    return asyncio.run(coro)


async def served(tmp_path):
    bus = EventBus()
    pairing, sessions = PairingManager(), SessionStore()
    gw = WebGateway(bus, lambda: {}, {}, WebConfig(port=0), sessions, pairing)
    att = Attachments(None, lambda items: gw.broadcast({"t": "attachments", "items": items}))
    gw.attachments = att
    await gw.start()
    s = aiohttp.ClientSession()
    code, _ = pairing.issue()
    r = await s.post(gw.url + "/api/pair", json={"code": code}, headers={"Origin": gw.url, CSRF_HEADER: "1"})
    assert r.status == 200
    return gw, att, s


def test_upload_route_requires_session_csrf_origin_and_respects_limits(tmp_path):
    async def go():
        gw, att, s = await served(tmp_path)
        try:
            hdr = {"Origin": gw.url, CSRF_HEADER: "1"}
            r = await s.post(gw.url + "/api/upload?name=a%20b.txt", data=b"hola mundo", headers=hdr)
            body = await r.json()
            assert r.status == 200 and body["ok"] and body["attachment"]["name"] == "a b.txt" and "text" not in body["attachment"]
            assert [i["name"] for i in att.list()] == ["a b.txt"]
            # sin cabecera de seguridad / sin origen / origen ajeno / host ajeno
            assert (await s.post(gw.url + "/api/upload?name=x.txt", data=b"x", headers={"Origin": gw.url})).status == 403
            assert (await s.post(gw.url + "/api/upload?name=x.txt", data=b"x", headers={CSRF_HEADER: "1"})).status == 403
            assert (await s.post(gw.url + "/api/upload?name=x.txt", data=b"x", headers={"Origin": "http://evil.example", CSRF_HEADER: "1"})).status == 403
            assert (await s.post(gw.url + "/api/upload?name=x.txt", data=b"x", headers={**hdr, "Host": "evil.example"})).status == 421
            # sin sesion
            async with aiohttp.ClientSession() as anon:
                r = await anon.post(gw.url + "/api/upload?name=x.txt", data=b"x", headers=hdr)
                assert r.status == 401
            # tipo no soportado, vacio, demasiado grande (cabecera y flujo)
            r = await s.post(gw.url + "/api/upload?name=b.bin", data=b"\x00\x00\x00", headers=hdr)
            assert r.status == 400 and "no soportado" in (await r.json())["error"]
            assert (await s.post(gw.url + "/api/upload?name=v.txt", data=b"", headers=hdr)).status == 400
            r = await s.post(gw.url + "/api/upload?name=g.txt", data=b"x" * (MAX_UPLOAD + 10), headers=hdr)
            assert r.status == 413
            async def gen():
                for _ in range(MAX_UPLOAD // 65536 + 2):
                    yield b"x" * 65536
            r = await s.post(gw.url + "/api/upload?name=g2.txt", data=gen(), headers=hdr)           # sin Content-Length: se corta en el flujo
            assert r.status == 413
            assert [i["name"] for i in att.list()] == ["a b.txt"]
            # GET no sube nada; nombre con ruta se limpia
            assert (await s.get(gw.url + "/api/upload")).status in (404, 405)
            r = await s.post(gw.url + "/api/upload?name=..%2F..%2Fetc%2Fpasswd", data=b"root", headers=hdr)
            assert (await r.json())["attachment"]["name"] == "passwd"
        finally:
            await s.close()
            await gw.stop()
    run(go())


def test_upload_is_unavailable_without_attachments_and_audited(tmp_path):
    async def go():
        events = []
        bus = EventBus()
        pairing, sessions = PairingManager(), SessionStore()
        gw = WebGateway(bus, lambda: {}, {}, WebConfig(port=0), sessions, pairing, audit=lambda ev, **d: events.append((ev, d)))
        await gw.start()
        async with aiohttp.ClientSession() as s:
            code, _ = pairing.issue()
            await s.post(gw.url + "/api/pair", json={"code": code}, headers={"Origin": gw.url, CSRF_HEADER: "1"})
            r = await s.post(gw.url + "/api/upload?name=a.txt", data=b"x", headers={"Origin": gw.url, CSRF_HEADER: "1"})
            assert r.status == 404
            gw.attachments = Attachments()
            r = await s.post(gw.url + "/api/upload?name=a.txt", data=b"x", headers={"Origin": gw.url, CSRF_HEADER: "1"})
            assert r.status == 200
        await gw.stop()
        up = [d for ev, d in events if ev == "web_upload"]
        assert up == [{"name": "a.txt", "kind": "text", "size": 1}]      # se audita nombre/tipo/tamaño, nunca el contenido
    run(go())
