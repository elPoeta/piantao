"""Panel completo: endurecer permisos, pausar/reiniciar MCP y datos de voz/vision. El panel nunca puede aflojar nada."""

import asyncio
from types import SimpleNamespace as NS

import pytest

from piantao.config import load_config
from piantao.core import EventBus
from piantao.ipc import build_handlers
from piantao.mcp import McpConfig, McpManager
from piantao.security import ActionRequest, PermissionManager
from piantao.tools import ToolRegistry, ToolsConfig
from tests.test_mcp import Audit, FakeClient, approve, build, factory_for, fake_tool, mcfg, srv
from tests.test_permissions import Asker


def run(c):
    return asyncio.run(c)


def pm_for(tmp_path, confirmer=None, audit=None):
    return PermissionManager(load_config(), confirmer=confirmer, audit=audit, root=tmp_path)


# ---- permisos ---------------------------------------------------------------------------------------------------

def test_matrix_lists_actions_with_policy(tmp_path):
    m = {r["action"]: r for r in pm_for(tmp_path).matrix()}
    assert m["cloud_transfer"]["policy"] in ("confirm", "confirm_explicit") and m["cloud_transfer"]["tightened"] is False
    assert "privileged" in m


def test_tighten_only_stricter_and_takes_effect(tmp_path):
    asker, audit = Asker(True), Audit()
    pm = pm_for(tmp_path, asker, audit)
    req = lambda: ActionRequest("camera_capture", "foto", {})
    # camera_capture esta en nivel 2 (automatico+registro) o similar: se endurece a confirmacion
    before = {r["action"]: r for r in pm.matrix()}["camera_capture"]
    assert before["policy"] == "auto"
    assert run(pm.check(req())).allowed and asker.calls == []
    pm.tighten("camera_capture", 3)
    assert run(pm.check(req())).allowed and asker.calls == [("camera_capture", False)]  # ahora pide confirmacion
    pm.tighten("camera_capture", 4)
    run(pm.check(req()))
    assert asker.calls[-1] == ("camera_capture", True)
    pm.tighten("camera_capture", "never")
    d = run(pm.check(req()))
    assert not d.allowed
    assert [e for e, f in audit.events if e == "permission_tightened"] and \
        {r["action"]: r for r in pm.matrix()}["camera_capture"]["tightened"] is True


@pytest.mark.parametrize("kind,spec", [("camera_capture", 1), ("camera_capture", 2), ("desktop_notify", 1), ("nada", 3),
                                       ("camera_capture", 9), ("camera_capture", True), ("camera_capture", "auto")])
def test_tighten_refuses_loosening_or_garbage(tmp_path, kind, spec):
    pm = pm_for(tmp_path)
    pm.tighten("camera_capture", 3)
    snapshot = pm.matrix()
    with pytest.raises(ValueError):
        pm.tighten(kind, spec)
    assert pm.matrix() == snapshot


def test_never_cannot_be_relaxed(tmp_path):
    pm = pm_for(tmp_path)
    pm.tighten("camera_capture", "never")
    for spec in (1, 3, 4, "never"):
        with pytest.raises(ValueError):
            pm.tighten("camera_capture", spec)


# ---- MCP --------------------------------------------------------------------------------------------------------

def test_mcp_pause_and_restart(tmp_path):
    client = FakeClient([fake_tool("echo")])
    mgr, reg, audit = build(tmp_path, {"s1": srv()}, client)
    approve(mgr)

    async def go():
        await mgr.start()
        assert "mcp__s1__echo" in reg.names()
        st = await mgr.pause("s1")
        assert st.state == "pausado" and "mcp__s1__echo" not in reg.names()
        st = await mgr.restart("s1")
        assert st.state == "conectado" and "mcp__s1__echo" in reg.names()
        await mgr.stop()

    run(go())
    ev = [e for e, _ in audit.events]
    assert "mcp_server_paused" in ev and "mcp_server_restarted" in ev


def test_mcp_restart_rechecks_pin_and_authorization(tmp_path):
    client = FakeClient([fake_tool("echo")])
    mgr, reg, audit = build(tmp_path, {"s1": srv(), "s2": srv()}, client, authorized=["s1"])
    approve(mgr)

    async def go():
        await mgr.start()
        client.tools = [fake_tool("echo", desc="CAMBIADO por el servidor")]  # el servidor cambio sus herramientas
        st = await mgr.restart("s1")
        assert st.state == "omitido" and "mcp__s1__echo" not in reg.names()  # no se re-aprueba solo
        for bad in ("s2", "nope"):
            with pytest.raises(ValueError):
                await mgr.restart(bad)
        with pytest.raises(ValueError):
            await mgr.pause("nope")

    run(go())


# ---- comandos del panel -------------------------------------------------------------------------------------------

def handlers_for(tmp_path, with_pm=True, mgr=None):
    bus = EventBus()
    pm = pm_for(tmp_path) if with_pm else None
    agent = NS(reasoning=None, incognito=False, memory=None, tools=NS(tools=lambda: [], permissions=pm), mcp=mgr)
    router = NS(status=lambda: {"provider": "local", "model": "m", "cloud": False, "providers": ["local"]})
    snap, h = build_handlers(router, agent, bus, None, None, NS(active=False), None,
                             voice_info=lambda: {"mode": "wake"}, vision_info=lambda: 1 / 0)
    return bus, snap, h, pm


def test_snapshot_includes_voice_and_survives_broken_vision(tmp_path):
    bus, snap, h, pm = handlers_for(tmp_path)
    s = snap()
    assert s["voice"] == {"mode": "wake"} and s["vision"] == {}


def test_handlers_get_and_tighten_permissions(tmp_path):
    bus, snap, h, pm = handlers_for(tmp_path)
    seen = []
    bus.subscribe(seen.append, ("settings",))
    rows = run(h["get_permissions"]({}))
    assert any(r["action"] == "camera_capture" for r in rows)
    rows = run(h["tighten_permission"]({"action": "camera_capture", "level": 3}))
    assert {r["action"]: r for r in rows}["camera_capture"]["tightened"] and seen
    for args in ({"action": "camera_capture", "level": 1}, {"action": "", "level": 3}, {"action": 5, "level": 3},
                 {"action": "camera_capture"}, {"action": "x" * 200, "level": 3}):
        with pytest.raises(ValueError):
            run(h["tighten_permission"](args))
    _, _, h2, _ = handlers_for(tmp_path, with_pm=False)
    with pytest.raises(ValueError, match="no esta disponible"):
        run(h2["get_permissions"]({}))


def test_handlers_mcp_pause_restart_validate_input(tmp_path):
    client = FakeClient([fake_tool("echo")])
    mgr, reg, audit = build(tmp_path, {"s1": srv()}, client)
    approve(mgr)
    bus, snap, h, pm = handlers_for(tmp_path, mgr=mgr)

    async def go():
        await mgr.start()
        r = await h["mcp_pause"]({"server": "s1"})
        assert r["state"] == "pausado" and r["tools"] == 0
        r = await h["mcp_restart"]({"server": "s1"})
        assert r["state"] == "conectado" and r["tools"] == 1
        for bad in ({}, {"server": 3}, {"server": "x" * 500}, {"server": "../etc"}):
            with pytest.raises(ValueError):
                await h["mcp_restart"](bad)
        await mgr.stop()

    run(go())


def test_there_is_no_command_to_approve_mcp_or_loosen_permissions(tmp_path):
    bus, snap, h, pm = handlers_for(tmp_path)
    names = set(h)
    assert not any(n for n in names if "approve" in n or "loosen" in n or "relax" in n or "set_permission" in n)
