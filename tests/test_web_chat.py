import asyncio
import json
from types import SimpleNamespace as NS

import aiohttp
import pytest

from piantao.core import EventBus
from piantao.core.agent import AgentEvent
from piantao.security import ActionRequest
from piantao.web import ChatSession, PairingManager, SessionStore, WebConfig, WebConfirmer, WebGateway
from piantao.web.chat import EXPLICIT_PHRASE, MAX_USER_TEXT, describe_request
from piantao.web.gateway import CSRF_HEADER


def run(coro):
    return asyncio.run(coro)


class FakeAgent:
    def __init__(self, script=None, gate=None):
        self.history, self.conversation_id, self.script, self.gate = [], None, script or [], gate
        self.resumed = None

    async def respond(self, text, **_):
        self.history.append({"role": "user", "content": text})
        out = []
        try:
            for ev in self.script:
                if self.gate is not None and ev.kind == "gate":
                    await self.gate.wait()
                    continue
                if isinstance(ev, Exception):
                    raise ev
                out.append(ev.text if ev.kind == "text" else "")
                yield ev
        finally:
            self.history.append({"role": "assistant", "content": "".join(out)})
        yield AgentEvent("done")

    def reset(self):
        self.history.clear()

    def resume(self, cid):
        if cid == 99:
            raise LookupError("No existe la conversacion #99.")
        self.resumed = cid
        return 3


def setup(agent):
    bus = EventBus()
    sent = []
    conf = WebConfirmer(bus, timeout_s=1)
    conf.broadcast, conf.has_clients = sent.append, lambda: True
    chat = ChatSession(agent, bus, sent.append, conf)
    return bus, sent, conf, chat, chat.handlers()


def test_turn_streams_text_tools_and_returns_to_idle():
    async def go():
        tool = NS(arguments='{"q":1}')
        res = NS(ok=True, denied=False, text="x" * 3000)
        agent = FakeAgent([AgentEvent("reasoning", text="hmm"), AgentEvent("text", text="Ho"), AgentEvent("tool_start", text="web", tool_calls=[tool]),
                           AgentEvent("tool_result", text="web", result=res), AgentEvent("text", text="la")])
        bus, sent, _c, chat, h = setup(agent)
        r = await h["chat_send"]({"text": "  hola  "})
        assert r == {"turn": 1}
        await chat._task
        evs = [m["ev"] for m in sent if m["t"] == "chat"]
        assert evs == ["start", "reasoning", "text", "tool_start", "tool_result", "text", "done"]
        assert sent[0]["text"] == "hola" and sent[-1]["outcome"] == "done"
        tr = next(m for m in sent if m.get("ev") == "tool_result")
        assert len(tr["text"]) < 1600 and bus.state == "idle"
        hist = await h["chat_history"]({})
        assert hist["messages"][0] == {"role": "user", "text": "hola"} and hist["messages"][1]["text"] == "Hola"
    run(go())


def test_only_one_turn_and_validation():
    async def go():
        gate = asyncio.Event()
        agent = FakeAgent([AgentEvent("gate"), AgentEvent("text", text="ok")], gate)
        _b, sent, _c, chat, h = setup(agent)
        for bad in ({}, {"text": ""}, {"text": "   "}, {"text": 5}, {"text": "x" * (MAX_USER_TEXT + 1)}):
            with pytest.raises(ValueError):
                await h["chat_send"](bad)
        await h["chat_send"]({"text": "uno"})
        await asyncio.sleep(0.05)
        with pytest.raises(ValueError):
            await h["chat_send"]({"text": "dos"})
        with pytest.raises(ValueError):
            await h["chat_new"]({})
        gate.set()
        await chat._task
        assert await h["chat_new"]({}) is True and agent.history == []
    run(go())


def test_interrupt_cancels_keeps_partial_and_reports():
    async def go():
        gate = asyncio.Event()
        agent = FakeAgent([AgentEvent("text", text="parte"), AgentEvent("gate"), AgentEvent("text", text="nunca")], gate)
        bus, sent, _c, chat, h = setup(agent)
        await h["chat_send"]({"text": "hola"})
        await asyncio.sleep(0.05)
        assert await h["chat_interrupt"]({}) is True
        await chat._task
        assert sent[-1] == {"t": "chat", "ev": "done", "turn": 1, "outcome": "interrupted"}
        assert agent.history[-1]["content"] == "parte" and bus.state == "idle"
        assert await h["chat_interrupt"]({}) is False
    run(go())


def test_error_is_reported_and_chat_recovers():
    async def go():
        agent = FakeAgent([RuntimeError("proveedor caido")])
        bus, sent, _c, chat, h = setup(agent)
        await h["chat_send"]({"text": "hola"})
        await chat._task
        assert [m["ev"] for m in sent] == ["start", "error", "done"] and "proveedor caido" in sent[1]["error"]
        assert sent[-1]["outcome"] == "error" and bus.state == "idle"
        agent.script = [AgentEvent("text", text="ya")]
        await h["chat_send"]({"text": "otra vez"})
        await chat._task
        assert sent[-1]["outcome"] == "done"
    run(go())


def test_resume_validation():
    async def go():
        _b, _s, _c, _chat, h = setup(FakeAgent())
        assert await h["chat_resume"]({"conversation_id": 5}) == {"loaded": 3}
        for bad in ({}, {"conversation_id": 0}, {"conversation_id": "1"}, {"conversation_id": True}):
            with pytest.raises(ValueError):
                await h["chat_resume"](bad)
        with pytest.raises(LookupError):
            await h["chat_resume"]({"conversation_id": 99})
    run(go())


# ---- confirmaciones ----------------------------------------------------------------------------------------------
def req(**kw):
    base = dict(kind="shell_exec", description="Ejecutar ls", details={"tool": "run_command"}, payload={"cmd": "ls"}, origin="model")
    base.update(kw)
    return ActionRequest(**base)


def test_confirm_allow_deny_and_state():
    async def go():
        bus, sent, conf, _chat, h = setup(FakeAgent())
        t = asyncio.create_task(conf(req(), False))
        await asyncio.sleep(0.02)
        m = sent[0]
        assert m["t"] == "confirm" and m["description"] == "Ejecutar ls" and m["payload"].startswith("{") and bus.state == "confirming"
        assert await h["permission_answer"]({"id": m["id"], "allow": True}) is True
        assert await t is True and sent[-1] == {"t": "confirm_done", "id": m["id"], "allowed": True}
        t = asyncio.create_task(conf(req(), False))
        await asyncio.sleep(0.02)
        await h["permission_answer"]({"id": sent[-1]["id"], "allow": False})
        assert await t is False
    run(go())


def test_confirm_only_literal_true_allows():
    async def go():
        _b, sent, conf, _c, h = setup(FakeAgent())
        for val in ("true", 1, "si", None, [True]):
            t = asyncio.create_task(conf(req(), False))
            await asyncio.sleep(0.01)
            await h["permission_answer"]({"id": sent[-1]["id"], "allow": val})
            assert await t is False, val
    run(go())


def test_explicit_requires_exact_phrase():
    async def go():
        _b, sent, conf, _c, h = setup(FakeAgent())
        t = asyncio.create_task(conf(req(), True))
        await asyncio.sleep(0.01)
        cid = sent[-1]["id"]
        for phrase in (None, "confirmar", "CONFIRMAR ", "si"):
            with pytest.raises(ValueError):
                await h["permission_answer"]({"id": cid, "allow": True, "phrase": phrase})
        assert not t.done()
        await h["permission_answer"]({"id": cid, "allow": True, "phrase": EXPLICIT_PHRASE})
        assert await t is True
    run(go())


def test_confirm_denied_on_timeout_no_clients_and_unknown_or_double_answer():
    async def go():
        _b, sent, conf, _c, h = setup(FakeAgent())
        assert await conf(req(), False) is False  # timeout_s=1
        assert sent[-1]["t"] == "confirm_done" and sent[-1]["allowed"] is False
        late = sent[-2]["id"]
        with pytest.raises(LookupError):
            await h["permission_answer"]({"id": late, "allow": True})  # respuesta tardia
        with pytest.raises(LookupError):
            await h["permission_answer"]({"id": "inventado", "allow": True})
        conf.has_clients = lambda: False
        sent.clear()
        assert await conf(req(), False) is False and sent == []  # sin navegadores: ni se pregunta
        conf.broadcast = None
        conf.has_clients = lambda: True
        assert await conf(req(), False) is False
    run(go())


def test_interrupt_and_stop_deny_pending_confirmations():
    async def go():
        _b, sent, conf, chat, h = setup(FakeAgent())
        t = asyncio.create_task(conf(req(), False))
        await asyncio.sleep(0.01)
        await chat.stop()
        assert await t is False
    run(go())


def test_describe_request_truncates_and_is_plain_text():
    d = describe_request(req(payload="<script>x</script>" * 5000, details={"k": "v" * 1000}), False)
    assert len(d["payload"]) < 20100 and d["payload"].startswith("<script>") and len(d["details"]["k"]) < 400
    assert describe_request(req(payload=None), True)["payload"] is None


# ---- integracion con la pasarela -----------------------------------------------------------------------------------
def test_gateway_chat_roundtrip_and_confirm_over_ws(tmp_path):
    async def go():
        agent = FakeAgent([AgentEvent("text", text="hola!")])
        bus = EventBus()
        conf = WebConfirmer(bus, timeout_s=5)
        pairing = PairingManager()
        gw = WebGateway(bus, lambda: {"state": bus.state}, {}, WebConfig(port=0), SessionStore(tmp_path / "s.json"), pairing)
        chat = ChatSession(agent, bus, gw.broadcast, conf)
        conf.broadcast, conf.has_clients = gw.broadcast, lambda: gw.clients > 0
        gw.handlers.update(chat.handlers())
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                code, _ = pairing.issue()
                H = {"Origin": gw.url, CSRF_HEADER: "1"}
                assert (await s.post(gw.url + "/api/pair", json={"code": code}, headers=H)).status == 200
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    await ws.receive(); await ws.receive()

                    async def recv_until(pred):
                        while True:
                            m = json.loads((await asyncio.wait_for(ws.receive(), 3)).data)
                            if pred(m):
                                return m

                    await ws.send_str(json.dumps({"t": "cmd", "id": 1, "name": "chat_send", "args": {"text": "hola"}}))
                    done = await recv_until(lambda m: m.get("ev") == "done")
                    assert done["outcome"] == "done"
                    ask = asyncio.create_task(conf(req(), False))
                    c = await recv_until(lambda m: m["t"] == "confirm")
                    await ws.send_str(json.dumps({"t": "cmd", "id": 2, "name": "permission_answer", "args": {"id": c["id"], "allow": True}}))
                    assert await ask is True
        finally:
            await chat.stop()
            await gw.stop()
    run(go())
