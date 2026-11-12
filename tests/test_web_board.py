import asyncio
import json
import os

import aiohttp
import pytest

from piantao.tools.base import ToolError
from piantao.web import Board, PairingManager, SessionStore, WebConfig, WebGateway
from piantao.web.board import MAX_CARDS, MAX_IMAGE_BYTES, MAX_TEXT, MAX_TITLE
from piantao.web.gateway import CSRF_HEADER
from piantao.core import EventBus

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea75b81e30000000049454e44ae426082")


def run(coro):
    return asyncio.run(coro)


def make(tmp_path, clients=True):
    media = tmp_path / "media"
    media.mkdir()
    (media / "foto.png").write_bytes(PNG)
    sent = []
    return Board(media, sent.append, lambda: clients), sent, media


def tool(board, name):
    return next(t for t in board.tools() if t.name == name)


def test_add_validates_and_broadcasts(tmp_path):
    b, sent, _ = make(tmp_path)
    c = b.add("  Resumen ", "linea1\r\nlinea2\x00\x07", None)
    assert c["title"] == "Resumen" and c["text"] == "linea1\nlinea2" and c["origin"] == "model"
    assert sent == [{"t": "board", "ev": "add", "card": c}]
    for bad in (dict(title=""), dict(title=None), dict(title="x" * (MAX_TITLE + 1), text="a"), dict(title="t", text="x" * (MAX_TEXT + 1)),
                dict(title="t"), dict(title="t", text=5), dict(title=5, text="a"), dict(title="t", text="a", origin="otro")):
        with pytest.raises(ValueError):
            b.add(**bad)
    assert len(b.cards) == 1


def test_html_is_kept_as_plain_text(tmp_path):
    b, _, _ = make(tmp_path)
    c = b.add("<img src=x onerror=1>", "<script>alert(1)</script>")
    assert c["title"] == "<img src=x onerror=1>" and c["text"] == "<script>alert(1)</script>"  # el cliente lo dibuja como texto


@pytest.mark.parametrize("name", ["../secreto.png", "/etc/passwd", "sub/foto.png", "..", "foto.svg", "foto.html", "noexiste.png", "", None, 5,
                                  "foto.png/..", "a\\b.png", ".png", "x" * 200 + ".png", "foto.png\x00.txt"])
def test_images_outside_media_or_wrong_type_rejected(tmp_path, name):
    b, _, _ = make(tmp_path)
    with pytest.raises(ValueError):
        b.resolve_image(name)


def test_symlink_escape_and_size_limit(tmp_path):
    b, _, media = make(tmp_path)
    secret = tmp_path / "secreto.png"
    secret.write_bytes(PNG)
    os.symlink(secret, media / "enlace.png")
    with pytest.raises(ValueError):
        b.resolve_image("enlace.png")  # apunta fuera de media/
    big = media / "grande.png"
    big.write_bytes(b"\0" * (MAX_IMAGE_BYTES + 1))
    with pytest.raises(ValueError, match="8 MiB"):
        b.resolve_image("grande.png")
    assert b.resolve_image("foto.png").name == "foto.png"
    assert b.add("Foto", None, "foto.png")["image"] == "foto.png"


def test_card_cap_drops_oldest_and_remove_clear(tmp_path):
    t = iter(range(10_000))
    media = tmp_path / "m"
    media.mkdir()
    sent = []
    b = Board(media, sent.append, clock=lambda: float(next(t)))
    ids = [b.add(f"c{i}", "x")["id"] for i in range(MAX_CARDS + 3)]
    assert len(b.cards) == MAX_CARDS and ids[0] not in b.cards and ids[-1] in b.cards
    assert any(m["ev"] == "remove" and m["id"] == ids[0] for m in sent)
    assert b.remove(ids[-1]) and not b.remove(ids[-1]) and not b.remove(5) and not b.remove(None)
    assert b.clear() == MAX_CARDS - 1 and sent[-1] == {"t": "board", "ev": "clear"}


def test_tools_present_clear_state(tmp_path):
    async def go():
        b, sent, _ = make(tmp_path, clients=False)
        out = await tool(b, "board_present").run({"title": "Hola", "text": "mundo"})
        assert "mostrada" in out and "no hay ninguna pantalla" in out
        cid = next(iter(b.cards))
        st = await tool(b, "board_state").run({})
        assert cid in st and "Hola" in st and "origen model" in st
        for bad in ({"title": "x"}, {"title": "x", "image": "../a.png"}, {"text": "sin titulo"}):
            with pytest.raises(ToolError):
                await tool(b, "board_present").run(bad)
        with pytest.raises(ToolError):
            await tool(b, "board_clear").run({"id": "zzz"})
        assert "retirada" in await tool(b, "board_clear").run({"id": cid})
        assert "vacio" in await tool(b, "board_state").run({})
        await tool(b, "board_present").run({"title": "a", "text": "b"})
        assert "limpio" in await tool(b, "board_clear").run({})
    run(go())


def test_tools_are_level1_visual_only_and_schemas_strict(tmp_path):
    b, _, _ = make(tmp_path)
    for t in b.tools():
        assert t.action == "system_info" and t.source == "board" and not t.untrusted
        assert t.parameters["additionalProperties"] is False


def test_user_cards_marked_user_and_handlers(tmp_path):
    async def go():
        b, _, _ = make(tmp_path)
        h = b.handlers()
        c = await h["board_add"]({"title": "Nota", "text": "mia"})
        assert c["origin"] == "user"
        assert [x["id"] for x in await h["board_state"]({})] == [c["id"]]
        assert await h["board_close"]({"id": c["id"]}) is True and await h["board_close"]({"id": "x"}) is False
        with pytest.raises(ValueError):
            await h["board_add"]({"title": "x" * 500, "text": "a"})
    run(go())


def test_media_route_requires_session_and_blocks_traversal(tmp_path):
    async def go():
        b, _, _ = make(tmp_path)
        pairing = PairingManager()
        gw = WebGateway(EventBus(), lambda: {}, {}, WebConfig(port=0), SessionStore(tmp_path / "s.json"), pairing)
        gw.board = b
        (tmp_path / "secreto.txt").write_text("secreto")
        await gw.start()
        try:
            async with aiohttp.ClientSession() as anon:
                assert (await anon.get(gw.url + "/media/foto.png")).status == 401
            async with aiohttp.ClientSession() as s:
                code, _ = pairing.issue()
                await s.post(gw.url + "/api/pair", json={"code": code}, headers={"Origin": gw.url, CSRF_HEADER: "1"})
                r = await s.get(gw.url + "/media/foto.png")
                assert r.status == 200 and r.headers["Content-Type"] == "image/png" and await r.read() == PNG
                assert r.headers["X-Content-Type-Options"] == "nosniff"
                for path in ("/media/..%2fsecreto.txt", "/media/%2e%2e/secreto.txt", "/media/foto.svg", "/media/noexiste.png", "/media/..%5csecreto.txt",
                             "/media/foto.png%00.txt"):
                    assert (await s.get(gw.url + path)).status in (404, 400), path
                gw.board = None
                assert (await s.get(gw.url + "/media/foto.png")).status == 404
        finally:
            await gw.stop()
    run(go())
