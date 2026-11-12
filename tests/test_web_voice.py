import asyncio
import struct
from types import SimpleNamespace as NS

import numpy as np
import pytest

from piantao.core import EventBus
from piantao.core.agent import AgentEvent
from piantao.voice.audio import AudioConfig
from piantao.web import ChatSession, WebConfirmer
from piantao.web.voice import (BIN_MIC, BIN_TTS, BargeDetector, VoiceEngines, WebAudioOut, WebVoice, pack_tts, parse_mic)

CFG = AudioConfig()
N = CFG.frame_samples


def run(coro):
    return asyncio.run(coro)


def silence(n=N):
    return (np.random.default_rng(1).standard_normal(n) * 15).astype(np.int16)


def speech(n=N):
    t = np.arange(n) / 16000
    return (9000 * np.sin(2 * np.pi * 300 * t)).astype(np.int16)


class Clock:
    def __init__(self):
        self.t = 100.0

    def __call__(self):
        return self.t


# ---- formato binario ---------------------------------------------------------------------------------------------
def test_parse_mic_validates():
    ok = bytes([BIN_MIC]) + np.arange(480, dtype="<i2").tobytes()
    assert parse_mic(ok).shape == (480,)
    for bad in (b"", b"\x01", bytes([BIN_MIC, 1, 2, 3]), bytes([9]) + b"\x00" * 100, bytes([BIN_MIC]) + b"\x00" * 20000,
                bytes([BIN_TTS]) + b"\x00" * 10):
        assert parse_mic(bad) is None


def test_pack_tts_header_and_clipping():
    data = pack_tts(7, 24000, np.array([0.0, 0.5, 2.0, -3.0], dtype=np.float32))
    typ, rate, cid = struct.unpack("<BII", data[:9])
    assert (typ, rate, cid) == (BIN_TTS, 24000, 7)
    assert np.frombuffer(data[9:], dtype="<i2").tolist() == [0, 16383, 32767, -32767]


# ---- salida ------------------------------------------------------------------------------------------------------
def test_audio_out_speaking_estimate_chunks_flush_and_mute():
    clk, sent, msgs = Clock(), [], []
    out = WebAudioOut(sent.append, msgs.append, tail_ms=300, clock=clk)
    assert not out.speaking and not out.muted
    out.play(np.zeros(24000 * 2 + 100, dtype=np.float32), 24000)  # 2,004 s -> 3 trozos de <= 1 s
    assert len(sent) == 3 and out.speaking and out.muted
    ids = [struct.unpack("<BII", d[:9])[2] for d in sent]
    assert ids == sorted(ids) and len(set(ids)) == 3
    clk.t += 2.01
    assert not out.speaking and out.muted  # sigue "mudo" durante la cola de eco
    clk.t += 0.31
    assert not out.muted
    out.play(np.zeros(24000, dtype=np.float32), 24000)
    out.interrupt()
    assert msgs == [{"t": "voice", "ev": "flush"}] and not out.speaking
    out.interrupt()
    assert len(msgs) == 1  # sin nada sonando no hay flush


def test_audio_out_holds_and_wait():
    clk = Clock()
    out = WebAudioOut(lambda b: None, lambda m: None, clock=clk)
    out.hold_mute()
    assert out.muted
    out.release_mute()
    clk.t += 1
    assert not out.muted
    assert out.wait(0.01) is True


def test_barge_detector_needs_sustained_loud_voice():
    d = BargeDetector(CFG, barge_ms=300)
    for _ in range(40):
        assert d.feed(silence()) is None
    for _ in range(3):  # un golpe corto no interrumpe
        assert d.feed(speech()) is None
    d.feed(silence())
    got = None
    for _ in range(15):
        got = d.feed(speech())
        if got:
            break
    assert got and len(got) >= 10


# ---- controlador ------------------------------------------------------------------------------------------------
class FakeStt:
    def __init__(self, texts, delay=0.0):
        self.texts, self.calls, self.delay = list(texts), 0, delay

    def transcribe(self, audio):
        self.calls += 1
        if self.delay:
            import time
            time.sleep(self.delay)
        return NS(text=self.texts.pop(0) if self.texts else "")


class FakeTts:
    sample_rate = 24000

    def __init__(self):
        self.said = []

    def synthesize(self, text):
        self.said.append(text)
        return np.full(12000, 0.1, dtype=np.float32)

    def close(self):
        pass


class FakeWake:
    def __init__(self):
        self.rests = []

    def detect(self, audio):
        return self.rests.pop(0) if self.rests else None

    def strip(self, text):
        t = text.lower()
        return t.split("piantao", 1)[1].strip(" ,.") if t.startswith("piantao") else None


class FakeAgent:
    def __init__(self, reply="Hola, ¿en qué te ayudo?"):
        self.history, self.conversation_id, self.reply, self.gate = [], None, reply, None
        self.heard = []

    async def respond(self, text, **_):
        self.heard.append(text)
        self.history.append({"role": "user", "content": text})
        if self.gate is not None:
            yield AgentEvent("text", text=self.reply)
            await self.gate.wait()
        else:
            yield AgentEvent("text", text=self.reply)
        self.history.append({"role": "assistant", "content": self.reply})
        yield AgentEvent("done")

    def reset(self):
        self.history.clear()


def make(texts=(), reply="Hola, ¿en qué te ayudo?", barge_in=False, wake=False, loader_fail=False):
    bus, jsons, blobs = EventBus(), [], []
    agent = FakeAgent(reply)
    conf = WebConfirmer(bus, timeout_s=1)
    chat_msgs = []
    chat = ChatSession(agent, bus, chat_msgs.append, conf)
    stt, tts, w = FakeStt(texts), FakeTts(), FakeWake()
    eng = VoiceEngines(stt, tts, w if wake else None, (np.zeros(100, dtype=np.float32), 24000), followup_s=5)

    def loader():
        if loader_fail:
            raise RuntimeError("sin modelo")
        return eng

    v = WebVoice(chat, bus, CFG, loader, lambda c, m: jsons.append((c, m)), lambda c, b: blobs.append((c, b)),
                 barge_in=barge_in, barge_ms=300, tail_ms=50)
    return NS(v=v, bus=bus, jsons=jsons, blobs=blobs, agent=agent, chat=chat, stt=stt, tts=tts, wake=w, chat_msgs=chat_msgs)


def evs(m, c=None):
    return [x["ev"] for cl, x in m.jsons if x["t"] == "voice" and (c is None or cl is c)]


async def say(v, c, n_speech=14, lead=20, tail=30):
    for _ in range(lead):
        v.feed(c, silence())
    for _ in range(n_speech):
        v.feed(c, speech())
    for _ in range(tail):
        v.feed(c, silence())
    await asyncio.sleep(0.05)


async def settle(m, secs=1.0):
    end = asyncio.get_running_loop().time() + secs
    while asyncio.get_running_loop().time() < end:
        await asyncio.sleep(0.02)
        if not m.chat.busy and m.bus.state == "idle" and m.blobs:
            break


def test_start_validates_modes_and_single_client():
    async def go():
        m = make()
        A, B = object(), object()
        for bad in (None, "x", 5):
            with pytest.raises(ValueError):
                await m.v.start(A, bad)
        info = await m.v.start(A, "always")
        assert info["active"] and info["mode"] == "always" and "ready" in evs(m, A)
        with pytest.raises(ValueError, match="otra pestana"):
            await m.v.start(B, "always")
        await m.v.stop(B)  # otra pestana no puede apagarla
        assert m.v.active
        await say(m.v, B)  # ni enviar audio: ni llega al STT
        assert m.stt.calls == 0
        await m.v.stop(A)
        assert not m.v.active and "off" in evs(m, A)
        assert m.chat.speaker is None
        await m.v.close()
    run(go())


def test_wake_mode_unavailable_without_detector_and_loader_failure_frees_voice():
    async def go():
        m = make()
        with pytest.raises(ValueError, match="wake"):
            await m.v.start(object(), "wake")
        assert m.v.client is None
        bad = make(loader_fail=True)
        with pytest.raises(ValueError, match="no se pudo cargar"):
            await bad.v.start(object(), "always")
        assert bad.v.client is None and not bad.v.active
    run(go())


def test_always_mode_full_turn_with_spoken_reply():
    async def go():
        m = make(["abrí el navegador"])
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A)
        await settle(m, 3)
        assert m.agent.heard == ["abrí el navegador"]
        e = evs(m)
        assert "transcribing" in e and "transcript" in e
        tr = next(x for _c, x in m.jsons if x.get("ev") == "transcript")
        assert tr["text"] == "abrí el navegador"
        assert any(x.get("ev") == "start" and x.get("via") == "voz" for x in m.chat_msgs)
        assert m.tts.said and m.blobs and all(c is A and b[0] == BIN_TTS for c, b in m.blobs)
        await asyncio.sleep(0.4)
        assert m.bus.state == "idle"
        await m.v.close()
    run(go())


def test_partial_frames_are_rechunked():
    async def go():
        m = make(["hola"])
        A = object()
        await m.v.start(A, "always")
        stream = np.concatenate([silence() for _ in range(20)] + [speech() for _ in range(14)] + [silence() for _ in range(30)])
        for i in range(0, stream.size, 333):  # trozos que no coinciden con la trama de 30 ms
            m.v.feed(A, stream[i:i + 333])
        await settle(m, 3)
        assert m.agent.heard == ["hola"]
        await m.v.close()
    run(go())


def test_noise_transcripts_and_short_blips_are_ignored():
    async def go():
        m = make(["Subtítulos realizados por la comunidad de Amara.org", ""])
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A)
        await say(m.v, A, n_speech=2)  # demasiado corto: ni llega al STT
        await say(m.v, A)
        await asyncio.sleep(0.1)
        assert m.agent.heard == [] and m.stt.calls == 2
        assert evs(m).count("ignored") == 2
        await m.v.close()
    run(go())


def test_ptt_hold_release_and_too_short():
    async def go():
        m = make(["¿qué hora es?"])
        A = object()
        await m.v.start(A, "ptt")
        for _ in range(10):  # sin pulsar, el audio se descarta
            m.v.feed(A, speech())
        assert m.stt.calls == 0
        with pytest.raises(ValueError):
            await m.v.ptt(A, "si")
        await m.v.ptt(A, True)
        assert m.bus.state == "listening" and "listening" in evs(m)
        await m.v.ptt(A, False)  # soltar enseguida: demasiado corto
        assert "too_short" in evs(m) and m.stt.calls == 0
        await m.v.ptt(A, True)
        for _ in range(20):
            m.v.feed(A, speech())
        await m.v.ptt(A, False)
        await settle(m, 3)
        assert m.agent.heard == ["¿qué hora es?"]
        with pytest.raises(ValueError):
            await m.v.ptt(object(), True)  # otra pestana
        await m.v.close()
    run(go())


def test_ptt_press_interrupts_a_speaking_turn():
    async def go():
        m = make(["hola"], reply="Una respuesta larga. Con varias frases. Para que hable un rato.")
        m.agent.gate = asyncio.Event()  # el turno queda abierto
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A)
        await asyncio.sleep(0.3)
        assert m.chat.busy
        await m.v.stop(A)
        await m.v.start(A, "ptt")
        assert m.chat.busy
        await m.v.ptt(A, True)
        assert not m.chat.busy and m.chat_msgs[-1]["outcome"] == "interrupted"
        await m.v.close()
    run(go())


def test_wake_mode_ignores_unaddressed_speech_and_handles_followup():
    async def go():
        m = make(["piantao qué hora es", "piantao", "poné música"], wake=True)
        A = object()
        await m.v.start(A, "wake")
        await say(m.v, A)  # nadie dijo piantao
        assert m.agent.heard == [] and "ignored" in evs(m) and m.stt.calls == 0
        m.wake.rests = ["qué hora es"]
        await say(m.v, A)
        await settle(m, 3)
        assert m.agent.heard == ["qué hora es"]
        await asyncio.sleep(0.5)
        m.wake.rests = [""]  # solo "piantao": pide la orden en el siguiente enunciado
        await say(m.v, A)
        assert "followup" in evs(m) and m.bus.state == "listening"
        await asyncio.sleep(0.2)  # termina el tono de aviso y su cola de eco
        await say(m.v, A, lead=2)
        await settle(m, 3)
        assert m.agent.heard == ["qué hora es", "poné música"]
        await m.v.close()
    run(go())


def test_mic_is_ignored_while_speaking_without_barge_in():
    async def go():
        m = make(["hola", "eco"], reply="Frase uno larga. Frase dos larga. Frase tres larga.")
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A)
        await asyncio.sleep(0.25)
        assert m.v.out.muted
        before = m.stt.calls
        for _ in range(14):
            m.v.feed(A, speech())
        for _ in range(30):  # un enunciado completo, pero captado mientras habla Piantao: es eco
            m.v.feed(A, silence())
        await asyncio.sleep(0.1)
        assert m.stt.calls == before and "barge_in" not in evs(m)
        await m.v.close()
    run(go())


def test_barge_in_interrupts_and_keeps_what_the_user_said():
    async def go():
        m = make(["hola", "pará, otra cosa"], reply="Una respuesta. Otra frase. Y otra más.", barge_in=True)
        m.agent.gate = asyncio.Event()
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A)
        for _ in range(100):
            await asyncio.sleep(0.02)
            if m.v.out.speaking:
                break
        assert m.v.out.speaking
        for _ in range(60):
            m.v.feed(A, silence())
        for _ in range(30):
            m.v.feed(A, speech())
        await asyncio.sleep(0.2)
        assert "barge_in" in evs(m) and {"t": "voice", "ev": "flush"} in [x for _c, x in m.jsons]
        assert m.chat_msgs[-1]["outcome"] == "interrupted"
        for _ in range(40):
            m.v.feed(A, silence())
        await asyncio.sleep(0.2)
        assert m.agent.heard[-1] == "pará, otra cosa"
        await m.v.close()
    run(go())


def test_disconnect_stops_voice_and_commands_need_owner():
    async def go():
        m = make()
        A, B = object(), object()
        h = m.v.handlers()
        await h["voice_start"]({"mode": "always"}, A)
        assert (await h["voice_info"]({}, A))["mine"] is True
        assert (await h["voice_info"]({}, B))["mine"] is False
        with pytest.raises(ValueError):
            await h["voice_interrupt"]({}, B)
        assert await h["voice_stop"]({}, B) is False and m.v.active
        m.v.on_disconnect(B)
        await asyncio.sleep(0.05)
        assert m.v.active
        m.v.on_disconnect(A)
        await asyncio.sleep(0.05)
        assert not m.v.active and m.chat.speaker is None
        await m.v.close()
    run(go())


def test_typed_chat_speak_flag_only_when_voice_is_active():
    async def go():
        m = make()
        h = m.chat.handlers()
        await h["chat_send"]({"text": "hola", "speak": True})
        await m.chat._task
        assert m.tts.said == []  # voz apagada: no habla
        with pytest.raises(ValueError):
            await h["chat_send"]({"text": "hola", "speak": "si"})
        A = object()
        await m.v.start(A, "ptt")
        await h["chat_send"]({"text": "dime algo", "speak": True})
        await m.chat._task
        await settle(m, 2)
        assert m.tts.said
        await m.v.close()
    run(go())


def test_utterance_during_transcription_is_dropped_not_queued():
    async def go():
        m = make(["uno", "dos"])
        m.stt.delay = 0.4
        A = object()
        await m.v.start(A, "always")
        await say(m.v, A, tail=26)   # cierra el primer enunciado: empieza a transcribir
        await say(m.v, A)            # segundo enunciado mientras el STT sigue ocupado
        assert m.stt.calls == 1
        await settle(m, 3)
        assert m.agent.heard == ["uno"]
        await m.v.close()
    run(go())


def test_gateway_binary_channel_security(tmp_path):
    import json

    import aiohttp

    from piantao.web import PairingManager, SessionStore, WebConfig, WebGateway
    from piantao.web.gateway import CSRF_HEADER

    async def go():
        m = make(["hola"])
        pairing = PairingManager()
        bus = m.bus
        gw = WebGateway(bus, lambda: {}, {"ping": _ping}, WebConfig(port=0), SessionStore(tmp_path / "s.json"), pairing)
        m.v._send_json, m.v._send_bytes = gw.send_to, gw.send_bytes_to
        gw.ctx_handlers.update(m.v.handlers())
        gw.binary_handler = m.v.on_binary
        gw.disconnect_hooks.append(m.v.on_disconnect)
        await gw.start()
        try:
            async def login(s):
                code, _ = pairing.issue()
                r = await s.post(gw.url + "/api/pair", json={"code": code}, headers={"Origin": gw.url, CSRF_HEADER: "1"})
                assert r.status == 200

            async def hello(ws):
                await ws.receive(); await ws.receive()

            async def cmd(ws, name, **args):
                await ws.send_str(json.dumps({"t": "cmd", "id": 1, "name": name, "args": args}))
                while True:
                    msg = json.loads((await asyncio.wait_for(ws.receive(), 5)).data)
                    if msg["t"] == "reply":
                        return msg

            async with aiohttp.ClientSession() as s1, aiohttp.ClientSession() as s2:
                await login(s1); await login(s2)
                async with s1.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as w1, \
                        s2.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as w2:
                    await hello(w1); await hello(w2)
                    frame = bytes([BIN_MIC]) + speech().tobytes()
                    for _ in range(40):  # voz apagada: el audio se descarta sin consecuencias
                        await w1.send_bytes(frame)
                    await w1.send_bytes(b"\x09garbage")
                    await w1.send_bytes(b"")
                    assert (await cmd(w1, "ping"))["ok"] and m.stt.calls == 0
                    assert (await cmd(w1, "voice_start", mode="always"))["ok"]
                    r = await cmd(w2, "voice_start", mode="always")
                    assert r["ok"] is False and "otra pestana" in r["error"]
                    for _ in range(20):  # la otra pestana no puede meter audio
                        await w2.send_bytes(frame)
                    assert m.stt.calls == 0 and m.v.client is not None
                    await w1.send_bytes(b"\x01" * (2 * 1024 * 1024))  # mas que el maximo del canal: se corta esa conexion
                    msg = await asyncio.wait_for(w1.receive(), 5)
                    assert msg.type in (aiohttp.WSMsgType.CLOSE, aiohttp.WSMsgType.CLOSING, aiohttp.WSMsgType.CLOSED)
                    for _ in range(50):
                        await asyncio.sleep(0.05)
                        if not m.v.active:
                            break
                    assert not m.v.active  # al caerse la pestana, la voz se apaga y libera el microfono
        finally:
            await m.v.close()
            await gw.stop()
    run(go())


async def _ping(args):
    return "pong"
