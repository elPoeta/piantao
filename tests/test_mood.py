import asyncio
from types import SimpleNamespace as NS

import pytest

from piantao.core.agent import AgentEvent
from piantao.core.events import EventBus
from piantao.core.mood import ANALYZING, SEARCHING, WRITING, action_state, tool_state
from piantao.tools.base import ToolResult
from piantao.web import ChatSession, WebConfirmer


@pytest.mark.parametrize("action,want", [("search_web", SEARCHING), ("browse_web", SEARCHING), ("mcp_browse", SEARCHING),
                                         ("create_document", WRITING), ("modify_file", WRITING), ("run_command", WRITING), ("mcp_write", WRITING),
                                         ("read_authorized_file", ANALYZING), ("screen_capture", ANALYZING), ("system_info", ANALYZING),
                                         ("mcp_read", ANALYZING), ("algo_nuevo", ANALYZING)])
def test_action_groups(action, want):
    assert action_state(action) == want


def test_tool_state_static_dynamic_and_broken_actions():
    reg = NS(get=lambda n: {"a": NS(action="search_web"), "b": NS(action=lambda args: "modify_file" if args.get("w") else "read_authorized_file"),
                            "c": NS(action=lambda args: 1 / 0)}.get(n))
    assert tool_state(reg, NS(name="a", arguments="{}")) == SEARCHING
    assert tool_state(reg, NS(name="b", arguments='{"w": 1}')) == WRITING
    assert tool_state(reg, NS(name="b", arguments="{}")) == ANALYZING
    assert tool_state(reg, NS(name="c", arguments="{}")) == ANALYZING          # accion rota: nunca rompe el turno
    assert tool_state(reg, NS(name="b", arguments="no es json")) == ANALYZING
    assert tool_state(reg, NS(name="desconocida", arguments="{}")) == ANALYZING and tool_state(None, NS(name="x", arguments="")) == ANALYZING


def _session(script, tools):
    bus = EventBus()
    seen = []
    bus.subscribe(lambda e: seen.append(e.data["state"]), kinds=("state",))

    class Agent:
        conversation_id, history = None, []

        def __init__(self):
            self.tools = tools

        async def respond(self, text, **_):
            for ev in script:
                yield ev
            yield AgentEvent("done")

        def reset(self):
            pass

    confirm = WebConfirmer(bus, timeout_s=5)
    return ChatSession(Agent(), bus, lambda m: None, confirm), bus, seen


def _call(name):
    return NS(name=name, arguments="{}", id="1")


def _run(chat, text="hola"):
    async def go():
        await chat.submit(text)
        await chat._task
        return chat
    return asyncio.run(go())


def test_turn_with_tools_walks_through_states_and_ends_celebrating_then_idle(monkeypatch):
    import piantao.web.chat as mod
    monkeypatch.setattr(mod, "CELEBRATE_S", 0.05)
    reg = NS(get=lambda n: NS(action="search_web" if n == "buscar" else "modify_file"))
    script = [AgentEvent("tool_start", text="buscar", tool_calls=[_call("buscar")]), AgentEvent("tool_result", text="buscar", result=ToolResult(name="t", text="ok", ok=True)),
              AgentEvent("tool_start", text="guardar", tool_calls=[_call("guardar")]), AgentEvent("tool_result", text="guardar", result=ToolResult(name="t", text="ok", ok=True)),
              AgentEvent("text", text="listo")]
    chat, bus, seen = _session(script, reg)

    async def go():
        await chat.submit("hacelo")
        await chat._task
        assert bus.state == "celebrating"
        await asyncio.sleep(0.2)
        return bus.state
    assert asyncio.run(go()) == "idle"
    assert seen == ["thinking", "searching", "thinking", "writing", "thinking", "explaining", "celebrating", "idle"], seen


def test_failed_denied_or_toolless_turns_do_not_celebrate():
    reg = NS(get=lambda n: NS(action="modify_file"))
    for result in (ToolResult(name="t", text="x", ok=False), ToolResult(name="t", text="x", ok=True, denied=True)):
        chat, bus, seen = _session([AgentEvent("tool_start", text="t", tool_calls=[_call("t")]), AgentEvent("tool_result", text="t", result=result)], reg)
        _run(chat)
        assert "celebrating" not in seen and bus.state == "idle", seen
    chat, bus, seen = _session([AgentEvent("text", text="solo charla")], reg)
    _run(chat)
    assert seen == ["thinking", "explaining", "idle"], seen


def test_new_turn_during_celebration_is_not_clobbered_by_the_old_timer(monkeypatch):
    import piantao.web.chat as mod
    monkeypatch.setattr(mod, "CELEBRATE_S", 0.1)
    reg = NS(get=lambda n: NS(action="modify_file"))
    ok = [AgentEvent("tool_start", text="t", tool_calls=[_call("t")]), AgentEvent("tool_result", text="t", result=ToolResult(name="t", text="ok"))]
    chat, bus, seen = _session(ok, reg)

    async def go():
        await chat.submit("uno"); await chat._task
        assert bus.state == "celebrating"
        bus.set_state("listening")            # el usuario ya hizo otra cosa
        await asyncio.sleep(0.25)
        return bus.state
    assert asyncio.run(go()) == "listening"
