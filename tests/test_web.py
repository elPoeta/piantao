import asyncio
import json
import time

import aiohttp
import pytest

from piantao.core import EventBus
from piantao.web import PairingManager, SessionStore, WebConfig, WebConfigError, WebGateway
from piantao.web.gateway import CSRF_HEADER, COOKIE, STATIC


def run(coro):
    return asyncio.run(coro)


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


# ---- emparejamiento ---------------------------------------------------------------------------------------------
def test_pairing_single_use_and_normalization():
    p = PairingManager(120)
    code, ttl = p.issue()
    assert ttl == 120 and len(code) == 9 and code[4] == "-"
    assert p.redeem(code.lower().replace("-", " ")) is True
    assert p.redeem(code) is False  # un solo uso


def test_pairing_expires_and_new_code_invalidates_old():
    c = Clock()
    p = PairingManager(60, clock=c)
    old, _ = p.issue()
    new, _ = p.issue()
    assert p.redeem(old) is False
    c.t += 61
    assert p.redeem(new) is False  # vencido


def test_pairing_lockout_after_failures_even_with_right_code():
    c = Clock()
    p = PairingManager(120, clock=c)
    code, _ = p.issue()
    for _ in range(5):
        assert p.redeem("AAAA-AAAA") is False
    assert p.locked and p.redeem(code) is False
    c.t += 61
    code2, _ = p.issue()
    assert p.redeem(code2) is True


def test_pairing_rejects_non_strings():
    p = PairingManager()
    p.issue()
    assert p.redeem(None) is False and p.redeem(12345678) is False and p.redeem("A" * 500) is False


# ---- sesiones ---------------------------------------------------------------------------------------------------
def test_sessions_store_only_hashes_and_persist(tmp_path):
    f = tmp_path / "s.json"
    s = SessionStore(f)
    tok = s.create()
    assert tok not in f.read_text() and oct(f.stat().st_mode & 0o777) == "0o600"
    assert SessionStore(f).verify(tok) is not None
    assert s.verify("otro") is None and s.verify(None) is None


def test_sessions_expire_idle_and_age_and_revoke():
    c = Clock()
    s = SessionStore(None, max_age_s=1000, idle_s=100, clock=c)
    a = s.create()
    c.t += 50
    assert s.verify(a)
    c.t += 101
    assert s.verify(a) is None
    b = s.create()
    for _ in range(30):
        c.t += 90
        s.verify(b)
    assert s.verify(b) is None  # supero la edad maxima aunque estuvo activa
    d = s.create()
    s.revoke(d)
    assert s.verify(d) is None


def test_sessions_cap_drops_oldest():
    c = Clock()
    s = SessionStore(None, max_sessions=2, clock=c)
    t1 = s.create()
    c.t += 1
    t2 = s.create()
    c.t += 1
    t3 = s.create()
    assert s.verify(t1) is None and s.verify(t2) and s.verify(t3)


def test_config_validation():
    assert WebConfig.from_config({"web": {"web": {"port": 9000}}}).port == 9000
    for bad in ({"host": "0.0.0.0"}, {"port": 80}, {"port": "x"}, {"enabled": "si"}, {"nope": 1}):
        with pytest.raises(WebConfigError):
            WebConfig.from_config({"web": {"web": bad}})


# ---- pasarela ---------------------------------------------------------------------------------------------------
def make_gw(tmp_path, handlers=None, **cfg):
    bus = EventBus()
    wc = WebConfig(port=0, **cfg)
    sessions = SessionStore(tmp_path / "s.json")
    pairing = PairingManager(120)
    audit = []
    h = {"ping": _ping}
    h.update(handlers or {})
    gw = WebGateway(bus, lambda: {"state": bus.state, "model": "bolt"}, h, wc, sessions, pairing,
                    lambda ev, **kw: audit.append((ev, kw)))
    gw.test_audit = audit
    return gw, bus, pairing, sessions


async def _ping(args):
    return "pong"


def H(gw, **extra):
    h = {"Origin": gw.url}
    h.update(extra)
    return h


async def do_pair(sess, gw, pairing):
    code, _ = pairing.issue()
    r = await sess.post(gw.url + "/api/pair", json={"code": code}, headers=H(gw, **{CSRF_HEADER: "1"}))
    return r


def test_index_security_headers_and_no_session(tmp_path):
    async def go():
        gw, *_ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                r = await s.get(gw.url + "/")
                assert r.status == 200
                csp = r.headers["Content-Security-Policy"]
                assert "default-src 'none'" in csp and "unsafe-inline" not in csp and "unsafe-eval" not in csp.replace("wasm-unsafe-eval", "")
                assert r.headers["X-Content-Type-Options"] == "nosniff" and r.headers["Cross-Origin-Opener-Policy"] == "same-origin"
                assert "frame-ancestors 'none'" in csp
                j = await (await s.get(gw.url + "/api/session")).json()
                assert j["paired"] is False
        finally:
            await gw.stop()
    run(go())


def test_binds_loopback_only(tmp_path):
    async def go():
        gw, *_ = make_gw(tmp_path)
        await gw.start()
        try:
            socks = list(gw._runner.sites)[0]._server.sockets
            assert {s.getsockname()[0] for s in socks} <= {"127.0.0.1", "::1"}
        finally:
            await gw.stop()
    run(go())


def test_host_header_rejected_dns_rebinding(tmp_path):
    async def go():
        gw, *_ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                r = await s.get(gw.url + "/", headers={"Host": "evil.example.com"})
                assert r.status == 421
                r = await s.get(gw.url + "/", headers={"Host": f"evil.example.com:{gw.port}"})
                assert r.status == 421
        finally:
            await gw.stop()
    run(go())


def test_pair_flow_cookie_flags_and_ws(tmp_path):
    async def go():
        gw, bus, pairing, _ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                r = await do_pair(s, gw, pairing)
                assert r.status == 200
                ck = r.headers["Set-Cookie"]
                assert COOKIE in ck and "HttpOnly" in ck and "SameSite=Strict" in ck
                assert (await (await s.get(gw.url + "/api/session")).json())["paired"] is True
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    hello = json.loads((await ws.receive()).data)
                    snap = json.loads((await ws.receive()).data)
                    assert hello["t"] == "hello" and snap["t"] == "snapshot" and snap["data"]["model"] == "bolt"
                    await ws.send_str(json.dumps({"t": "cmd", "id": 7, "name": "ping"}))
                    rep = json.loads((await ws.receive()).data)
                    assert rep == {"t": "reply", "id": 7, "ok": True, "data": "pong"}
                    bus.set_state("thinking") if hasattr(bus, "set_state") else bus.publish("state", {"state": "thinking"})
                    ev = json.loads((await asyncio.wait_for(ws.receive(), 2)).data)
                    assert ev["t"] == "event"
            assert ("web_pair", {"ok": True}) in gw.test_audit
        finally:
            await gw.stop()
    run(go())


def test_pair_requires_origin_csrf_and_valid_code(tmp_path):
    async def go():
        gw, _, pairing, _ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                code, _ = pairing.issue()
                body = {"code": code}
                # sin cabecera CSRF
                r = await s.post(gw.url + "/api/pair", json=body, headers=H(gw))
                assert r.status == 403
                # origen ajeno
                r = await s.post(gw.url + "/api/pair", json=body, headers={"Origin": "http://evil.example", CSRF_HEADER: "1"})
                assert r.status == 403
                # sin origen
                r = await s.post(gw.url + "/api/pair", json=body, headers={CSRF_HEADER: "1"})
                assert r.status == 403
                # codigo malo
                r = await s.post(gw.url + "/api/pair", json={"code": "ZZZZ-ZZZZ"}, headers=H(gw, **{CSRF_HEADER: "1"}))
                assert r.status == 403
                # JSON roto / tipo raro
                r = await s.post(gw.url + "/api/pair", data=b"{", headers=H(gw, **{CSRF_HEADER: "1"}))
                assert r.status == 400
                r = await s.post(gw.url + "/api/pair", json=[1], headers=H(gw, **{CSRF_HEADER: "1"}))
                assert r.status == 403
                assert (await (await s.get(gw.url + "/api/session")).json())["paired"] is False
        finally:
            await gw.stop()
    run(go())


def test_pair_rate_limit_returns_429(tmp_path):
    async def go():
        gw, _, pairing, _ = make_gw(tmp_path)
        await gw.start()
        try:
            code, _ = pairing.issue()
            async with aiohttp.ClientSession() as s:
                for _ in range(5):
                    r = await s.post(gw.url + "/api/pair", json={"code": "AAAA-AAAA"}, headers=H(gw, **{CSRF_HEADER: "1"}))
                    assert r.status == 403
                r = await s.post(gw.url + "/api/pair", json={"code": code}, headers=H(gw, **{CSRF_HEADER: "1"}))
                assert r.status == 429
        finally:
            await gw.stop()
    run(go())


def test_ws_requires_session_and_origin(tmp_path):
    async def go():
        gw, _, pairing, _ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as anon:
                with pytest.raises(aiohttp.WSServerHandshakeError) as e:
                    await anon.ws_connect(gw.url + "/ws", headers={"Origin": gw.url})
                assert e.value.status == 401
            async with aiohttp.ClientSession() as s:
                await do_pair(s, gw, pairing)
                with pytest.raises(aiohttp.WSServerHandshakeError) as e:
                    await s.ws_connect(gw.url + "/ws", headers={"Origin": "http://evil.example"})
                assert e.value.status == 403
                with pytest.raises(aiohttp.WSServerHandshakeError) as e:
                    await s.ws_connect(gw.url + "/ws")  # sin Origin
                assert e.value.status == 403
        finally:
            await gw.stop()
    run(go())


def test_ws_unknown_command_bad_json_and_errors(tmp_path):
    async def boom(args):
        raise ValueError("argumento malo")

    async def crash(args):
        raise RuntimeError("secreto interno")

    async def go():
        gw, _, pairing, _ = make_gw(tmp_path, {"boom": boom, "crash": crash})
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                await do_pair(s, gw, pairing)
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    await ws.receive(); await ws.receive()

                    async def ask(payload):
                        await ws.send_str(payload if isinstance(payload, str) else json.dumps(payload))
                        return json.loads((await ws.receive()).data)

                    assert (await ask({"t": "cmd", "id": 1, "name": "pair_code"}))["ok"] is False  # no existe por la web
                    assert (await ask({"t": "cmd", "id": 2, "name": "boom"}))["error"] == "argumento malo"
                    r = await ask({"t": "cmd", "id": 3, "name": "crash"})
                    assert r["ok"] is False and "secreto" not in json.dumps(r)
                    assert (await ask("no es json"))["ok"] is False
                    assert (await ask({"t": "otro", "id": 4}))["ok"] is False
                    assert (await ask({"t": "cmd", "id": 5, "name": "ping", "args": [1]}))["ok"] is False
        finally:
            await gw.stop()
    run(go())


def test_logout_and_revocation_close_ws(tmp_path):
    async def go():
        gw, _, pairing, sessions = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                await do_pair(s, gw, pairing)
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    await ws.receive(); await ws.receive()
                    sessions.revoke_all()
                    await ws.send_str(json.dumps({"t": "cmd", "id": 1, "name": "ping"}))
                    msg = await asyncio.wait_for(ws.receive(), 2)
                    assert msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSED, aiohttp.WSMsgType.CLOSING)
                assert (await (await s.get(gw.url + "/api/session")).json())["paired"] is False
        finally:
            await gw.stop()
    run(go())


def test_slow_client_is_dropped_without_blocking_bus(tmp_path):
    async def go():
        gw, bus, pairing, _ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                await do_pair(s, gw, pairing)
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    await ws.receive(); await ws.receive()
                    c = next(iter(gw._clients))
                    t0 = time.monotonic()
                    for i in range(2000):  # sin leer: la cola acotada se llena y se lo corta
                        c.send({"t": "event", "kind": "x", "data": {"i": i}, "ts": 0})
                    assert time.monotonic() - t0 < 2
                    await asyncio.sleep(0.2)
                    assert c._closed
        finally:
            await gw.stop()
    run(go())


def test_static_path_traversal_blocked(tmp_path):
    async def go():
        gw, *_ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                for path in ("/assets/../../../etc/passwd", "/assets/%2e%2e/%2e%2e/main.py", "/main.py", "/config/web.yaml"):
                    r = await s.get(gw.url + path)
                    assert r.status in (403, 404), path
        finally:
            await gw.stop()
    run(go())


def test_hud_and_pwa_shell_files_are_served_with_fixed_names_and_security_headers(tmp_path):
    async def go():
        gw, *_ = make_gw(tmp_path)
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                hud = await s.get(gw.url + "/hud")
                assert hud.status == 200 and "text/html" in hud.headers["Content-Type"] and "default-src 'none'" in hud.headers["Content-Security-Policy"]
                for name, ctype in (("manifest.webmanifest", "application/manifest+json"), ("sw.js", "javascript"), ("icon.svg", "image/svg+xml"),
                                    ("icon-192.png", "image/png"), ("icon-512.png", "image/png")):
                    r = await s.get(f"{gw.url}/{name}")
                    assert r.status == 200 and ctype in r.headers["Content-Type"], name
                    assert r.headers["X-Content-Type-Options"] == "nosniff"
                # nada fuera de la lista fija, y el Host sigue controlado
                for bad in ("/manifest.json", "/sw.js/..%2f..%2fmain.py", "/icon-192.png%00", "/hud/../main.py"):
                    assert (await s.get(gw.url + bad)).status in (400, 403, 404), bad
                r = await s.get(gw.url + "/sw.js", headers={"Host": "evil.example"})
                assert r.status == 421
                man = json.loads(await (await s.get(gw.url + "/manifest.webmanifest")).text())
                assert man["start_url"] == "/" and man["display"] == "standalone" and any(i["sizes"] == "512x512" for i in man["icons"])
        finally:
            await gw.stop()
    run(go())


def test_service_worker_never_caches_api_ws_or_session_data():
    code = "\n".join(l for l in (STATIC / "sw.js").read_text(encoding="utf-8").splitlines() if not l.strip().startswith("//"))
    assert '"/assets/"' in code
    for forbidden in ("/api", "/ws", "/media", "/vision"):
        assert forbidden not in code, forbidden
    assert 'req.method !== "GET"' in code and "url.origin !== self.location.origin" in code
