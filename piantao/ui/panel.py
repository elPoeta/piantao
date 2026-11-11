"""Ventana principal del panel. Solo muestra estado y manda los comandos permitidos por el servidor local."""

from __future__ import annotations

import json
import time
from typing import Any

from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QColor, QPainter
from PySide6.QtWidgets import (QComboBox, QFrame, QGridLayout, QHBoxLayout, QLabel, QListWidget, QMainWindow,
                               QPlainTextEdit, QProgressBar, QPushButton, QSplitter, QTableWidget,
                               QTableWidgetItem, QTabWidget, QVBoxLayout, QWidget)

from .card import KIND_TEXT
from .link import AgentLink

STATE_COLORS = {
    "idle": "#6b7280", "listening": "#22c55e", "transcribing": "#06b6d4", "thinking": "#a855f7",
    "tool": "#f59e0b", "speaking": "#3b82f6", "confirming": "#ef4444", "stopped": "#374151", "offline": "#374151",
}
STATE_LABELS = {
    "idle": "En espera", "listening": "Escuchando", "transcribing": "Transcribiendo", "thinking": "Pensando",
    "tool": "Usando herramienta", "speaking": "Hablando", "confirming": "Esperando confirmación",
    "stopped": "Detenido", "offline": "Sin conexión con Piantao",
}
REASONING = ("auto", "on", "off", "server")

STYLE = """
QWidget { background: #14161a; color: #e5e7eb; font-size: 13px; }
QTabWidget::pane { border: 1px solid #2a2d34; }
QTabBar::tab { padding: 7px 14px; background: #1b1e24; border: 1px solid #2a2d34; border-bottom: none; }
QTabBar::tab:selected { background: #23272f; }
QPushButton { background: #23272f; border: 1px solid #343944; padding: 5px 12px; border-radius: 4px; }
QPushButton:hover { background: #2d323c; }
QPushButton:disabled { color: #6b7280; }
QComboBox, QPlainTextEdit, QListWidget, QTableWidget { background: #1b1e24; border: 1px solid #2a2d34; }
QProgressBar { border: 1px solid #2a2d34; border-radius: 3px; text-align: center; background: #1b1e24; }
QProgressBar::chunk { background: #3b82f6; }
QHeaderView::section { background: #23272f; border: 0; padding: 4px; }
"""


class StateDot(QWidget):
    def __init__(self) -> None:
        super().__init__()
        self.color = QColor(STATE_COLORS["offline"])
        self.setFixedSize(22, 22)

    def set_color(self, hexcolor: str) -> None:
        self.color = QColor(hexcolor)
        self.update()

    def paintEvent(self, _e: Any) -> None:
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.setBrush(self.color)
        p.setPen(Qt.PenStyle.NoPen)
        p.drawEllipse(2, 2, 18, 18)


VIA_TEXT = {"voz": "decí «sí» o «no»", "gestos": "👍 autorizar / 👎 cancelar", "teclado": "tecleá en la terminal"}
def permission_lines(d: dict[str, Any]) -> list[str]:
    """Texto corto para la tarjeta del HUD y el aviso del panel: que se pide y por donde se puede contestar."""
    kind = str(d.get("kind") or "?")
    lines = [f"Permiso: {KIND_TEXT.get(kind, kind)}"]
    if d.get("description"):
        lines.append(str(d["description"]))
    if d.get("explicit"):
        lines.append("Acción sensible: requiere confirmación explícita")
    if d.get("tainted"):
        lines.append("⚠ pedida tras leer contenido externo")
    via = [v for v in d.get("via") or [] if v in VIA_TEXT]
    lines.append(" · ".join(VIA_TEXT[v] for v in via) if via else "Sin canal para responder: se denegará")
    return lines


def _fmt_ts(ts: Any) -> str:
    try:
        return time.strftime("%d/%m %H:%M:%S", time.localtime(float(ts)))
    except (TypeError, ValueError):
        return str(ts or "")


def _fill_table(table: QTableWidget, columns: list[str], rows: list[list[Any]]) -> None:
    table.clear()
    table.setColumnCount(len(columns))
    table.setHorizontalHeaderLabels(columns)
    table.setRowCount(len(rows))
    for i, row in enumerate(rows):
        for j, v in enumerate(row):
            item = QTableWidgetItem("" if v is None else str(v))
            item.setFlags(item.flags() & ~Qt.ItemFlag.ItemIsEditable)
            table.setItem(i, j, item)
    table.resizeColumnsToContents()
    table.horizontalHeader().setStretchLastSection(True)


def _table() -> QTableWidget:
    t = QTableWidget()
    t.verticalHeader().setVisible(False)
    t.setSelectionBehavior(QTableWidget.SelectionBehavior.SelectRows)
    return t


class Panel(QMainWindow):
    def __init__(self, link: AgentLink):
        super().__init__()
        self.link = link
        self.snap: dict[str, Any] = {}
        self.setWindowTitle("Piantao")
        self.resize(940, 640)
        self.setStyleSheet(STYLE)
        self._log_lines: list[str] = []
        self._build()
        link.connected.connect(self._on_connected)
        link.disconnected.connect(self._on_disconnected)
        link.snapshot.connect(self.apply_snapshot)
        link.event.connect(self.on_event)
        self.set_state("offline")

    # ------------------------------------------------------------------ construccion

    def _build(self) -> None:
        root = QWidget()
        self.setCentralWidget(root)
        v = QVBoxLayout(root)
        head = QHBoxLayout()
        self.dot = StateDot()
        self.state_lbl = QLabel()
        self.state_lbl.setStyleSheet("font-size: 18px; font-weight: 600;")
        self.stop_btn = QPushButton("Interrumpir")
        self.stop_btn.clicked.connect(lambda: self.link.command("interrupt"))
        head.addWidget(self.dot)
        head.addWidget(self.state_lbl)
        head.addStretch(1)
        self.info_lbl = QLabel()
        head.addWidget(self.info_lbl)
        head.addWidget(self.stop_btn)
        v.addLayout(head)
        self.tabs = QTabWidget()
        v.addWidget(self.tabs, 1)
        self.tabs.addTab(self._tab_status(), "Estado")
        self.tabs.addTab(self._tab_voice_vision(), "Voz y visión")
        self.tabs.addTab(self._tab_history(), "Historial")
        self.tabs.addTab(self._tab_memory(), "Memoria")
        self.tabs.addTab(self._tab_tools(), "Herramientas")
        self.tabs.addTab(self._tab_permissions(), "Permisos")
        self.tabs.addTab(self._tab_audit(), "Seguridad")
        self.tabs.currentChanged.connect(self._tab_changed)
        self.banner = QLabel()
        self.banner.setWordWrap(True)
        self.banner.setVisible(False)
        self.banner.setStyleSheet("background:#7f1d1d; padding:8px; border-radius:4px;")
        v.addWidget(self.banner)

    def _tab_status(self) -> QWidget:
        w = QWidget()
        g = QGridLayout(w)
        g.addWidget(QLabel("Proveedor"), 0, 0)
        self.provider_cb = QComboBox()
        g.addWidget(self.provider_cb, 0, 1)
        self.apply_provider = QPushButton("Cambiar")
        self.apply_provider.clicked.connect(self._select_provider)
        g.addWidget(self.apply_provider, 0, 2)
        self.model_lbl = QLabel("-")
        g.addWidget(self.model_lbl, 0, 3)
        g.addWidget(QLabel("Razonamiento"), 1, 0)
        self.reasoning_cb = QComboBox()
        self.reasoning_cb.addItems(REASONING)
        self.reasoning_cb.activated.connect(self._set_reasoning)
        g.addWidget(self.reasoning_cb, 1, 1)
        self.cloud_lbl = QLabel()
        g.addWidget(self.cloud_lbl, 1, 3)
        self.bars: dict[str, QProgressBar] = {}
        for i, (key, text) in enumerate((("ram", "RAM"), ("gpu", "VRAM"), ("util", "GPU %"))):
            g.addWidget(QLabel(text), 2 + i, 0)
            bar = QProgressBar()
            bar.setRange(0, 100)
            self.bars[key] = bar
            g.addWidget(bar, 2 + i, 1, 1, 3)
        self.misc_lbl = QLabel()
        g.addWidget(self.misc_lbl, 5, 0, 1, 4)
        self.last_turn = QLabel("Sin turnos todavía")
        g.addWidget(self.last_turn, 6, 0, 1, 4)
        self.log = QPlainTextEdit()
        self.log.setReadOnly(True)
        self.log.setMaximumBlockCount(300)
        g.addWidget(self.log, 7, 0, 1, 4)
        g.setRowStretch(7, 1)
        return w

    def _tab_voice_vision(self) -> QWidget:
        w = QWidget()
        g = QGridLayout(w)
        self.voice_lbl = QLabel("-")
        self.voice_lbl.setWordWrap(True)
        self.vision_lbl = QLabel("-")
        self.vision_lbl.setWordWrap(True)
        g.addWidget(QLabel("<b>Voz</b>"), 0, 0)
        g.addWidget(self.voice_lbl, 1, 0, 1, 2)
        btns = QHBoxLayout()
        self.talk_btn = QPushButton("Hablar ahora")
        self.talk_btn.clicked.connect(lambda: self.link.command("talk", self._cmd_done))
        self.talk_btn.setToolTip("Equivale al atajo: escucha ya, o interrumpe si está respondiendo")
        btns.addWidget(self.talk_btn)
        btns.addStretch(1)
        g.addLayout(btns, 2, 0, 1, 2)
        g.addWidget(QLabel("<b>Visión y gestos</b>"), 3, 0)
        g.addWidget(self.vision_lbl, 4, 0, 1, 2)
        g.addWidget(QLabel("Últimos gestos"), 5, 0)
        self.gesture_list = QListWidget()
        g.addWidget(self.gesture_list, 6, 0, 1, 2)
        g.setRowStretch(6, 1)
        return w

    def _tab_permissions(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        note = QLabel("Desde aquí solo se puede ENDURECER un permiso, y solo hasta que se cierre Piantao. "
                      "Para aflojar uno, edita config/permissions.yaml.")
        note.setWordWrap(True)
        note.setStyleSheet("color:#94a3b8;")
        v.addWidget(note)
        self.perm_table = _table()
        self.perm_table.itemSelectionChanged.connect(self._perm_selection)
        v.addWidget(self.perm_table, 1)
        row = QHBoxLayout()
        self.perm_btns: dict[str, QPushButton] = {}
        for key, text, level in (("confirm", "Pedir confirmación", 3), ("explicit", "Confirmación explícita", 4),
                                 ("never", "Bloquear", "never")):
            b = QPushButton(text)
            b.setEnabled(False)
            b.clicked.connect(lambda _=False, lv=level: self._tighten(lv))
            self.perm_btns[key] = b
            row.addWidget(b)
        row.addStretch(1)
        v.addLayout(row)
        self._perm_rows: list[dict[str, Any]] = []
        return w

    def _tab_history(self) -> QWidget:
        sp = QSplitter()
        self.conv_list = QListWidget()
        self.conv_list.currentRowChanged.connect(self._load_messages)
        self.msg_view = QPlainTextEdit()
        self.msg_view.setReadOnly(True)
        sp.addWidget(self.conv_list)
        sp.addWidget(self.msg_view)
        sp.setSizes([280, 600])
        self._convs: list[dict[str, Any]] = []
        return sp

    def _tab_memory(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        self.mem_table = _table()
        v.addWidget(self.mem_table, 1)
        self.prefs_view = QPlainTextEdit()
        self.prefs_view.setReadOnly(True)
        self.prefs_view.setMaximumHeight(110)
        v.addWidget(QLabel("Preferencias"))
        v.addWidget(self.prefs_view)
        return w

    def _tab_tools(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        v.addWidget(QLabel("Servidores MCP"))
        self.mcp_table = _table()
        self.mcp_table.setMaximumHeight(150)
        v.addWidget(self.mcp_table)
        row = QHBoxLayout()
        self.mcp_restart_btn = QPushButton("Reiniciar")
        self.mcp_pause_btn = QPushButton("Pausar")
        self.mcp_restart_btn.clicked.connect(lambda: self._mcp_cmd("mcp_restart"))
        self.mcp_pause_btn.clicked.connect(lambda: self._mcp_cmd("mcp_pause"))
        self.mcp_note = QLabel("Aprobar un servidor nuevo o con herramientas cambiadas se hace solo desde la terminal: "
                               "python main.py mcp approve <nombre>")
        self.mcp_note.setStyleSheet("color:#94a3b8;")
        self.mcp_note.setWordWrap(True)
        row.addWidget(self.mcp_restart_btn)
        row.addWidget(self.mcp_pause_btn)
        row.addWidget(self.mcp_note, 1)
        v.addLayout(row)
        self.mcp_table.itemSelectionChanged.connect(self._mcp_selection)
        v.addWidget(QLabel("Herramientas registradas"))
        self.tools_table = _table()
        v.addWidget(self.tools_table, 1)
        v.addWidget(QLabel("Últimas ejecuciones"))
        self.hist_table = _table()
        v.addWidget(self.hist_table, 1)
        return w

    def _tab_audit(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        b = QPushButton("Actualizar")
        b.clicked.connect(self.refresh_audit)
        v.addWidget(b, 0, Qt.AlignmentFlag.AlignLeft)
        self.audit_table = _table()
        v.addWidget(self.audit_table, 1)
        return w

    # ------------------------------------------------------------------ conexion

    def _on_connected(self) -> None:
        self.banner.setVisible(False)
        self.link.command("get_snapshot", lambda ok, d: ok and self.apply_snapshot(d))
        self._tab_changed(self.tabs.currentIndex())

    def _on_disconnected(self) -> None:
        self.set_state("offline")
        self.info_lbl.setText("")

    def set_state(self, state: str) -> None:
        self.dot.set_color(STATE_COLORS.get(state, STATE_COLORS["idle"]))
        self.state_lbl.setText(STATE_LABELS.get(state, state))
        self.stop_btn.setEnabled(state in ("listening", "transcribing", "thinking", "tool", "speaking"))

    def apply_snapshot(self, s: dict[str, Any]) -> None:
        self.snap = s
        self.set_state(s.get("state", "idle"))
        self.info_lbl.setText(f"modo {s.get('mode', '?')} · activo hace {int(s.get('uptime_s', 0))} s")
        provs = s.get("providers") or []
        self.provider_cb.blockSignals(True)
        self.provider_cb.clear()
        self.provider_cb.addItems(provs)
        if s.get("provider") in provs:
            self.provider_cb.setCurrentText(s["provider"])
        self.provider_cb.blockSignals(False)
        self.model_lbl.setText(f"modelo: {s.get('model', '-')}")
        self._show_cloud(bool(s.get("cloud")))
        if s.get("reasoning") in REASONING:
            self.reasoning_cb.setCurrentText(s["reasoning"])
        self.reasoning_cb.setEnabled(s.get("reasoning") is not None)
        self.misc_lbl.setText(
            f"Gestos: {'activos' if s.get('gestures_active') else 'inactivos'} · "
            f"Memoria: {'sí' if s.get('memory') else 'deshabilitada'} · Incógnito: {'sí' if s.get('incognito') else 'no'}")
        self.apply_resources(s.get("resources") or {})
        self.apply_voice_vision(s.get("voice") or {}, s.get("vision") or {})
        sel = self._selected_mcp()
        _fill_table(self.mcp_table, ["Servidor", "Estado", "Herramientas", "Detalle"],
                    [[m["name"], m["state"], m["tools"], m.get("detail")] for m in s.get("mcp", [])])
        if sel:
            for r in range(self.mcp_table.rowCount()):
                if self.mcp_table.item(r, 0).text() == sel:
                    self.mcp_table.selectRow(r)
        self._mcp_selection()
        _fill_table(self.tools_table, ["Herramienta", "Origen", "Permiso", "Salida no confiable"],
                    [[t["name"], t["source"], t["action"], "sí" if t["untrusted"] else "no"] for t in s.get("tools", [])])

    def _show_cloud(self, cloud: bool) -> None:
        self.cloud_lbl.setText("☁ NUBE: cada envío pide tu autorización" if cloud else "Local: nada sale de tu equipo")
        self.cloud_lbl.setStyleSheet("color:#f59e0b;" if cloud else "color:#22c55e;")

    def apply_resources(self, r: dict[str, Any]) -> None:
        if r.get("ram_total_mb"):
            self.bars["ram"].setValue(int(100 * r.get("ram_used_mb", 0) / r["ram_total_mb"]))
            self.bars["ram"].setFormat(f"{r.get('ram_used_mb', 0)} / {r['ram_total_mb']} MB")
        if r.get("gpu_total_mib"):
            self.bars["gpu"].setValue(int(100 * r.get("gpu_used_mib", 0) / r["gpu_total_mib"]))
            self.bars["gpu"].setFormat(f"{r.get('gpu_used_mib', 0):.0f} / {r['gpu_total_mib']:.0f} MiB · {r.get('gpu_temp_c', 0):.0f} °C")
            self.bars["util"].setValue(int(r.get("gpu_util_pct", 0)))
        self.bars["gpu"].setVisible(bool(r.get("gpu_total_mib")))
        self.bars["util"].setVisible(bool(r.get("gpu_total_mib")))

    def apply_voice_vision(self, v: dict[str, Any], vis: dict[str, Any]) -> None:
        yn = lambda b: "sí" if b else "no"  # noqa: E731
        if v:
            c = v.get("confirm") or {}
            mode = {"wake": f"palabra de activación «{v.get('wake_phrase')}»", "ptt": "pulsar para hablar",
                    "always": "siempre escuchando"}.get(v.get("mode"), str(v.get("mode")))
            self.voice_lbl.setText(
                f"Modo: {mode}{' (servicio)' if v.get('headless') else ''}\nReconocimiento: {v.get('stt')} · Voz: {v.get('tts')}\n"
                f"Confirmar permisos por voz: {'activado' if c.get('active') else 'desactivado'}"
                f"{' · acciones sensibles: ' + yn(c.get('allow_explicit')) if c.get('enabled') else ''}"
                f"{' · tras contenido externo: ' + yn(c.get('allow_tainted')) if c.get('enabled') else ''}")
        else:
            self.voice_lbl.setText("Sin datos de voz (¿Piantao corre en modo chat?)")
        if vis:
            self.vision_lbl.setText(
                f"Gestos: {'activos' if vis.get('active') else 'inactivos'} · cámara {vis.get('device') or '-'} a {vis.get('fps') or '-'} fps\n"
                f"Confirmar con gestos: {yn(vis.get('confirm_with_gestures'))} · palma abierta interrumpe: {yn(vis.get('interrupt_with_palm'))}")
            self.gesture_list.clear()
            for g in reversed(vis.get("recent") or []):
                self.gesture_list.addItem(f"{_fmt_ts(g.get('ts'))}  {g.get('name')}")
        else:
            self.vision_lbl.setText("Sin datos de visión")

    # -- MCP ---------------------------------------------------------------------------------------------------------
    def _selected_mcp(self) -> str | None:
        rows = self.mcp_table.selectionModel().selectedRows() if self.mcp_table.selectionModel() else []
        return self.mcp_table.item(rows[0].row(), 0).text() if rows and self.mcp_table.item(rows[0].row(), 0) else None

    def _mcp_selection(self) -> None:
        on = self._selected_mcp() is not None and self.link.is_up
        self.mcp_restart_btn.setEnabled(on)
        self.mcp_pause_btn.setEnabled(on)

    def _mcp_cmd(self, name: str) -> None:
        server = self._selected_mcp()
        if server:
            self.link.command(name, self._mcp_done, server=server)

    def _mcp_done(self, ok: bool, data: Any) -> None:
        self._log(f"MCP: {data['name']} → {data['state']}" if ok else f"error MCP: {data}")
        if self.link.is_up:
            self.link.command("get_snapshot", lambda k, d: k and self.apply_snapshot(d))

    # -- permisos ----------------------------------------------------------------------------------------------------
    def _got_perms(self, ok: bool, data: Any) -> None:
        if not ok:
            _fill_table(self.perm_table, ["Error"], [[data]])
            return
        rows_sel = self.perm_table.selectionModel().selectedRows() if self.perm_table.selectionModel() else []
        keep = self._perm_rows[rows_sel[0].row()]["action"] if rows_sel and rows_sel[0].row() < len(self._perm_rows) else None
        self._perm_rows = data
        names = {"auto": "automático", "confirm": "confirmación", "confirm_explicit": "confirmación explícita", "never": "bloqueado"}
        _fill_table(self.perm_table, ["Acción", "Política", "Nivel", "Esta sesión"],
                    [[r["action"], names.get(r["policy"], r["policy"]), r["level"], "endurecido" if r["tightened"] else ""]
                     for r in data])
        if keep:
            for i, r in enumerate(data):
                if r["action"] == keep:
                    self.perm_table.selectRow(i)
        self._perm_selection()

    def _perm_selection(self) -> None:
        rows = self.perm_table.selectionModel().selectedRows() if self.perm_table.selectionModel() else []
        policy = self._perm_rows[rows[0].row()]["policy"] if rows and rows[0].row() < len(self._perm_rows) else None
        order = {"auto": 0, "confirm": 1, "confirm_explicit": 2, "never": 3}
        cur = order.get(policy, 99)
        for key, need in (("confirm", 1), ("explicit", 2), ("never", 3)):
            self.perm_btns[key].setEnabled(policy is not None and cur < need and self.link.is_up)

    def _tighten(self, level: Any) -> None:
        rows = self.perm_table.selectionModel().selectedRows()
        if rows:
            self.link.command("tighten_permission", self._tightened, action=self._perm_rows[rows[0].row()]["action"], level=level)

    def _tightened(self, ok: bool, data: Any) -> None:
        if ok:
            self._log("permiso endurecido (solo en esta sesión)")
            self._got_perms(True, data)
        else:
            self._log(f"no se pudo endurecer: {data}")

    # ------------------------------------------------------------------ eventos

    def _log(self, text: str) -> None:
        self.log.appendPlainText(f"{time.strftime('%H:%M:%S')}  {text}")

    def on_event(self, kind: str, data: dict[str, Any]) -> None:
        if kind == "state":
            self.set_state(data.get("state", "idle"))
            if data.get("state") not in ("idle",):
                self._log(f"estado: {data.get('state')}")
        elif kind == "resources":
            self.apply_resources(data)
        elif kind == "settings":
            if data.get("permissions") and self.tabs.tabText(self.tabs.currentIndex()) == "Permisos":
                self.link.command("get_permissions", self._got_perms)
            if "reasoning" in data:
                self.reasoning_cb.setCurrentText(str(data["reasoning"]))
            if "provider" in data:
                self.provider_cb.setCurrentText(str(data["provider"]))
                self.model_lbl.setText(f"modelo: {data.get('model', '-')}")
                self._show_cloud(bool(data.get("cloud")))
            self._log(f"ajustes: {json.dumps(data, ensure_ascii=False)}")
        elif kind == "turn":
            parts = [f"{k}={data[k]}" for k in ("total_s", "first_text_s", "first_audio_s", "stt_s") if k in data]
            self.last_turn.setText("Último turno: " + " · ".join(parts))
            self._log("turno completado")
        elif kind == "permission":
            self._permission(data)
        elif kind == "gesture":
            self._log(f"gesto: {data.get('name')}")
            self.gesture_list.insertItem(0, f"{_fmt_ts(time.time())}  {data.get('name')}")
            while self.gesture_list.count() > 8:
                self.gesture_list.takeItem(self.gesture_list.count() - 1)

    def _permission(self, d: dict[str, Any]) -> None:
        if d.get("phase") == "request":
            self.banner.setText("Confirmación pendiente\n" + "\n".join(permission_lines(d)))
            self.banner.setVisible(True)
            self._log(f"permiso solicitado: {d.get('kind')}")
        else:
            self.banner.setVisible(False)
            self._log(f"permiso {'concedido' if d.get('allowed') else 'denegado'}: {d.get('kind')}")

    # ------------------------------------------------------------------ comandos

    def _select_provider(self) -> None:
        name = self.provider_cb.currentText()
        if name:
            self.link.command("select_model", self._cmd_done, provider=name)

    def _set_reasoning(self, _i: int) -> None:
        self.link.command("set_reasoning", self._cmd_done, mode=self.reasoning_cb.currentText())

    def _cmd_done(self, ok: bool, data: Any) -> None:
        if not ok:
            self._log(f"error: {data}")
            if self.link.is_up:
                self.link.command("get_snapshot", lambda k, d: k and self.apply_snapshot(d))
        elif isinstance(data, dict):
            self.model_lbl.setText(f"modelo: {data.get('model', '-')}")
            self._show_cloud(bool(data.get("cloud")))

    # ------------------------------------------------------------------ consultas

    def _tab_changed(self, i: int) -> None:
        if not self.link.is_up:
            return
        name = self.tabs.tabText(i)
        if name == "Historial":
            self.link.command("query", self._got_convs, kind="conversations")
        elif name == "Memoria":
            self.link.command("query", self._got_memories, kind="memories")
            self.link.command("query", lambda ok, d: self.prefs_view.setPlainText(
                json.dumps(d, ensure_ascii=False, indent=2) if ok else str(d)), kind="preferences")
        elif name == "Herramientas":
            self.link.command("query", self._got_tool_hist, kind="tool_history")
        elif name == "Permisos":
            self.link.command("get_permissions", self._got_perms)
        elif name == "Voz y visión":
            self.link.command("get_snapshot", lambda ok, d: ok and self.apply_snapshot(d))
        elif name == "Seguridad":
            self.refresh_audit()

    def _got_convs(self, ok: bool, data: Any) -> None:
        self.conv_list.clear()
        if not ok:
            self.msg_view.setPlainText(str(data))
            return
        self._convs = data
        for c in data:
            self.conv_list.addItem(f"{_fmt_ts(c.get('started_at'))} · {c.get('title') or 'sin título'} ({c.get('messages', 0)})")

    def _load_messages(self, row: int) -> None:
        if 0 <= row < len(self._convs):
            self.link.command("query", self._got_messages, kind="messages", conversation_id=int(self._convs[row]["id"]))

    def _got_messages(self, ok: bool, data: Any) -> None:
        if not ok:
            self.msg_view.setPlainText(str(data))
            return
        self.msg_view.setPlainText("\n\n".join(f"[{m.get('role')}] {m.get('content') or ''}" for m in data))

    def _got_memories(self, ok: bool, data: Any) -> None:
        if not ok:
            _fill_table(self.mem_table, ["Error"], [[data]])
            return
        _fill_table(self.mem_table, ["Tipo", "Contenido", "Origen", "Creada", "Vence"],
                    [[m.get("kind"), m.get("content"), m.get("source"), m.get("created_at"), m.get("expires_at")] for m in data])

    def _got_tool_hist(self, ok: bool, data: Any) -> None:
        if not ok:
            _fill_table(self.hist_table, ["Error"], [[data]])
            return
        cols = list(data[0].keys())[:6] if data else ["(vacío)"]
        _fill_table(self.hist_table, cols, [[r.get(c) for c in cols] for r in data])

    def refresh_audit(self) -> None:
        self.link.command("query", self._got_audit, kind="audit", n=60)

    def _got_audit(self, ok: bool, data: Any) -> None:
        if not ok:
            _fill_table(self.audit_table, ["Error"], [[data]])
            return
        rows = []
        for e in reversed(data):
            extra = {k: v for k, v in e.items() if k not in ("seq", "ts", "event", "prev", "hash")}
            rows.append([e.get("seq"), e.get("ts"), e.get("event"), json.dumps(extra, ensure_ascii=False)[:200]])
        _fill_table(self.audit_table, ["#", "Hora", "Evento", "Datos"], rows)


def run_panel(path: str | None = None) -> int:
    import os
    import sys

    from PySide6.QtWidgets import QApplication

    from piantao.ipc.server import default_socket_path

    app = QApplication.instance() or QApplication(sys.argv[:1])
    link = AgentLink(str(path or default_socket_path()))
    win = Panel(link)
    link.start()
    win.show()
    if os.environ.get("QT_QPA_PLATFORM") == "offscreen":
        QTimer.singleShot(0, app.quit)
    return app.exec()
