import asyncio
from types import SimpleNamespace as NS
import functools
import os
import shutil
import tempfile
import threading
import time
from pathlib import Path

import pytest

pytest.importorskip("PySide6")
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

from PySide6.QtWidgets import QApplication  # noqa: E402

from piantao.ui.link import AgentLink  # noqa: E402
from piantao.ui.panel import Panel  # noqa: E402
from test_ipc import make  # noqa: E402


@pytest.fixture(scope="module")
def app():
    return QApplication.instance() or QApplication([])


class Backend:
    """UiServer real en un hilo con su propio loop (el panel corre en el hilo de Qt)."""

    def __init__(self, sockdir):
        self.loop = asyncio.new_event_loop()
        self.tmp = sockdir
        self.bus, self.agent, self.router, self.srv = make(sockdir)
        self.ready = threading.Event()
        self.t = threading.Thread(target=self._run, daemon=True)
        self.t.start()
        assert self.ready.wait(5)

    def _run(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_until_complete(self.srv.start())
        self.ready.set()
        self.loop.run_forever()

    def call(self, fn, *a, **kw):
        self.loop.call_soon_threadsafe(functools.partial(fn, *a, **kw))

    def stop(self):
        asyncio.run_coroutine_threadsafe(self.srv.stop(), self.loop).result(5)
        self.loop.call_soon_threadsafe(self.loop.stop)
        self.t.join(5)


def pump(app, cond, timeout=4.0):
    end = time.time() + timeout
    while time.time() < end:
        app.processEvents()
        if cond():
            return True
        time.sleep(0.01)
    return False


def tab_index(panel, name):
    return [panel.tabs.tabText(i) for i in range(panel.tabs.count())].index(name)


@pytest.fixture
def env(app):
    d = Path(tempfile.mkdtemp(prefix="pt-", dir="/tmp"))
    be = Backend(d)
    link = AgentLink(str(d / "ui.sock"), retry_ms=100)
    panel = Panel(link)
    link.start()
    yield be, link, panel
    link.stop()
    panel.close()
    panel.deleteLater()
    link.deleteLater()
    app.processEvents()
    be.stop()
    shutil.rmtree(d, ignore_errors=True)


def test_snapshot_and_events_reach_panel(app, env):
    be, link, panel = env
    assert pump(app, lambda: panel.snap.get("provider") == "local")
    assert panel.model_lbl.text() == "modelo: bolt"
    assert panel.provider_cb.count() == 2 and panel.reasoning_cb.currentText() == "auto"
    assert panel.mcp_table.rowCount() == 1 and panel.tools_table.rowCount() == 1
    be.call(be.bus.set_state, "speaking")
    assert pump(app, lambda: panel.state_lbl.text() == "Hablando")
    assert panel.stop_btn.isEnabled()
    be.call(be.bus.publish, "resources", ram_total_mb=1000, ram_used_mb=500, gpu_total_mib=8000, gpu_used_mib=4000,
            gpu_util_pct=10, gpu_temp_c=40)
    assert pump(app, lambda: panel.bars["ram"].value() == 50 and panel.bars["gpu"].value() == 50)


def test_commands_change_agent_and_permission_banner(app, env):
    be, link, panel = env
    assert pump(app, lambda: link.is_up and panel.snap)
    panel.reasoning_cb.setCurrentText("on")
    panel._set_reasoning(0)
    assert pump(app, lambda: be.agent.reasoning.mode == "on")
    panel.provider_cb.setCurrentText("nvidia")
    panel._select_provider()
    assert pump(app, lambda: be.router.p == "nvidia" and "NUBE" in panel.cloud_lbl.text())
    be.call(be.bus.publish, "permission", phase="request", kind="desktop_control", tool="window_action", explicit=False)
    assert pump(app, lambda: not panel.banner.isHidden())
    be.call(be.bus.publish, "permission", phase="decided", allowed=False, kind="desktop_control", tool="window_action")
    assert pump(app, lambda: panel.banner.isHidden())


def test_history_tab_queries(app, env):
    be, link, panel = env
    assert pump(app, lambda: link.is_up and panel.snap)
    panel.tabs.setCurrentIndex(tab_index(panel, "Historial"))
    assert pump(app, lambda: panel.conv_list.count() == 1)
    panel.conv_list.setCurrentRow(0)
    assert pump(app, lambda: "[user] texto" in panel.msg_view.toPlainText())


def test_panel_survives_agent_going_away_and_back(app, env):
    be, link, panel = env
    assert pump(app, lambda: link.is_up)
    asyncio.run_coroutine_threadsafe(be.srv.stop(), be.loop).result(5)
    assert pump(app, lambda: panel.state_lbl.text().startswith("Sin conexión"))
    panel.stop_btn.click()  # no debe fallar sin conexion
    asyncio.run_coroutine_threadsafe(be.srv.start(), be.loop).result(5)
    assert pump(app, lambda: link.is_up and panel.snap.get("state") == "idle", 6)


def test_voice_and_vision_tab_shows_state(app, env):
    be, link, panel = env
    panel.apply_voice_vision(
        {"mode": "wake", "wake_phrase": "piantao", "stt": "large-v3-turbo/cuda", "tts": "kokoro", "headless": False,
         "confirm": {"enabled": True, "active": True, "allow_explicit": False, "allow_tainted": False}},
        {"active": True, "device": "/dev/video0", "fps": 15, "confirm_with_gestures": True, "interrupt_with_palm": False,
         "recent": [{"ts": 1700000000, "name": "thumb_up"}, {"ts": 1700000005, "name": "palm"}]})
    t = panel.voice_lbl.text()
    assert "«piantao»" in t and "large-v3-turbo/cuda" in t and "activado" in t and "acciones sensibles: no" in t
    assert "activos" in panel.vision_lbl.text() and "/dev/video0" in panel.vision_lbl.text()
    assert panel.gesture_list.count() == 2 and "palm" in panel.gesture_list.item(0).text()
    panel.on_event("gesture", {"name": "point"})
    assert "point" in panel.gesture_list.item(0).text() and panel.gesture_list.count() == 3
    panel.apply_voice_vision({}, {})
    assert "Sin datos" in panel.voice_lbl.text() and "Sin datos" in panel.vision_lbl.text()


def test_permissions_tab_only_offers_stricter_options(app, env):
    from piantao.config import load_config
    from piantao.security import PermissionManager
    be, link, panel = env
    pm = PermissionManager(load_config(), root=be.tmp)
    be.agent.tools.permissions = pm
    assert pump(app, lambda: link.is_up and panel.snap)
    panel.tabs.setCurrentIndex(tab_index(panel, "Permisos"))
    assert pump(app, lambda: panel.perm_table.rowCount() > 3)
    names = [panel.perm_table.item(r, 0).text() for r in range(panel.perm_table.rowCount())]
    row = names.index("camera_capture")
    assert not any(b.isEnabled() for b in panel.perm_btns.values())
    panel.perm_table.selectRow(row)
    app.processEvents()
    assert all(b.isEnabled() for b in panel.perm_btns.values())  # desde "automatico" se puede subir a cualquiera
    panel.perm_btns["confirm"].click()
    assert pump(app, lambda: pm.matrix() and {r["action"]: r for r in pm.matrix()}["camera_capture"]["policy"] == "confirm")
    assert pump(app, lambda: panel.perm_table.item(row, 3) is not None and panel.perm_table.item(row, 3).text() == "endurecido")
    assert panel.perm_table.currentRow() == row  # la seleccion se conserva al refrescar
    assert not panel.perm_btns["confirm"].isEnabled() and panel.perm_btns["explicit"].isEnabled()
    panel.perm_btns["never"].click()
    assert pump(app, lambda: {r["action"]: r for r in pm.matrix()}["camera_capture"]["policy"] == "never")
    assert pump(app, lambda: not any(b.isEnabled() for b in panel.perm_btns.values()) and panel.perm_table.item(row, 1).text() == "bloqueado")
    assert not any(b.isEnabled() for b in panel.perm_btns.values())  # bloqueado: ya no hay mas rigor


def test_mcp_buttons_call_pause_and_restart(app, env):
    be, link, panel = env
    calls = []

    async def pause(name):
        calls.append(("pause", name))
        return NS(name=name, state="pausado", detail="", tools=[])

    async def restart(name):
        calls.append(("restart", name))
        return NS(name=name, state="conectado", detail="", tools=[1])

    be.agent.mcp.pause, be.agent.mcp.restart = pause, restart
    assert pump(app, lambda: panel.mcp_table.rowCount() == 1)
    assert not panel.mcp_pause_btn.isEnabled()
    panel.mcp_table.selectRow(0)
    app.processEvents()
    assert panel.mcp_pause_btn.isEnabled() and panel.mcp_restart_btn.isEnabled()
    panel.mcp_pause_btn.click()
    panel.mcp_restart_btn.click()
    assert pump(app, lambda: calls == [("pause", "ddg"), ("restart", "ddg")])
    assert "approve" in panel.mcp_note.text()  # aprobar sigue siendo por terminal
