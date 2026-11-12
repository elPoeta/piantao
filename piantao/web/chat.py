"""Chat del navegador: un turno a la vez con streaming, interrupcion y confirmaciones de permisos en pantalla.

El contenido de la conversacion viaja SOLO por el WebSocket autenticado (mensajes `chat`/`confirm`), nunca por el bus de
eventos que ven el HUD y el panel local. Las confirmaciones se generan aqui (capa de confianza), no a partir de texto del modelo.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
import secrets
from typing import Any, Callable

log = logging.getLogger("piantao.web.chat")
Broadcast = Callable[[dict[str, Any]], None]
EXPLICIT_PHRASE = "CONFIRMAR"
MAX_USER_TEXT = 8000
PAYLOAD_PREVIEW = 20000


def _clip(text: Any, n: int) -> str:
    s = text if isinstance(text, str) else str(text)
    return s if len(s) <= n else s[:n] + f"... (+{len(s) - n} caracteres)"


def describe_request(req: Any, explicit: bool) -> dict[str, Any]:
    """Resumen mostrable de una ActionRequest. Todo es texto plano; la interfaz nunca lo interpreta como HTML."""
    payload = getattr(req, "payload", None)
    if payload is None:
        text = None
    elif isinstance(payload, str):
        text = payload
    else:
        text = json.dumps(payload, ensure_ascii=False, default=str, indent=2)
    return {
        "kind": req.kind, "description": _clip(req.description, 600), "origin": req.origin, "explicit": bool(explicit),
        "tainted": bool(req.tainted),
        "details": {str(k): _clip(v, 300) for k, v in list((req.details or {}).items())[:20]},
        "payload": None if text is None else _clip(text, PAYLOAD_PREVIEW),
    }


class WebConfirmer:
    """Confirmador asincrono: pregunta a los navegadores conectados y espera la primera respuesta valida."""

    def __init__(self, bus: Any = None, timeout_s: float = 120.0):
        self.bus, self.timeout_s = bus, timeout_s
        self.broadcast: Broadcast | None = None
        self.has_clients: Callable[[], bool] = lambda: False
        self._pending: dict[str, tuple[asyncio.Future[bool], dict[str, Any]]] = {}

    async def __call__(self, req: Any, explicit: bool) -> bool:
        if self.broadcast is None or not self.has_clients():
            return False  # nadie mirando: no se autoriza nada
        cid = secrets.token_hex(8)
        info = {"id": cid, **describe_request(req, explicit)}
        fut: asyncio.Future[bool] = asyncio.get_running_loop().create_future()
        self._pending[cid] = (fut, info)
        if self.bus is not None:
            self.bus.set_state("confirming")
        self.broadcast({"t": "confirm", **info, "timeout_s": self.timeout_s})
        allowed = False
        try:
            allowed = await asyncio.wait_for(fut, self.timeout_s)
        except asyncio.TimeoutError:
            allowed = False
        finally:
            self._pending.pop(cid, None)
            self.broadcast({"t": "confirm_done", "id": cid, "allowed": bool(allowed)})
        return bool(allowed)

    def answer(self, cid: Any, allow: Any, phrase: Any = None) -> bool:
        """Responde una confirmacion pendiente. Una solicitud explicita solo se autoriza con la frase exacta."""
        entry = self._pending.get(cid) if isinstance(cid, str) else None
        if entry is None or entry[0].done():
            raise LookupError("esa confirmacion ya no esta pendiente")
        fut, info = entry
        allowed = allow is True
        if allowed and info["explicit"] and phrase != EXPLICIT_PHRASE:
            raise ValueError(f"esta accion exige escribir {EXPLICIT_PHRASE}")
        fut.set_result(allowed)
        return allowed

    def pending(self) -> list[dict[str, Any]]:
        return [{**info, "timeout_s": self.timeout_s} for _f, info in self._pending.values()]

    def deny_all(self) -> None:
        for fut, _info in list(self._pending.values()):
            if not fut.done():
                fut.set_result(False)


class ChatSession:
    def __init__(self, agent: Any, bus: Any, broadcast: Broadcast, confirmer: WebConfirmer):
        self.agent, self.bus, self.broadcast, self.confirmer = agent, bus, broadcast, confirmer
        self._task: asyncio.Task[None] | None = None
        self._turn = 0
        self.speaker: Any = None  # objeto con begin/feed/end/stop (SpeechPipeline) mientras la voz web esta activa

    @property
    def busy(self) -> bool:
        return self._task is not None and not self._task.done()

    # -- turno -------------------------------------------------------------------------------------------------------
    async def submit(self, text: str, speak: bool = False, via: str = "web") -> int:
        """Empieza un turno (texto escrito o transcripcion de voz). Con `speak`, la respuesta tambien se dice en voz alta."""
        if not isinstance(text, str) or not text.strip():
            raise ValueError("text debe ser un texto no vacio")
        if len(text) > MAX_USER_TEXT:
            raise ValueError(f"el mensaje supera {MAX_USER_TEXT} caracteres")
        if self.busy:
            raise ValueError("ya hay un turno en curso; interrumpilo o espera")
        self._turn += 1
        spk = self.speaker if speak else None
        self._task = asyncio.create_task(self._run(self._turn, text.strip(), spk, via))
        return self._turn

    async def interrupt(self, wait: bool = False) -> bool:
        if not self.busy:
            return False
        assert self._task is not None
        self._task.cancel()
        if wait:
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await self._task
        return True

    async def _run(self, turn: int, text: str, spk: Any = None, via: str = "web") -> None:
        send = self.broadcast
        self.bus.set_state("thinking")
        send({"t": "chat", "ev": "start", "turn": turn, "text": text, "via": via})
        outcome = "done"
        if spk is not None:
            spk.begin()
        try:
            async for ev in self.agent.respond(text):
                if ev.kind == "text":
                    if spk is not None:
                        self.bus.set_state("speaking")
                        spk.feed(ev.text)
                    send({"t": "chat", "ev": "text", "turn": turn, "text": ev.text})
                elif ev.kind == "reasoning":
                    send({"t": "chat", "ev": "reasoning", "turn": turn, "text": ev.text})
                elif ev.kind == "tool_start":
                    c = ev.tool_calls[0] if ev.tool_calls else None
                    send({"t": "chat", "ev": "tool_start", "turn": turn, "name": ev.text,
                          "args": _clip(getattr(c, "arguments", "") or "", 400)})
                elif ev.kind == "tool_result" and ev.result is not None:
                    r = ev.result
                    send({"t": "chat", "ev": "tool_result", "turn": turn, "name": ev.text, "ok": bool(r.ok),
                          "denied": bool(r.denied), "text": _clip(r.text, 1500)})
                elif ev.kind == "tool_calls":
                    send({"t": "chat", "ev": "error", "turn": turn, "error": "el modelo pidio herramientas pero no hay ejecutor"})
        except asyncio.CancelledError:
            outcome = "interrupted"
        except Exception as exc:  # noqa: BLE001
            outcome = "error"
            log.warning("web: el turno fallo: %s", type(exc).__name__)
            send({"t": "chat", "ev": "error", "turn": turn, "error": _clip(str(exc) or type(exc).__name__, 300)})
        finally:
            self.confirmer.deny_all()
            if spk is not None:
                if outcome == "done":
                    spk.end()  # termina de decir lo pendiente; el estado vuelve a idle cuando acaba el audio
                else:
                    spk.stop()
            if spk is None or outcome != "done":
                self.bus.set_state("idle")
            send({"t": "chat", "ev": "done", "turn": turn, "outcome": outcome})

    # -- comandos ----------------------------------------------------------------------------------------------------
    def handlers(self) -> dict[str, Callable[[dict[str, Any]], Any]]:
        async def chat_send(args: dict[str, Any]) -> dict[str, Any]:
            speak = args.get("speak", False)
            if not isinstance(speak, bool):
                raise ValueError("speak debe ser true o false")
            return {"turn": await self.submit(args.get("text"), speak=speak and self.speaker is not None)}

        async def chat_interrupt(args: dict[str, Any]) -> bool:
            return await self.interrupt()

        async def chat_history(args: dict[str, Any]) -> dict[str, Any]:
            msgs = [{"role": m["role"], "text": m["content"]} for m in self.agent.history
                    if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)]
            return {"messages": msgs[-200:], "busy": self.busy, "turn": self._turn,
                    "conversation_id": self.agent.conversation_id, "pending": self.confirmer.pending()}

        async def chat_new(args: dict[str, Any]) -> bool:
            if self.busy:
                raise ValueError("hay un turno en curso")
            self.agent.reset()
            return True

        async def chat_resume(args: dict[str, Any]) -> dict[str, Any]:
            if self.busy:
                raise ValueError("hay un turno en curso")
            cid = args.get("conversation_id")
            if isinstance(cid, bool) or not isinstance(cid, int) or cid < 1:
                raise ValueError("conversation_id invalido")
            try:
                n = self.agent.resume(cid)
            except RuntimeError as exc:
                raise ValueError(str(exc)) from exc
            return {"loaded": n}

        async def permission_answer(args: dict[str, Any]) -> bool:
            return self.confirmer.answer(args.get("id"), args.get("allow"), args.get("phrase"))

        return {"chat_send": chat_send, "chat_interrupt": chat_interrupt, "chat_history": chat_history,
                "chat_new": chat_new, "chat_resume": chat_resume, "permission_answer": permission_answer}

    async def stop(self) -> None:
        self.confirmer.deny_all()
        if self.busy:
            assert self._task is not None
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await self._task
