"""Pruebas de extremo a extremo en un navegador real (Chromium via Playwright). Se omiten si no esta disponible."""

import asyncio
import threading

import pytest

pw = pytest.importorskip("playwright.sync_api")

from piantao.core import EventBus  # noqa: E402
from piantao.web import PairingManager, SessionStore, WebConfig, WebGateway  # noqa: E402
from piantao.web.gateway import STATIC  # noqa: E402

pytestmark = pytest.mark.skipif(not (STATIC / "index.html").is_file(), reason="interfaz no compilada (npm run build en web/)")


class Server:
    def __init__(self, tmp_path):
        self.bus = EventBus()
        self.pairing = PairingManager(120)

        async def ping(_a):
            return "pong"

        self.gw = WebGateway(self.bus, lambda: {"state": self.bus.state, "provider": "local", "model": "bolt-4b", "mode": "serve"},
                             {"ping": ping}, WebConfig(port=0), SessionStore(tmp_path / "s.json"), self.pairing)
        self.loop = asyncio.new_event_loop()
        self.ready = threading.Event()
        self.thread = threading.Thread(target=self._run, daemon=True)

    def _run(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.gw.start())
        self.ready.set()
        self.loop.run_forever()

    def __enter__(self):
        self.thread.start()
        assert self.ready.wait(10)
        return self

    def code(self):
        return self.pairing.issue()[0]

    def __exit__(self, *a):
        asyncio.run_coroutine_threadsafe(self.gw.stop(), self.loop).result(5)
        self.loop.call_soon_threadsafe(self.loop.stop)
        self.thread.join(5)


@pytest.fixture
def browser():
    with pw.sync_playwright() as p:
        b = p.chromium.launch()
        yield b
        b.close()


def test_pair_from_url_hash_shows_live_shell_without_csp_violations(browser, tmp_path):
    with Server(tmp_path) as srv:
        page = browser.new_page()
        problems = []
        page.on("console", lambda m: problems.append(m.text) if m.type in ("error", "warning") else None)
        page.on("pageerror", lambda e: problems.append(str(e)))
        page.goto(srv.gw.pair_url(srv.code()))
        page.wait_for_selector("text=conectado", timeout=8000)
        assert page.locator("h1").first.inner_text() == "Piantao"
        assert "bolt-4b" in page.inner_text("body")
        assert "pair=" not in page.url  # el codigo se borra de la barra
        assert page.evaluate("document.cookie") == ""  # la cookie es HttpOnly
        srv.bus.publish("state", state="thinking")
        page.wait_for_selector("text=Pensando", timeout=5000)
        assert not [p for p in problems if "Content Security Policy" in p or "Refused" in p], problems
        assert problems == [], problems


def test_manual_code_wrong_then_right_and_reload_keeps_session(browser, tmp_path):
    with Server(tmp_path) as srv:
        page = browser.new_page()
        page.goto(srv.gw.url + "/")
        page.fill("input.code", "ZZZZ-ZZZZ")
        page.click("text=Emparejar")
        page.wait_for_selector("[role=alert]")
        page.fill("input.code", srv.code())
        page.click("text=Emparejar")
        page.wait_for_selector("text=conectado", timeout=8000)
        page.reload()
        page.wait_for_selector("text=conectado", timeout=8000)
        page.click("text=Cerrar sesion")
        page.wait_for_selector("input.code")


def test_other_origin_cannot_use_the_service(browser, tmp_path):
    with Server(tmp_path) as srv:
        page = browser.new_page()
        page.goto(srv.gw.url + "/")
        page.fill("input.code", srv.code())
        page.click("text=Emparejar")
        page.wait_for_selector("text=conectado", timeout=8000)
        other = browser.new_page()
        other.route("http://evil.test/", lambda r: r.fulfill(body="<html></html>", content_type="text/html"))
        other.goto("http://evil.test/")
        res = other.evaluate(
            """async (u) => {
              const out = {};
              try { const r = await fetch(u + '/api/session', {credentials: 'include'}); out.status = r.status; out.body = await r.text(); }
              catch (e) { out.err = String(e); }
              out.ws = await new Promise((ok) => { const w = new WebSocket(u.replace('http', 'ws') + '/ws'); w.onopen = () => ok('open'); w.onerror = () => ok('error'); w.onclose = () => ok('closed'); });
              return out; }""", srv.gw.url)
        assert res["ws"] != "open"
        assert "paired" not in res.get("body", "")
