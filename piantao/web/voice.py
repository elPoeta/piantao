"""Voz en el navegador: el microfono llega por el WebSocket (PCM 16 kHz) y la respuesta vuelve como audio.

Todo el procesamiento pesado sigue en el servidor (VAD, Whisper, palabra de activacion, Kokoro); el navegador solo captura
y reproduce. El audio vive en memoria y no se guarda. Solo la pestana que activo la voz puede enviar audio.

Binario cliente -> servidor:  [0x01][PCM int16 LE mono 16 kHz]      (tramas de 10 a 512 ms)
Binario servidor -> cliente:  [0x02][u32 frecuencia LE][u32 id LE][PCM int16 LE mono]
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import re
import struct
import threading
import time
from collections import deque
from dataclasses import dataclass
from typing import Any, Callable

import numpy as np

from ..voice.audio import AudioConfig, EnergyVAD, Endpointer, to_float32
from ..voice.loop import is_noise_transcript

log = logging.getLogger("piantao.web.voice")
BIN_MIC, BIN_TTS = 1, 2
MAX_MIC_BYTES = 16384
MAX_CHUNK_S = 1.0
MODES = ("ptt", "wake", "always")


def pack_tts(chunk_id: int, rate: int, samples: np.ndarray) -> bytes:
    x = np.clip(np.asarray(samples, dtype=np.float32).reshape(-1), -1.0, 1.0)
    return struct.pack("<BII", BIN_TTS, int(rate), chunk_id & 0xFFFFFFFF) + (x * 32767.0).astype("<i2").tobytes()


def parse_mic(data: bytes) -> np.ndarray | None:
    """Trama de microfono valida -> int16, o None (tipo desconocido, tamano raro o demasiado grande)."""
    if len(data) < 3 or len(data) > MAX_MIC_BYTES + 1 or data[0] != BIN_MIC or (len(data) - 1) % 2:
        return None
    return np.frombuffer(data, dtype="<i2", offset=1).astype(np.int16)


class WebAudioOut:
    """Lo que SpeechPipeline espera de un 'altavoz', pero enviando el audio al navegador. Seguro entre hilos."""

    def __init__(self, send_bytes: Callable[[bytes], None], send_json: Callable[[dict[str, Any]], None], tail_ms: int = 300,
                 clock: Callable[[], float] = time.monotonic):
        self._send_bytes, self._send_json, self._clock = send_bytes, send_json, clock
        self.tail_s = tail_ms / 1000.0
        self._lock = threading.Lock()
        self._busy_until = 0.0
        self._tail_until = 0.0
        self._holds = 0
        self._wake = threading.Event()
        self._id = 0

    @property
    def speaking(self) -> bool:
        return self._clock() < self._busy_until

    @property
    def muted(self) -> bool:
        return self.speaking or self._holds > 0 or self._clock() < self._tail_until

    def play(self, samples: np.ndarray, sample_rate: int) -> None:
        x = np.asarray(samples, dtype=np.float32).reshape(-1)
        step = max(1, int(sample_rate * MAX_CHUNK_S))
        for i in range(0, x.size, step):
            part = x[i:i + step]
            with self._lock:
                self._id += 1
                cid = self._id
                start = max(self._clock(), self._busy_until)
                self._busy_until = start + part.size / sample_rate
                self._tail_until = self._busy_until + self.tail_s
            self._send_bytes(pack_tts(cid, sample_rate, part))

    def wait(self, timeout: float | None = None) -> bool:
        deadline = None if timeout is None else self._clock() + timeout
        while self.speaking:
            left = self._busy_until - self._clock()
            if deadline is not None:
                left = min(left, deadline - self._clock())
                if left <= 0:
                    return False
            self._wake.wait(max(0.005, min(left, 0.1)))
        return True

    def interrupt(self) -> None:
        with self._lock:
            had = self._clock() < self._busy_until
            self._busy_until = 0.0
            if had:
                self._tail_until = self._clock() + self.tail_s
        self._wake.set()
        self._wake.clear()
        if had:
            self._send_json({"t": "voice", "ev": "flush"})  # el navegador corta lo que tenga en cola

    def hold_mute(self) -> None:
        with self._lock:
            self._holds += 1

    def release_mute(self) -> None:
        with self._lock:
            self._holds = max(0, self._holds - 1)
            if self._holds == 0:
                self._tail_until = max(self._tail_until, self._clock() + self.tail_s)


class BargeDetector:
    """Voz sostenida MIENTRAS Piantao habla (con el eco ya cancelado por el navegador). Umbral mas alto que el normal."""

    def __init__(self, cfg: AudioConfig, barge_ms: int = 400, extra_margin_db: float = 6.0):
        self.vad = EnergyVAD(cfg.margin_db + extra_margin_db, cfg.min_level_db + 5, int(cfg.noise_window_s * 1000 / cfg.frame_ms))
        self._need = max(2, barge_ms // cfg.frame_ms)
        self._run = 0
        self._frames: deque[np.ndarray] = deque(maxlen=self._need + max(1, cfg.preroll_ms // cfg.frame_ms))

    def feed(self, frame: np.ndarray) -> list[np.ndarray] | None:
        self._frames.append(frame)
        self._run = self._run + 1 if self.vad.is_speech(frame) else 0
        if self._run >= self._need:
            out = list(self._frames)
            self.reset()
            return out
        return None

    def reset(self) -> None:
        self._run = 0
        self._frames.clear()


@dataclass
class VoiceEngines:
    stt: Any                       # .transcribe(float32) -> objeto con .text
    tts: Any                       # .synthesize(text) -> float32 ; .sample_rate ; .close()
    wake: Any = None               # .detect(float32) -> str|None ; .strip(text)
    chime: tuple[np.ndarray, int] | None = None
    followup_s: float = 8.0
    stt_name: str = ""


def load_engines(cfg: dict[str, Any], need_wake: bool = True) -> VoiceEngines:
    """Carga STT, TTS y (opcional) detector de activacion con la misma configuracion que `main.py voice`. Bloqueante."""
    from ..voice.stt import SttConfig, Transcriber, _cuda_count, resolve_device
    from ..voice.tts import TtsConfig, make_engine
    from ..voice.wake import TranscriptWake, WakeConfig, make_chime

    stt = Transcriber(SttConfig.from_config(cfg))
    engine = make_engine(TtsConfig.from_config(cfg))
    stt.load()
    device, compute = resolve_device(stt.config, _cuda_count() if stt.config.device == "auto" else 0)
    stt.warmup()
    engine.synthesize("Listo.")
    wake = None
    wcfg = WakeConfig.from_config(cfg)
    if need_wake:
        wake = TranscriptWake(wcfg, Transcriber(SttConfig(model=wcfg.stt_model, device=wcfg.stt_device,
                                                          compute_type=wcfg.stt_compute_type, language=stt.config.language,
                                                          download_root=stt.config.download_root)))
        wake.load()
    return VoiceEngines(stt, engine, wake, (make_chime(), 24000) if wcfg.chime else None, wcfg.followup_s,
                        f"{stt.config.model}/{device} ({compute})")


class _Speaker:
    """Adaptador entre ChatSession y SpeechPipeline: al terminar de hablar devuelve el estado a reposo."""

    def __init__(self, voice: "WebVoice"):
        self.v = voice

    def begin(self) -> None:
        self.v.pipe.begin()

    def feed(self, delta: str) -> None:
        self.v.pipe.feed(delta)

    def end(self) -> None:
        self.v.pipe.end()
        self.v._spawn(self.v._after_speech())

    def stop(self) -> None:
        self.v.pipe.stop()


class WebVoice:
    def __init__(self, chat: Any, bus: Any, cfg: AudioConfig, loader: Callable[[], VoiceEngines],
                 send_json: Callable[[Any, dict[str, Any]], None], send_bytes: Callable[[Any, bytes], None],
                 barge_in: bool = False, barge_ms: int = 400, tail_ms: int = 300):
        self.chat, self.bus, self.cfg, self._loader = chat, bus, cfg, loader
        self._send_json, self._send_bytes = send_json, send_bytes
        self.barge_in, self.barge_ms, self.tail_ms = barge_in, barge_ms, tail_ms
        self.engines: VoiceEngines | None = None
        self.client: Any = None
        self.mode: str | None = None
        self.pipe: Any = None
        self.out: WebAudioOut | None = None
        self._endpointer = Endpointer(cfg)
        self._barge = BargeDetector(cfg, barge_ms)
        self._carry = np.zeros(0, dtype=np.int16)
        self._ptt = False
        self._ptt_buf: list[np.ndarray] = []
        self._busy = False                 # transcribiendo/enviando un enunciado
        self._followup_until = 0.0
        self._tasks: set[asyncio.Task[Any]] = set()
        self._loading: asyncio.Lock | None = None
        self.speaker = _Speaker(self)

    # -- utilidades -------------------------------------------------------------------------------------------------
    def _emit(self, **msg: Any) -> None:
        if self.client is not None:
            self._send_json(self.client, {"t": "voice", **msg})

    def _spawn(self, coro: Any) -> None:
        t = asyncio.ensure_future(coro)
        self._tasks.add(t)
        t.add_done_callback(self._tasks.discard)

    @property
    def active(self) -> bool:
        return self.client is not None and self.mode is not None

    def info(self) -> dict[str, Any]:
        return {"active": self.active, "mode": self.mode, "loaded": self.engines is not None, "barge_in": self.barge_in,
                "stt": self.engines.stt_name if self.engines else None}

    # -- ciclo de vida ----------------------------------------------------------------------------------------------
    async def start(self, client: Any, mode: Any) -> dict[str, Any]:
        if mode not in MODES:
            raise ValueError(f"mode debe ser uno de {MODES}")
        if self.client is not None and self.client is not client:
            raise ValueError("la voz ya esta activa en otra pestana del navegador")
        if self._loading is None:
            self._loading = asyncio.Lock()
        async with self._loading:
            if self.engines is None:
                self.client = client  # reserva la voz mientras carga, para que otra pestana no la pise
                self._send_json(client, {"t": "voice", "ev": "loading"})
                try:
                    self.engines = await asyncio.to_thread(self._loader)
                except Exception as exc:  # noqa: BLE001
                    self.client = None
                    log.warning("web: no se pudo cargar la voz: %s", type(exc).__name__)
                    raise ValueError(f"no se pudo cargar la voz: {str(exc)[:160] or type(exc).__name__}") from exc
            if mode == "wake" and self.engines.wake is None:
                self.client = None
                raise ValueError("el modo wake no esta disponible (detector no cargado)")
        self.client, self.mode = client, mode
        if self.out is None:
            from ..voice.tts import SpeechPipeline

            self.out = WebAudioOut(lambda b: self._send_bytes(self.client, b) if self.client is not None else None,
                                   lambda m: self._send_json(self.client, m) if self.client is not None else None, self.tail_ms)
            self.pipe = SpeechPipeline(self.engines.tts, self.out, on_error=lambda e: self._emit(ev="error", error=f"voz: {e}"))
        self._reset_capture()
        self.chat.speaker = self.speaker
        self._emit(ev="ready", mode=mode, rate=self.cfg.sample_rate, frame_ms=self.cfg.frame_ms, barge_in=self.barge_in)
        self.bus.set_state("idle")
        return self.info()

    def _reset_capture(self) -> None:
        self._endpointer.reset()
        self._barge.reset()
        self._carry = np.zeros(0, dtype=np.int16)
        self._ptt, self._ptt_buf = False, []
        self._followup_until = 0.0

    async def stop(self, client: Any = None) -> None:
        if client is not None and client is not self.client:
            return
        if self.client is None:
            return
        self._emit(ev="off")
        self.mode = None
        self._reset_capture()
        if self.chat.speaker is self.speaker:
            self.chat.speaker = None
        if self.pipe is not None:
            self.pipe.stop()
        self.client = None
        for t in list(self._tasks):
            t.cancel()

    async def close(self) -> None:
        await self.stop()
        if self.pipe is not None:
            self.pipe.close()
        elif self.engines is not None:
            with contextlib.suppress(Exception):
                self.engines.tts.close()

    # -- entrada de audio (hilo del bucle) --------------------------------------------------------------------------
    def feed(self, client: Any, pcm: np.ndarray) -> None:
        if client is not self.client or self.mode is None:
            return  # solo la pestana que activo la voz; fuera de modo voz el audio se descarta
        x = np.concatenate([self._carry, pcm]) if self._carry.size else pcm
        n = self.cfg.frame_samples
        i = 0
        while i + n <= x.size:
            self._on_frame(x[i:i + n])
            i += n
        self._carry = x[i:]

    def _on_frame(self, frame: np.ndarray) -> None:
        if self.mode == "ptt":
            if self._ptt:
                self._ptt_buf.append(frame)
                if len(self._ptt_buf) * self.cfg.frame_ms >= self.cfg.max_utterance_s * 1000:
                    self._ptt_release()
            return
        out = self.out
        if out is not None and out.muted:
            if self.barge_in and out.speaking:
                frames = self._barge.feed(frame)
                if frames is not None:
                    self._spawn(self._do_barge(frames))
            self._endpointer.reset()  # lo captado mientras habla Piantao es eco
            return
        self._barge.reset()
        if self._busy:
            return
        utt = self._endpointer.feed(frame)
        if utt is not None:
            self._spawn(self._utterance(utt))
        elif self._followup_until and time.monotonic() > self._followup_until and not self._endpointer.speaking:
            self._followup_until = 0.0
            self._emit(ev="followup_timeout")
            self.bus.set_state("idle")

    # -- pulsar para hablar -----------------------------------------------------------------------------------------
    async def ptt(self, client: Any, down: Any) -> bool:
        if client is not self.client or self.mode != "ptt":
            raise ValueError("el pulsar-para-hablar necesita la voz activa en modo ptt")
        if not isinstance(down, bool):
            raise ValueError("down debe ser true o false")
        if down and not self._ptt:
            await self.interrupt()  # pulsar mientras habla Piantao = callarlo y escuchar
            self._ptt_buf, self._ptt = [], True
            self.bus.set_state("listening")
            self._emit(ev="listening")
        elif not down and self._ptt:
            self._ptt_release()
        return self._ptt

    def _ptt_release(self) -> None:
        self._ptt = False
        buf, self._ptt_buf = self._ptt_buf, []
        if len(buf) * self.cfg.frame_ms >= self.cfg.min_speech_ms:
            self._spawn(self._utterance(np.concatenate(buf), ptt=True))
        else:
            self._emit(ev="too_short")
            self.bus.set_state("idle")

    # -- interrupcion -----------------------------------------------------------------------------------------------
    async def interrupt(self) -> bool:
        did = await self.chat.interrupt(wait=True)
        if self.pipe is not None:
            self.pipe.stop()
        if self.out is not None and self.out.speaking:
            self.out.interrupt()
        if did or self.bus.state == "speaking":
            self.bus.set_state("idle")
        return did

    async def _do_barge(self, frames: list[np.ndarray]) -> None:
        self._emit(ev="barge_in")
        await self.interrupt()
        self._endpointer.reset()
        for f in frames:  # lo ultimo que dijo el usuario no se pierde: sigue como un enunciado normal
            utt = self._endpointer.feed(f)
            if utt is not None:
                self._spawn(self._utterance(utt))
                return

    async def _after_speech(self) -> None:
        """Cuando termina el audio del turno (y no se interrumpio), vuelve a reposo."""
        out = self.out
        if out is None:
            return
        await asyncio.to_thread(self.pipe.wait, 60.0)
        if not self.chat.busy and self.bus.state in ("speaking", "thinking"):
            self.bus.set_state("idle")

    # -- enunciados -------------------------------------------------------------------------------------------------
    async def _transcribe(self, utt: np.ndarray) -> tuple[str | None, float]:
        t0 = time.perf_counter()
        try:
            res = await asyncio.to_thread(self.engines.stt.transcribe, to_float32(utt))
        except Exception as exc:  # noqa: BLE001
            self._emit(ev="error", error=f"reconocimiento de voz: {str(exc)[:120]}")
            return None, 0.0
        return res.text.strip(), time.perf_counter() - t0

    async def _utterance(self, utt: np.ndarray, ptt: bool = False) -> None:
        if self._busy or self.engines is None:
            return
        self._busy = True
        try:
            self.bus.set_state("transcribing")
            self._emit(ev="transcribing")
            if ptt or self.mode == "always":
                await self._submit_from(utt)
            else:
                await self._wake_flow(utt)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            log.exception("web: fallo el procesamiento de un enunciado")
            self._emit(ev="error", error="error interno de voz")
        finally:
            self._busy = False
            if self.bus.state == "transcribing":
                self.bus.set_state("idle")

    async def _submit_from(self, utt: np.ndarray, text: str | None = None, stt_s: float = 0.0) -> None:
        if text is None:
            text, stt_s = await self._transcribe(utt)
        if not text or is_noise_transcript(text):
            self._emit(ev="ignored", why="ruido", text=text or "")
            return
        await self._submit(text, stt_s)

    async def _submit(self, text: str, stt_s: float) -> None:
        self._emit(ev="transcript", text=text, stt_s=round(stt_s, 2))
        try:
            await self.chat.submit(text, speak=True, via="voz")
        except ValueError as exc:
            self._emit(ev="ignored", why=str(exc), text=text)

    async def _wake_flow(self, utt: np.ndarray) -> None:
        eng = self.engines
        assert eng is not None and eng.wake is not None
        if self._followup_until and time.monotonic() <= self._followup_until:
            self._followup_until = 0.0
            await self._submit_from(utt)  # tras "piantao" a secas, el siguiente enunciado es la orden
            return
        rest = await asyncio.to_thread(eng.wake.detect, to_float32(utt))
        if rest is None:
            self._emit(ev="ignored", why="sin palabra de activacion")
            return
        text, stt_s = await self._transcribe(utt)
        if text is None:
            return
        after = eng.wake.strip(text)
        command = after if after is not None else rest
        if len(re.sub(r"\W", "", command)) >= 2 and not is_noise_transcript(command):
            await self._submit(command, stt_s)
            return
        self._followup_until = time.monotonic() + eng.followup_s
        self._emit(ev="followup", seconds=eng.followup_s)
        self.bus.set_state("listening")
        if eng.chime is not None and self.out is not None:
            self.out.play(eng.chime[0], eng.chime[1])

    # -- comandos (reciben la conexion que los envia) -----------------------------------------------------------------
    def handlers(self) -> dict[str, Callable[[dict[str, Any], Any], Any]]:
        async def voice_start(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return await self.start(client, args.get("mode"))

        async def voice_stop(args: dict[str, Any], client: Any) -> bool:
            if client is not self.client:
                return False
            await self.stop(client)
            return True

        async def voice_ptt(args: dict[str, Any], client: Any) -> bool:
            return await self.ptt(client, args.get("down"))

        async def voice_interrupt(args: dict[str, Any], client: Any) -> bool:
            if client is not self.client:
                raise ValueError("la voz no esta activa en esta pestana")
            return await self.interrupt()

        async def voice_info(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return {**self.info(), "mine": client is self.client}

        return {"voice_start": voice_start, "voice_stop": voice_stop, "voice_ptt": voice_ptt,
                "voice_interrupt": voice_interrupt, "voice_info": voice_info}

    def on_binary(self, client: Any, data: bytes) -> None:
        pcm = parse_mic(data)
        if pcm is not None:
            self.feed(client, pcm)

    def on_disconnect(self, client: Any) -> None:
        if client is self.client:
            self._spawn_stop(client)

    def _spawn_stop(self, client: Any) -> None:
        asyncio.ensure_future(self.stop(client))
