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
        page.wait_for_selector("button:focus:has-text('Denegar')", timeout=3000)
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


def test_skills_page_lists_reviews_and_cannot_approve(browser, tmp_path):
    from piantao.skills import SkillsConfig, SkillsManager, skills_handlers

    d = tmp_path / "skills" / "demo"
    d.mkdir(parents=True)
    (d / "SKILL.md").write_text("---\nname: demo\ndescription: Hace algo\n---\n# Pasos\n<img src=x onerror=window.__pwned=1>\n")
    (d / "guia.md").write_text("contenido de la guia")
    mgr = SkillsManager(SkillsConfig(), tmp_path)

    async def script(srv, text):
        yield srv.AgentEvent("text", text="ok")

    with ChatServer(tmp_path, script) as srv:
        srv.gw.handlers.update(skills_handlers(mgr))
        page = browser.new_page()
        pair_and_open(page, srv)
        page.click("role=tab[name='Skills']")
        page.wait_for_selector(".skill-row")
        assert "pendiente" in page.inner_text(".skill-row")
        page.click(".skill-row")
        page.wait_for_selector("pre.payload")
        assert "<img src=x" in page.inner_text("pre.payload") and page.evaluate("window.__pwned") is None
        assert "python main.py skills approve demo" in page.inner_text(".warn")
        assert page.locator("button", has_text="Aprobar").count() == 0
        page.click("text=guia.md")
        page.wait_for_selector("pre.payload:has-text('contenido de la guia')")
        mgr.approve("demo")
        page.click("text=Actualizar")
        page.wait_for_selector(".badge-approved")


# ---- skills (WS) --------------------------------------------------------------------------------------------------
def test_skills_page_lists_status_shows_content_as_text_and_cannot_approve(browser, tmp_path):
    from piantao.skills import SkillsConfig, SkillsManager, skills_handlers

    for name, desc in (("buena", "Skill aprobada"), ("nueva", "Skill pendiente <b>x</b>")):
        d = tmp_path / "skills" / name
        d.mkdir(parents=True)
        (d / "SKILL.md").write_text(f"---\nname: {name}\ndescription: {desc}\n---\n# Cuerpo\n<script>window.__pwned=1</script>\n", encoding="utf-8")
    mgr = SkillsManager(SkillsConfig(), tmp_path, None)
    mgr.approve("buena")
    with Server(tmp_path) as srv:
        srv.gw.handlers.update(skills_handlers(mgr))
        assert "skills_approve" not in srv.gw.handlers and not any("approve" in k for k in srv.gw.handlers)
        page = browser.new_page()
        pair_and_open(page, srv)
        page.click("role=tab[name='Skills']")
        page.wait_for_selector(".badge-approved")
        assert page.locator(".badge-pending").count() == 1
        page.click(".skill-row:has-text('nueva')")
        page.wait_for_selector("pre.payload")
        assert "<script>window.__pwned=1</script>" in page.inner_text("pre.payload")
        assert "python main.py skills approve nueva" in page.inner_text(".warn")
        assert page.evaluate("window.__pwned") is None
        assert "<b>x</b>" in page.inner_text(".skill-list")  # la descripcion tambien es texto plano


# ---- voz (W2) -----------------------------------------------------------------------------------------------------
def _tone_wav(path):
    import struct
    import wave

    import numpy as np

    rate = 16000
    t = np.arange(rate * 2) / rate
    voiced = (0.5 * np.sin(2 * np.pi * 220 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 3 * t))).astype(np.float32)
    pcm = np.concatenate([np.zeros(rate, dtype=np.float32), voiced, np.zeros(rate * 3, dtype=np.float32)])
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes((pcm * 32767).astype("<i2").tobytes())


@pytest.fixture
def mic_browser(tmp_path):
    wav = tmp_path / "mic.wav"
    _tone_wav(wav)
    with pw.sync_playwright() as p:
        b = p.chromium.launch(args=["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
                                    f"--use-file-for-fake-audio-capture={wav}", "--autoplay-policy=no-user-gesture-required"])
        yield b
        b.close()


class VoiceServer(ChatServer):
    def __init__(self, tmp_path, script, texts):
        import numpy as np
        from types import SimpleNamespace as NS
        from piantao.voice.audio import AudioConfig
        from piantao.web.voice import VoiceEngines, WebVoice

        super().__init__(tmp_path, script)
        self.stt_calls = []
        texts = list(texts)
        outer = self

        class Stt:
            def transcribe(self, audio):
                outer.stt_calls.append(len(audio))
                return NS(text=texts.pop(0) if texts else "")

        class Tts:
            sample_rate = 24000

            def synthesize(self, text):
                return (0.2 * np.sin(2 * np.pi * 440 * np.arange(24000) / 24000)).astype(np.float32)

            def close(self):
                pass

        eng = VoiceEngines(Stt(), Tts(), None, None)
        self.voice = WebVoice(self.chat, self.bus, AudioConfig(), lambda: eng, self.gw.send_to, self.gw.send_bytes_to,
                              barge_in=False, tail_ms=50)
        self.gw.ctx_handlers.update(self.voice.handlers())
        self.gw.binary_handler = self.voice.on_binary
        self.gw.disconnect_hooks.append(self.voice.on_disconnect)

    def __exit__(self, *a):
        asyncio.run_coroutine_threadsafe(self.voice.close(), self.loop).result(5)
        return super().__exit__(*a)


def test_voice_always_mode_hears_fake_mic_and_plays_reply(mic_browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text=f"Escuché: {text}. ")

    with VoiceServer(tmp_path, script, ["hola desde el micrófono"]) as srv:
        ctx = mic_browser.new_context(permissions=["microphone"])
        page = ctx.new_page()
        problems = []
        page.on("pageerror", lambda e: problems.append(str(e)))
        page.on("console", lambda m: problems.append(m.text) if m.type == "error" else None)
        pair_and_open(page, srv)
        page.wait_for_selector(".voicebar")
        page.select_option(".voicebar select", "always")
        page.click("text=Activar micrófono")
        page.wait_for_selector("text=Apagar micrófono", timeout=10000)
        page.wait_for_selector("text=hola desde el micrófono", timeout=15000)  # «Entendí: ...» y la burbuja del usuario
        page.wait_for_selector(".bubble-assistant:has-text('Escuché')", timeout=10000)
        page.wait_for_selector(".vstate-speaking", timeout=10000)  # llego audio y se esta reproduciendo
        assert srv.stt_calls and srv.stt_calls[0] > 16000 // 4
        page.click("text=Apagar micrófono")
        page.wait_for_selector("text=Activar micrófono")
        assert not srv.voice.active
        assert problems == [], problems  # incluye errores de JavaScript al decodificar el audio recibido


def test_voice_ptt_only_sends_audio_while_pressed(mic_browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="ok")

    with VoiceServer(tmp_path, script, ["pulsé y hablé"]) as srv:
        ctx = mic_browser.new_context(permissions=["microphone"])
        page = ctx.new_page()
        pair_and_open(page, srv)
        page.wait_for_selector(".voicebar")
        page.click("text=Activar micrófono")
        page.wait_for_selector("text=Mantener para hablar", timeout=10000)
        page.wait_for_timeout(2500)  # sin pulsar no sale audio
        assert srv.stt_calls == []
        page.keyboard.down("Space")
        page.wait_for_timeout(2600)  # cubre el tramo con voz del archivo falso
        page.keyboard.up("Space")
        page.wait_for_selector("text=pulsé y hablé", timeout=10000)
        assert len(srv.stt_calls) == 1


def test_voice_mic_permission_denied_shows_error_and_keeps_server_clean(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with VoiceServer(tmp_path, script, []) as srv:
        ctx = browser.new_context()  # sin permiso de microfono
        page = ctx.new_page()
        pair_and_open(page, srv)
        page.wait_for_selector(".voicebar")
        page.click("text=Activar micrófono")
        page.wait_for_selector("text=Activar micrófono", timeout=8000)
        assert not srv.voice.active
