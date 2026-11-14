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


# ---- vision (W3) ----------------------------------------------------------------------------------------------------
class VisionServer(ChatServer):
    def __init__(self, tmp_path, script, model=None):
        from piantao.gestures import GestureConfig, GestureHub, GesturePolicy, Thresholds, make_gesture_confirmer
        from piantao.web import WebVision

        super().__init__(tmp_path, script)
        self.hub = GestureHub(GesturePolicy(), self.bus, out=lambda *a, **k: None)
        self.interrupts = []
        self.hub.on_interrupt = lambda: self.interrupts.append(1)
        self.vision = WebVision(self.hub, self.bus, GestureConfig(), Thresholds(), tmp_path / "cal.json", self.gw.send_to)
        self.gw.ctx_handlers.update(self.vision.handlers())
        from piantao.web.vision import BIN_LANDMARKS
        self.gw.binary_handlers[BIN_LANDMARKS] = self.vision.on_binary
        self.gw.disconnect_hooks.append(self.vision.on_disconnect)
        self.gw.hand_model = model
        self.confirm.extra = lambda r, e: {"gesture": {"available": self.hub.eligible(r, e), "blocked": self.hub.blocked_reason(r, e)}}
        self.gestured = make_gesture_confirmer(self.confirm, self.hub)


def test_vision_page_offers_camera_and_reports_missing_model_clearly(mic_browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with VisionServer(tmp_path, script, model=tmp_path / "no-existe.task") as srv:
        ctx = mic_browser.new_context(permissions=["camera"])
        page = ctx.new_page()
        problems = []
        page.on("pageerror", lambda e: problems.append(str(e)))
        pair_and_open(page, srv)
        page.wait_for_selector(".visionbar")
        page.click("text=Activar cámara y gestos")
        page.wait_for_selector("[role=alert]:has-text('fetch_models')", timeout=20000)  # el modelo no esta: mensaje accionable
        page.wait_for_selector("text=Activar cámara y gestos")
        assert not srv.vision.active and not srv.hub.active
        assert problems == [], problems


def test_vision_wasm_and_assets_load_under_strict_csp(mic_browser, tmp_path):
    """El runtime de MediaPipe (JS + WASM) se carga desde este mismo servicio sin violar la politica de contenido."""
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    model = tmp_path / "fake.task"
    model.write_bytes(b"no es un modelo")
    with VisionServer(tmp_path, script, model=model) as srv:
        ctx = mic_browser.new_context(permissions=["camera"])
        page = ctx.new_page()
        violations = []
        page.on("console", lambda m: violations.append(m.text) if "Content Security Policy" in m.text or "Refused" in m.text else None)
        requested = []
        page.on("requestfinished", lambda r: requested.append(r.url))
        pair_and_open(page, srv)
        page.click("text=Activar cámara y gestos")
        page.wait_for_selector("[role=alert]", timeout=30000)  # modelo invalido: falla DESPUES de cargar el runtime
        assert any(u.endswith("vision_wasm_internal.wasm") for u in requested), requested
        assert any(u.endswith("hand_landmarker.task") for u in requested)
        assert violations == [], violations
        assert all(u.startswith(srv.gw.url) for u in requested)  # nada sale a internet


def test_synthetic_landmarks_over_real_websocket_drive_palm_and_confirmation(browser, tmp_path):
    """Una pagina autenticada manda tramas binarias de puntos sinteticos; el servidor decide los gestos."""
    from piantao.security import ActionRequest

    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with VisionServer(tmp_path, script) as srv:
        page = browser.new_page()
        pair_and_open(page, srv)
        make_js = """
        (async () => {
          const ws = new WebSocket(`ws://${location.host}/ws`);
          window.__msgs = []; window.__ws = ws;
          ws.binaryType = 'arraybuffer';
          ws.onmessage = (m) => { if (typeof m.data === 'string') window.__msgs.push(JSON.parse(m.data)); };
          await new Promise((r) => ws.onopen = r);
          const cmd = (name, args) => new Promise((ok) => { const id = Math.floor(Math.random()*1e9);
            const h = (m) => { if (typeof m.data === 'string') { const j = JSON.parse(m.data); if (j.t === 'reply' && j.id === id) { ws.removeEventListener('message', h); ok(j); } } };
            ws.addEventListener('message', h); ws.send(JSON.stringify({t:'cmd', id, name, args})); });
          window.__cmd = cmd;
          return (await cmd('vision_start', {aspect: 1.333})).ok;
        })()
        """
        # el cliente de la pagina ya tiene su propia conexion: usamos otra para que la camara quede en ESTA conexion de prueba
        assert page.evaluate(make_js) is True
        hand = """
        (pose) => {
          const pts = new Float32Array(63);
          const MCP = {5:0.45, 9:0.50, 13:0.55, 17:0.60};
          for (let i = 0; i < 21; i++) { pts[i*3] = 0.5; pts[i*3+1] = 0.8; }
          for (const [b, x] of Object.entries(MCP)) { const k = Number(b);
            const ext = pose === 'open';
            const ys = [0.6, ext ? 0.5 : 0.55, ext ? 0.45 : 0.6, ext ? 0.40 : 0.67];
            for (let j = 0; j < 4; j++) { pts[(k+j)*3] = x; pts[(k+j)*3+1] = ys[j]; } }
          pts[3] = 0.42; pts[4] = 0.78; pts[6] = 0.40; pts[7] = 0.72; pts[9] = 0.40; pts[10] = 0.6;
          const tip = pose === 'up' ? [0.40, 0.45] : pose === 'open' ? [0.20, 0.72] : [0.50, 0.65];
          pts[12] = tip[0]; pts[13] = tip[1];
          const buf = new ArrayBuffer(6 + 254); const dv = new DataView(buf);
          dv.setUint8(0, 3); dv.setUint32(1, 0, true); dv.setUint8(5, 1); dv.setUint8(6, 1); dv.setUint8(7, 230);
          for (let i = 0; i < 63; i++) dv.setFloat32(8 + i*4, pts[i] * (i % 3 === 0 ? 1/1.333 : 1), true);
          return buf; }
        """
        page.evaluate(f"window.__hand = {hand}")
        page.evaluate("""async () => { for (let i = 0; i < 40; i++) { window.__ws.send(window.__hand('open')); await new Promise(r => setTimeout(r, 50)); } }""")
        until(page, "() => window.__msgs.some(m => m.t === 'vision' && m.ev === 'gesture' && m.name === 'palm')", 5000)
        assert srv.interrupts, "la palma debe interrumpir"
        until(page, "() => window.__msgs.some(m => m.t === 'vision' && m.ev === 'status' && m.pose === 'open_palm')", 3000)

        async_confirm = {}

        async def ask():
            req = ActionRequest(kind="shell_exec", description="Ejecutar ls", details={"tool": "run_command"}, origin="model")
            async_confirm["r"] = await srv.gestured(req, False)

        fut = __import__("asyncio").run_coroutine_threadsafe(ask(), srv.loop)
        until(page, "() => window.__msgs.some(m => m.t === 'confirm' && m.extra && m.extra.gesture && m.extra.gesture.available)", 5000)
        page.evaluate("""async () => { for (let i = 0; i < 40; i++) { window.__ws.send(window.__hand('open')); await new Promise(r => setTimeout(r, 50)); } }""")
        until(page, "() => window.__msgs.some(m => m.t === 'vision' && m.ev === 'gesture' && m.name === 'activate')", 5000)
        page.evaluate("""async () => { for (let i = 0; i < 40; i++) { window.__ws.send(window.__hand('up')); await new Promise(r => setTimeout(r, 50)); } }""")
        assert fut.result(10) is None and async_confirm["r"] is True
        until(page, "() => window.__msgs.some(m => m.t === 'confirm_done')", 3000)
        # basura binaria: se ignora y la conexion sigue viva
        page.evaluate("window.__ws.send(new Uint8Array([3, 1, 2, 3]))")
        assert page.evaluate("window.__cmd('vision_info', {}).then(r => r.ok)") is True


# ---- holograma (W4) -----------------------------------------------------------------------------------------------
PNG_1PX = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea75b81e30000000049454e44ae426082")


class BoardServer(ChatServer):
    def __init__(self, tmp_path, script):
        from piantao.web import Board

        super().__init__(tmp_path, script)
        media = tmp_path / "media"
        media.mkdir(exist_ok=True)
        (media / "foto.png").write_bytes(PNG_1PX)
        self.board = Board(media, self.gw.broadcast, lambda: self.gw.clients > 0)
        self.gw.board = self.board
        self.gw.handlers.update(self.board.handlers())

        async def query(args):
            return [{"ts": 1.0, "tool": "web_fetch", "decision": "allow"}]

        self.gw.handlers["query"] = query
        from piantao.web import FileBrowser

        ws = tmp_path / "workspace"
        (ws / "docs").mkdir(parents=True)
        (ws / "docs" / "informe.md").write_text("Informe <i>final</i>\nlinea dos", encoding="utf-8")
        (ws / "foto.png").write_bytes(PNG_1PX)
        (ws / "notas.txt").write_text("hola notas", encoding="utf-8")
        self.gw.files = FileBrowser([ws])
        self.gw.handlers.update(self.gw.files.handlers())

    def add(self, **kw):
        done = threading.Event()

        def go():
            self.board.add(**kw)
            done.set()

        self.loop.call_soon_threadsafe(go)
        assert done.wait(5)


def _bright(png: bytes, x0, y0, x1, y1) -> int:
    import io

    Image = pytest.importorskip("PIL.Image")
    im = Image.open(io.BytesIO(png)).convert("RGB").crop((x0, y0, x1, y1))
    return sum(1 for px in im.getdata() if sum(px) > 150)


def until(page, fn: str, timeout_ms: int) -> None:
    """Espera una condicion JS sin page.wait_for_function (que evalua texto y la CSP estricta lo bloquea a veces)."""
    import time

    end = time.monotonic() + timeout_ms / 1000
    while time.monotonic() < end:
        if page.evaluate(fn):
            return
        page.wait_for_timeout(50)
    raise AssertionError(f"condicion no cumplida: {fn}")


def open_holo(page, srv):
    problems = []
    page.on("pageerror", lambda e: problems.append(str(e)))
    page.on("console", lambda m: problems.append(m.text) if m.type == "error" else None)
    pair_and_open(page, srv)
    page.evaluate("location.hash = '#holo-debug'")          # expone el modelo de interaccion (solo lectura en las pruebas)
    page.click("role=tab[name='Holo']")
    page.wait_for_selector("canvas.holo-scene")
    until(page, "() => !!window.__holo", 5000)
    return problems


def card_center(page, cid):
    return page.evaluate("""(id) => { const h = window.__holo, c = h.cards.get(id); if (!c) return null;
        const s = h.toScreenFromBoard({x: c.x, y: c.y}); return {x: s.x, y: s.y, w: c.w * c.scale * h.board.scale, h: c.h * c.scale * h.board.scale,
        rx: c.rx, ry: c.ry, kind: c.kind, rows: c.rows, ch: c.h, cs: c.scale}; }""", cid)


def card_ids(page):
    return page.evaluate("() => [...window.__holo.cards.keys()]")


def click(page, x, y):
    page.mouse.move(x, y); page.wait_for_timeout(60)
    page.mouse.down(); page.wait_for_timeout(50); page.mouse.up(); page.wait_for_timeout(120)


def open_explorer_with_core(page):
    ring = page.evaluate("() => ({x: window.__holo.ring.x, y: window.__holo.ring.y})")
    click(page, ring["x"], ring["y"])                                   # tocar el nucleo despliega las burbujas
    until(page, "() => window.__holo.ring.bloom === 1", 4000)
    o = page.evaluate("() => window.__holo.orbits.find(o => o.id === 'files')")
    click(page, o["x"], o["y"])
    until(page, "() => window.__holo.cards.has('files-list')", 4000)


def click_row(page, rid_index):
    c = card_center(page, "files-list")
    row = c["rows"][rid_index]
    y = c["y"] - c["h"] / 2 + (row["y0"] + row["y1"]) / 2 * c["cs"]
    click(page, c["x"] - 40, y)


def test_holo_shows_cards_from_the_agent_draws_them_and_closing_reaches_the_server(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with BoardServer(tmp_path, script) as srv:
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        problems = open_holo(page, srv)
        assert page.locator(".holo-list summary").first.inner_text() == "Tarjetas (0)"
        srv.add(title="Resumen <b>x</b>", text="Hola mundo " * 8, image="foto.png")
        page.wait_for_selector(".holo-list summary:has-text('Tarjetas (1)')")
        page.wait_for_timeout(500)
        c = card_center(page, [i for i in card_ids(page)][0])
        shot = page.screenshot()
        assert _bright(shot, int(c["x"] - c["w"] / 2), int(c["y"] - c["h"] / 2), int(c["x"] + c["w"] / 2), int(c["y"] + c["h"] / 2)) > 500
        # el esqueleto de la mano no existe en el DOM y no se dibuja nada fuera de la escena
        assert page.locator("canvas.holo-skel").count() == 0
        page.click(".holo-list summary >> nth=0")
        assert "Resumen <b>x</b>" in page.inner_text(".holo-list li")
        assert page.evaluate("window.__pwned") is None
        page.click(".holo-list li button:text-is('Cerrar')")
        page.wait_for_selector(".holo-list summary:has-text('Tarjetas (0)')")
        for _ in range(50):
            if not srv.board.cards:
                break
            page.wait_for_timeout(100)
        assert srv.board.cards == {}
        assert problems == [], problems


def test_holo_mouse_drags_a_card_clicking_opens_a_window_that_scrolls_tilts_and_closes(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with BoardServer(tmp_path, script) as srv:
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        problems = open_holo(page, srv)
        srv.add(title="Informe", text="parrafo " * 300)
        page.wait_for_selector(".holo-list summary:has-text('Tarjetas (1)')")
        page.wait_for_timeout(500)
        cid = card_ids(page)[0]
        c = card_center(page, cid)
        # arrastrar con el raton
        page.mouse.move(c["x"] - 60, c["y"]); page.mouse.down()
        for i in range(1, 21):
            page.mouse.move(c["x"] - 60 + i * 25, c["y"] + i * 4); page.wait_for_timeout(16)
        page.mouse.up(); page.wait_for_timeout(500)
        c2 = card_center(page, cid)
        assert c2["x"] > c["x"] + 350
        # un clic abre una VENTANA en la escena (no un panel HTML) con el texto completo disponible
        click(page, c2["x"] - 60, c2["y"])
        wid = f"win-{cid}"
        until(page, f"() => window.__holo.cards.has('{wid}')", 4000)
        assert page.locator(".holo-reader").count() == 0
        w = card_center(page, wid)
        assert w["kind"] == "window" and w["w"] > 300
        # la rueda desplaza el documento: la textura cambia
        page.wait_for_timeout(300)
        box = (int(w["x"] - w["w"] / 2) + 10, int(w["y"] - w["h"] / 2) + 80, int(w["x"] + w["w"] / 2) - 10, int(w["y"] + w["h"] / 2) - 20)
        before = page.screenshot()
        page.mouse.move(w["x"], w["y"]); page.mouse.wheel(0, 500); page.wait_for_timeout(500)
        after = page.screenshot()
        assert before != after and _bright(after, *box) > 200
        # Shift+arrastrar la inclina en 3D
        page.keyboard.down("Shift")
        page.mouse.move(w["x"], w["y"] + 100); page.mouse.down()
        for i in range(1, 16):
            page.mouse.move(w["x"] + i * 12, w["y"] + 100 + i * 3); page.wait_for_timeout(16)
        page.mouse.up(); page.keyboard.up("Shift"); page.wait_for_timeout(200)
        assert abs(card_center(page, wid)["ry"]) > 0.3
        # tocar la barra de titulo cierra la ventana
        w = card_center(page, wid)
        click(page, w["x"] - 100, w["y"] - w["h"] / 2 + 20 * w["cs"])
        until(page, f"() => !window.__holo.cards.has('{wid}')", 4000)
        assert problems == [], problems


def test_holo_core_unfolds_bubbles_and_moves_and_the_explorer_is_one_list_card(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with BoardServer(tmp_path, script) as srv:
        (tmp_path / "workspace" / "largo.txt").write_text("\n".join(f"linea {i} del documento largo" for i in range(300)), encoding="utf-8")
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        problems = open_holo(page, srv)
        ring0 = page.evaluate("() => ({x: window.__holo.ring.x, y: window.__holo.ring.y, open: window.__holo.ring.open})")
        assert ring0["open"] is False
        # arrastrar el nucleo lo mueve (y no lo abre)
        page.mouse.move(ring0["x"], ring0["y"]); page.mouse.down()
        for i in range(1, 16):
            page.mouse.move(ring0["x"] + i * 10, ring0["y"] + i * 12); page.wait_for_timeout(16)
        page.mouse.up(); page.wait_for_timeout(200)
        ring1 = page.evaluate("() => ({x: window.__holo.ring.x, y: window.__holo.ring.y, open: window.__holo.ring.open})")
        assert ring1["x"] > ring0["x"] + 100 and ring1["y"] > ring0["y"] + 120 and ring1["open"] is False
        open_explorer_with_core(page)
        lst = card_center(page, "files-list")
        assert lst["kind"] == "list" and len(lst["rows"]) >= 2
        page.wait_for_timeout(400)
        assert _bright(page.screenshot(), int(lst["x"] - lst["w"] / 2), int(lst["y"] - lst["h"] / 2), int(lst["x"] + lst["w"] / 2), int(lst["y"] + lst["h"] / 2)) > 800
        n_before = len(card_ids(page))
        names = page.evaluate("() => window.__holo.cards.get('files-list').rows.map(r => r.id)")
        assert names[0].startswith("e") or names[0] == "up"
        # entrar a docs/ (primera fila: carpetas primero) cambia el CONTENIDO de la misma tarjeta
        click_row(page, 0)
        until(page, "() => window.__holo.cards.get('files-list').rows.some(r => r.id === 'up')", 4000)
        assert len(card_ids(page)) == n_before
        # abrir un archivo desde la lista abre una ventana
        click_row(page, 1)
        until(page, "() => [...window.__holo.cards.keys()].some(k => k.startsWith('win-file-'))", 4000)
        wid = [k for k in card_ids(page) if k.startswith("win-file-")][0]
        assert "informe.md" in wid
        # plegar las burbujas (tocar el nucleo) y cerrar la lista con su cruz
        ring = page.evaluate("() => ({x: window.__holo.ring.x, y: window.__holo.ring.y})")
        click(page, ring["x"], ring["y"])
        until(page, "() => window.__holo.ring.bloom === 0", 4000)
        # apartar el nucleo (arrastrandolo) para que no tape la cruz de la lista
        ring = page.evaluate("() => ({x: window.__holo.ring.x, y: window.__holo.ring.y})")
        page.mouse.move(ring["x"], ring["y"]); page.mouse.down()
        for i in range(1, 21):
            page.mouse.move(ring["x"] + i * 40, ring["y"] + i * 14); page.wait_for_timeout(16)
        page.mouse.up(); page.wait_for_timeout(200)
        c = card_center(page, "files-list")
        click(page, c["x"] + c["w"] / 2 - 20 * c["cs"], c["y"] - c["h"] / 2 + 20 * c["cs"])
        until(page, "() => !window.__holo.cards.has('files-list')", 4000)
        assert problems == [], problems


def test_chat_answer_can_be_pinned_as_a_card(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="# Plan\n\n- paso uno\n- paso dos")

    with BoardServer(tmp_path, script) as srv:
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        pair_and_open(page, srv)
        page.fill("textarea", "hacelo")
        page.keyboard.press("Enter")
        page.click("text=Sacar a tarjeta")
        for _ in range(50):
            if srv.board.cards:
                break
            page.wait_for_timeout(100)
        (card,) = srv.board.cards.values()
        assert card["origin"] == "user" and card["title"] == "Plan" and "paso uno" in card["text"]
        page.click("role=tab[name='Holo']")
        page.wait_for_selector(".holo-list summary:has-text('Tarjetas (1)')")


def test_holo_text_explorer_is_an_accessible_alternative_and_images_load(browser, tmp_path):
    async def script(srv, text):
        yield srv.AgentEvent("text", text="x")

    with BoardServer(tmp_path, script) as srv:
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        problems = open_holo(page, srv)
        failed = []
        page.on("response", lambda r: failed.append(r.url) if "/api/file" in r.url and r.status != 200 else None)
        page.click("summary:text-is('Explorador (texto)')")
        page.click("text=Abrir explorador")
        page.wait_for_selector("nav.holo-files >> text=docs")
        page.click("nav.holo-files >> text=docs")
        page.wait_for_selector("nav.holo-files >> text=informe.md")
        page.click("nav.holo-files >> text=informe.md")
        until(page, "() => [...window.__holo.cards.keys()].some(k => k.includes('informe.md'))", 4000)
        page.click("nav.holo-files >> text=Subir")
        page.click("nav.holo-files >> text=foto.png")
        until(page, "() => [...window.__holo.cards.keys()].some(k => k.includes('foto.png'))", 4000)
        page.wait_for_timeout(500)
        assert failed == []
        assert page.evaluate("window.__pwned") is None
        page.click(".holo-list summary >> nth=0")
        assert "Ventanas abiertas" in page.inner_text(".holo-list >> nth=0")
        assert problems == [], problems
        res = page.evaluate("""async () => { const r = await fetch('/api/file?root=0&path=../x.png'); return r.status; }""")
        assert res == 404
