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
        page.click("role=tab[name='Estado']")
        assert "bolt-4b" in page.inner_text("body")
        assert "pair=" not in page.url  # el codigo se borra de la barra
        assert page.evaluate("document.cookie") == ""  # la cookie es HttpOnly
        srv.bus.publish("state", state="thinking")
        page.wait_for_selector("header >> text=Pensando", timeout=5000)
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


# ---- chat (W1) ----------------------------------------------------------------------------------------------------
class ChatServer(Server):
    def __init__(self, tmp_path, script):
        from types import SimpleNamespace as NS
        from piantao.core.agent import AgentEvent
        from piantao.web import ChatSession, WebConfirmer
        super().__init__(tmp_path)
        self.AgentEvent, self.NS = AgentEvent, NS
        self.hist = []
        outer = self

        class Agent:
            conversation_id = None
            history = outer.hist

            async def respond(self, text, **_):
                self.history.append({"role": "user", "content": text})
                async for ev in script(outer, text):
                    yield ev
                yield AgentEvent("done")

            def reset(self):
                self.history.clear()

        self.confirm = WebConfirmer(self.bus, timeout_s=30)
        self.chat = ChatSession(Agent(), self.bus, self.gw.broadcast, self.confirm)
        self.confirm.broadcast, self.confirm.has_clients = self.gw.broadcast, lambda: self.gw.clients > 0
        self.gw.handlers.update(self.chat.handlers())


def pair_and_open(page, srv):
    page.goto(srv.gw.pair_url(srv.code()))
    page.wait_for_selector("text=conectado", timeout=8000)


def test_chat_streams_renders_markdown_safely_and_blocks_xss(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="Hola **mundo** `x`\n\n- uno\n- dos\n\n")
        yield srv.AgentEvent("text", text="<img src=x onerror=window.__pwned=1> [malo](javascript:window.__pwned=2) [bien](https://example.com)\n")
        yield srv.AgentEvent("text", text="```\n<script>window.__pwned=3</script>\n```")

    with ChatServer(tmp_path, script) as srv:
        page = browser.new_page()
        problems = []
        page.on("pageerror", lambda e: problems.append(str(e)))
        pair_and_open(page, srv)
        page.fill("textarea", "hola")
        page.keyboard.press("Enter")
        page.wait_for_selector(".bubble-assistant strong")
        page.wait_for_selector(".bubble-assistant pre.codeblock")
        assert page.inner_text(".bubble-user") == "hola"
        assert page.locator(".bubble-assistant li").count() == 2
        assert page.evaluate("window.__pwned") is None
        assert page.locator(".bubble-assistant img, .bubble-assistant script").count() == 0
        links = page.locator(".bubble-assistant a")
        assert links.count() == 1 and links.first.get_attribute("href") == "https://example.com"
        assert "<img src=x" in page.inner_text(".bubble-assistant")  # se ve como texto, no se interpreta
        assert problems == []
        page.reload()  # el historial vuelve al reconectar
        page.wait_for_selector(".bubble-user")


def test_permission_modal_explicit_phrase_and_deny_default_focus(browser, tmp_path):
    from piantao.security import ActionRequest
    results = {}

    async def script(srv, text):
        ok = await srv.confirm(ActionRequest(kind="shell_exec", description="Borrar todo", details={"tool": "run_command"},
                                             payload="rm -rf <b>x</b>", origin="model", tainted=True), True)
        results["explicit"] = ok
        ok2 = await srv.confirm(ActionRequest(kind="web_fetch", description="Leer una pagina", origin="model"), False)
        results["plain"] = ok2
        yield srv.AgentEvent("text", text="listo")

    with ChatServer(tmp_path, script) as srv:
        page = browser.new_page()
        pair_and_open(page, srv)
        page.fill("textarea", "hacelo")
        page.keyboard.press("Enter")
        page.wait_for_selector("[role=alertdialog]")
        page.wait_for_function("document.activeElement && document.activeElement.textContent === 'Denegar'", timeout=3000)
        assert "contenido no confiable" in page.inner_text(".dialog")
        assert page.inner_text("pre.payload") == "rm -rf <b>x</b>"  # texto plano
        allow = page.locator("button", has_text="Autorizar")
        assert allow.is_disabled()
        page.fill(".dialog input", "confirmar")
        assert allow.is_disabled()
        page.fill(".dialog input", "CONFIRMAR")
        allow.click()
        page.wait_for_selector("text=Leer una pagina")
        page.keyboard.press("Escape")  # Esc = denegar
        page.wait_for_selector(".bubble-assistant:has-text('listo')", timeout=8000)
        assert results == {"explicit": True, "plain": False}


def test_stop_button_interrupts_turn(browser, tmp_path):
    import asyncio as aio

    async def script(srv, text):
        yield srv.AgentEvent("text", text="empiezo...")
        await aio.sleep(30)
        yield srv.AgentEvent("text", text="jamas")

    with ChatServer(tmp_path, script) as srv:
        page = browser.new_page()
        pair_and_open(page, srv)
        page.fill("textarea", "largo")
        page.keyboard.press("Enter")
        page.wait_for_selector("text=empiezo")
        page.click("text=Detener")
        page.wait_for_selector("text=(interrumpido)")
        assert page.locator("button", has_text="Enviar").is_visible()
