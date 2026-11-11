"""Que ve y que puede hacer el panel: snapshot de estado y una lista fija de comandos con argumentos validados."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Callable

from piantao.core.reasoning import MODES as REASONING_MODES
from piantao.models.router import RouterError
from piantao.security.audit import read_tail

from .server import Handler

QUERIES = ("conversations", "messages", "memories", "tool_history", "audit", "preferences", "stats")


def _safe(fn: Callable[[], dict[str, Any]] | None) -> dict[str, Any]:
    try:
        return dict(fn()) if fn else {}
    except Exception:  # noqa: BLE001 - un dato de panel nunca debe romper el snapshot
        return {}


def _text(args: dict[str, Any], key: str, limit: int = 80) -> str:
    v = args.get(key)
    if not isinstance(v, str) or not v.strip() or len(v) > limit:
        raise ValueError(f"'{key}' debe ser texto no vacio")
    return v.strip()


def _int(args: dict[str, Any], key: str, default: int, lo: int, hi: int) -> int:
    v = args.get(key, default)
    if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
        raise ValueError(f"'{key}' debe ser un entero entre {lo} y {hi}")
    return v


def build_handlers(router: Any, agent: Any, bus: Any, audit_path: Path | str | None = None, voice: Any = None,
                   hub: Any = None, resources: Any = None, mode: str = "voice",
                   clock: Callable[[], float] = time.time, voice_info: Callable[[], dict[str, Any]] | None = None,
                   vision_info: Callable[[], dict[str, Any]] | None = None) -> tuple[Callable[[], dict[str, Any]], dict[str, Handler]]:
    started = clock()

    def snapshot() -> dict[str, Any]:
        mcp = getattr(agent, "mcp", None)
        tools = agent.tools.tools() if getattr(agent, "tools", None) else []
        return {
            "state": bus.state, "mode": mode, "uptime_s": round(clock() - started),
            **router.status(),
            "reasoning": agent.reasoning.mode if getattr(agent, "reasoning", None) else None,
            "incognito": bool(agent.incognito), "memory": agent.memory is not None,
            "gestures_active": bool(hub and hub.active),
            "tools": [{"name": t.name, "source": t.source, "action": t.action if isinstance(t.action, str) else "?",
                       "untrusted": bool(t.untrusted)} for t in tools],
            "mcp": [{"name": s.name, "state": s.state, "detail": s.detail, "tools": len(s.tools)}
                    for s in (mcp.status() if mcp else [])],
            "resources": dict(resources.last) if resources else {},
            "voice": _safe(voice_info), "vision": _safe(vision_info),
        }

    async def ping(args: dict[str, Any]) -> str:
        return "pong"

    async def get_snapshot(args: dict[str, Any]) -> dict[str, Any]:
        return snapshot()

    async def interrupt(args: dict[str, Any]) -> bool:
        return bool(voice.interrupt()) if voice is not None else False

    async def talk(args: dict[str, Any]) -> bool:
        return bool(voice.talk()) if voice is not None and hasattr(voice, "talk") else False

    def _perms() -> Any:
        pm = getattr(getattr(agent, "tools", None), "permissions", None)
        if pm is None or not hasattr(pm, "matrix"):
            raise ValueError("la gestion de permisos no esta disponible")
        return pm

    async def get_permissions(args: dict[str, Any]) -> list[dict[str, Any]]:
        return _perms().matrix()

    async def tighten_permission(args: dict[str, Any]) -> list[dict[str, Any]]:
        pm = _perms()
        level = args.get("level")
        pm.tighten(_text(args, "action"), level)  # valida que sea mas estricto; aflojar no existe por aqui
        bus.publish("settings", permissions="tightened")
        return pm.matrix()

    def _mcp() -> Any:
        mcp = getattr(agent, "mcp", None)
        if mcp is None:
            raise ValueError("MCP no esta disponible")
        return mcp

    def _srv(st: Any) -> dict[str, Any]:
        return {"name": st.name, "state": st.state, "detail": st.detail, "tools": len(st.tools)}

    async def mcp_pause(args: dict[str, Any]) -> dict[str, Any]:
        return _srv(await _mcp().pause(_text(args, "server")))

    async def mcp_restart(args: dict[str, Any]) -> dict[str, Any]:
        return _srv(await _mcp().restart(_text(args, "server")))

    async def set_reasoning(args: dict[str, Any]) -> str:
        if agent.reasoning is None:
            raise ValueError("el control de razonamiento no esta disponible")
        mode_ = args.get("mode")
        if mode_ not in REASONING_MODES:
            raise ValueError(f"mode debe ser uno de {REASONING_MODES}")
        agent.reasoning.mode = mode_
        bus.publish("settings", reasoning=mode_)
        return mode_

    async def select_model(args: dict[str, Any]) -> dict[str, Any]:
        provider, model = args.get("provider"), args.get("model")
        for v in (provider, model):
            if v is not None and (not isinstance(v, str) or not v.strip() or len(v) > 120):
                raise ValueError("provider/model deben ser texto no vacio")
        if provider is None and model is None:
            raise ValueError("indica provider y/o model")
        try:
            router.select(provider, model)
        except RouterError as exc:
            raise ValueError(str(exc)) from exc
        # elegir un proveedor cloud no envia nada: cada envio pide su autorizacion
        status = router.status()
        bus.publish("settings", provider=status["provider"], model=status["model"], cloud=status["cloud"])
        return status

    async def query(args: dict[str, Any]) -> Any:
        kind = args.get("kind")
        if kind not in QUERIES:
            raise ValueError(f"kind debe ser uno de {QUERIES}")
        mem = agent.memory
        if kind == "audit":
            return read_tail(audit_path, _int(args, "n", 30, 1, 200)) if audit_path else []
        if mem is None:
            raise ValueError("la memoria esta deshabilitada")
        if kind == "conversations":
            return mem.list_conversations(_int(args, "limit", 30, 1, 100))
        if kind == "messages":
            return mem.get_messages(_int(args, "conversation_id", 0, 1, 10**9), limit=_int(args, "limit", 100, 1, 300))
        if kind == "memories":
            return mem.list_memories(args.get("memory_kind") if isinstance(args.get("memory_kind"), str) else None,
                                     _int(args, "limit", 50, 1, 200))
        if kind == "tool_history":
            return mem.tool_history(_int(args, "limit", 30, 1, 100))
        if kind == "preferences":
            return mem.get_preferences()
        return mem.stats()

    return snapshot, {"ping": ping, "get_snapshot": get_snapshot, "interrupt": interrupt, "talk": talk,
                      "get_permissions": get_permissions, "tighten_permission": tighten_permission,
                      "mcp_pause": mcp_pause, "mcp_restart": mcp_restart,
                      "set_reasoning": set_reasoning, "select_model": select_model, "query": query}
