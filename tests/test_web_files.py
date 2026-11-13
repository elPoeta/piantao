import asyncio
import os

import aiohttp
import pytest

from piantao.core import EventBus
from piantao.web import FileBrowser, PairingManager, SessionStore, WebConfig, WebGateway
from piantao.web.gateway import CSRF_HEADER

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea75b81e30000000049454e44ae426082")


@pytest.fixture
def tree(tmp_path):
    ws = tmp_path / "workspace"
    (ws / "sub").mkdir(parents=True)
    (ws / "nota.md").write_text("# Hola\n<script>x</script>", encoding="utf-8")
    (ws / "foto.png").write_bytes(PNG)
    (ws / "dibujo.svg").write_text("<svg/>")
    (ws / "bin.dat").write_bytes(b"\x00\x01\x02")
    (ws / ".oculto").write_text("x")
    (ws / "sub" / "a.py").write_text("print(1)\n")
    secret = tmp_path / "secret"
    secret.mkdir()
    (secret / "clave.txt").write_text("shh")
    (ws / "escape").symlink_to(secret)
    (ws / "escape_file.txt").symlink_to(secret / "clave.txt")
    prot = ws / "privado"
    prot.mkdir()
    (prot / "x.txt").write_text("no")
    return tmp_path, FileBrowser([ws], [prot])


def test_list_orders_dirs_first_and_hides_hidden_symlink_escapes_and_protected(tree):
    _, fb = tree
    out = fb.list_dir(0, "")
    names = [e["name"] for e in out["entries"]]
    assert names[0] == "sub" and "nota.md" in names and "foto.png" in names
    assert ".oculto" not in names and "escape" not in names and "escape_file.txt" not in names and "privado" not in names
    kinds = {e["name"]: e["kind"] for e in out["entries"]}
    assert kinds["foto.png"] == "image" and kinds["nota.md"] == "text" and kinds["dibujo.svg"] == "other" and kinds["sub"] == "dir"
    sub = fb.list_dir(0, "sub")
    assert sub["parent"] == "" and sub["path"] == "sub" and fb.list_dir(0, "")["parent"] is None


@pytest.mark.parametrize("rel", ["../secret/clave.txt", "..", "sub/../../secret", "/etc/passwd", "escape/clave.txt", "escape_file.txt", "privado", "privado/x.txt", "a\x00b", "sub\\..\\x", 5])
def test_paths_cannot_escape_or_reach_protected(tree, rel):
    _, fb = tree
    with pytest.raises(ValueError):
        fb.resolve(0, rel)


@pytest.mark.parametrize("root", [-1, 1, "0", True, None, 1.5])
def test_bad_roots_rejected(tree, root):
    _, fb = tree
    with pytest.raises(ValueError):
        fb.list_dir(root, "")


def test_read_text_image_binary_and_limits(tree):
    _, fb = tree
    t = fb.read(0, "nota.md")
    assert t["kind"] == "text" and "<script>x</script>" in t["text"]  # texto plano: el cliente no lo interpreta
    i = fb.read(0, "foto.png")
    assert i["kind"] == "image" and i["url"] == "/api/file?root=0&path=foto.png"
    assert fb.read(0, "bin.dat")["kind"] == "other"
    assert fb.read(0, "dibujo.svg")["kind"] == "other"
    with pytest.raises(ValueError):
        fb.read(0, "sub")
    big = tree[0] / "workspace" / "grande.txt"
    big.write_text("x" * 200_000)
    r = fb.read(0, "grande.txt")
    assert len(r["text"]) == 60000 and r["truncated"] is True


def test_from_config_uses_agent_dirs_and_expands_relative(tmp_path):
    (tmp_path / "workspace").mkdir()
    (tmp_path / "data").mkdir()
    cfg = {"permissions": {"file_access": {"allowed_dirs": ["workspace", "data"], "protected": ["data"]}}}
    fb = FileBrowser.from_config(cfg, tmp_path)
    assert [r["name"] for r in fb.list_roots()] == ["workspace"]  # una raiz protegida no se ofrece


def test_missing_workspace_lists_as_nonexistent(tmp_path):
    fb = FileBrowser([tmp_path / "nada"])
    assert fb.list_roots()[0]["exists"] is False
    with pytest.raises(ValueError):
        fb.list_dir(0, "")


def test_http_image_requires_session_and_only_serves_images_inside(tree, tmp_path_factory):
    tmp, fb = tree

    async def go():
        bus = EventBus()
        pm = PairingManager(120)
        gw = WebGateway(bus, lambda: {}, {}, WebConfig(port=0), SessionStore(tmp / "s.json"), pm)
        gw.files = fb
        await gw.start()
        base = gw.url
        try:
            async with aiohttp.ClientSession() as anon:
                async with anon.get(f"{base}/api/file?root=0&path=foto.png") as r:
                    assert r.status == 401
            async with aiohttp.ClientSession(headers={CSRF_HEADER: "1", "Origin": base}) as s:
                async with s.post(f"{base}/api/pair", json={"code": pm.issue()[0]}) as r:
                    assert r.status == 200
                async with s.get(f"{base}/api/file?root=0&path=foto.png") as r:
                    assert r.status == 200 and r.headers["Content-Type"] == "image/png" and (await r.read()) == PNG
                for q in ("path=nota.md", "path=dibujo.svg", "path=../secret/clave.txt", "path=escape_file.txt", "path=privado/x.txt", "path=..%2Fsecret%2Fclave.txt", "root=9&path=foto.png", "path=sub"):
                    q = q if "root=" in q else "root=0&" + q
                    async with s.get(f"{base}/api/file?{q}") as r:
                        assert r.status == 404, q
        finally:
            await gw.stop()

    asyncio.run(go())
