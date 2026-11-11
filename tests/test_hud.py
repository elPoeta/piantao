import os

import pytest

pytest.importorskip("PySide6")
os.environ.setdefault("QT_QPA_PLATFORM", "offscreen")

from PySide6.QtCore import Qt  # noqa: E402
from PySide6.QtWidgets import QApplication  # noqa: E402

from piantao.ui.hud import Hud  # noqa: E402
from piantao.ui.link import AgentLink  # noqa: E402


@pytest.fixture(scope="module")
def app():
    return QApplication.instance() or QApplication([])


def make(cfg=None):
    link = AgentLink("/tmp/inexistente-hud.sock")
    return link, Hud(link, cfg)


def test_flags_and_states(app):
    link, h = make()
    f = h.windowFlags()
    assert f & Qt.WindowType.WindowTransparentForInput and f & Qt.WindowType.WindowStaysOnTopHint
    assert f & Qt.WindowType.FramelessWindowHint and f & Qt.WindowType.WindowDoesNotAcceptFocus
    h.on_event("state", {"state": "thinking"})
    assert h.state == "thinking" and h.timer.isActive()
    h.on_event("state", {"state": "idle"})
    assert not h.timer.isActive()
    link.disconnected.emit()
    assert h.state == "offline"
    h.on_event("gesture", {"name": "x"})  # ignorado
    assert h.state == "offline"
    h.close()


def test_hide_when_idle_and_no_click_through(app):
    link, h = make({"hide_when_idle": True, "click_through": False, "always_on_top": False})
    assert not h.windowFlags() & Qt.WindowType.WindowTransparentForInput
    assert not h.windowFlags() & Qt.WindowType.WindowStaysOnTopHint
    h.set_state("speaking")
    assert h.isVisible()
    h.set_state("idle")
    assert not h.isVisible()
    h.close()


def test_every_state_paints(app):
    link, h = make({"size": 120})
    h.show()
    for st in ("offline", "idle", "listening", "transcribing", "thinking", "tool", "speaking", "confirming", "stopped", "raro"):
        h.set_state(st)
        h._tick()
        img = h.grab().toImage()
        assert img.width() == 120
        if st not in ("offline",):
            assert any(img.pixelColor(x, 60).alpha() for x in range(120))
    h.close()


def test_corner_placement(app):
    link, h = make({"corner": "top-left", "margin": 10})
    g = QApplication.primaryScreen().availableGeometry()
    assert (h.x(), h.y()) == (g.left() + 10, g.top() + 10)
    h.close()
    link, h = make({"corner": "bottom-right", "margin": 10, "size": 100})
    assert (h.x(), h.y()) == (g.right() - 100 - 10 + 1, g.bottom() - 100 - 10 + 1)
    h.close()


EV = {"phase": "request", "kind": "desktop_control", "tool": "window_action", "explicit": False, "tainted": True,
      "description": "cerrar la ventana de Firefox", "via": ["teclado", "gestos", "voz"]}


def test_permission_card_expands_reverts_and_keeps_corner(app):
    link, h = make({"size": 100, "corner": "bottom-right", "margin": 10})
    h.show()
    h.on_event("permission", EV)
    assert h.card and h.width() == 100 + h.card.width and h.height() >= 100
    g = QApplication.primaryScreen().availableGeometry()
    assert h.x() + h.width() - 1 == g.right() - 10 and h.y() + h.height() - 1 == g.bottom() - 10  # esquina fija al crecer
    img = h.grab().toImage()
    assert (img.width(), img.height()) == (h.width(), h.height())
    green = [(x, y) for x in range(img.width()) for y in range(0, img.height(), 2)
             if (c := img.pixelColor(x, y)).green() > 150 and c.red() < 90 and c.blue() < 120 and c.alpha() > 200]
    assert green  # la etiqueta VOZ se dibuja
    h.on_event("permission", {**EV, "phase": "decided", "allowed": True})
    assert h.card is None and (h.width(), h.height()) == (100, 100)
    h.close()


def test_card_content_priorities_and_no_clipping(app):
    from piantao.ui.card import MAX_WHAT_LINES, card_layout
    c = card_layout(EV, 100)
    kinds = [i.kind for i in c.items]
    assert kinds[0] == "title" and kinds.count("answer") == 3 and kinds.index("what") > kinds.index("answer")  # primero COMO contestar
    texts = " ".join(i.text for i in c.items)
    assert "«sí»" in texts and "«no»" in texts and "pulgar arriba" in texts and "terminal" in texts
    assert "Controlar el escritorio" in texts and "contenido externo" in texts
    long_ev = {**EV, "description": "palabra " * 80, "explicit": True, "voice_phrase": "confirmo la accion", "via": ["voz", "teclado"]}
    c2 = card_layout(long_ev, 100)
    what = [i for i in c2.items if i.kind == "what"][0]
    assert what.text.endswith("…") and len(what.text) < 200  # recortada con puntos suspensivos, nunca scroll
    assert any("confirmo la accion" in i.text for i in c2.items if i.kind == "answer")
    assert any(i.kind == "title" and "sensible" in i.text for i in c2.items)
    assert c2.height < 400 and c2.height > c.height - 60
    # sin ningun canal: lo dice, nada de silencio
    c3 = card_layout({**EV, "via": []}, 100)
    assert any("Sin canal" in i.text for i in c3.items)
    # escala con el tamano del HUD
    assert card_layout(EV, 200).height > c.height


def test_card_explains_unavailable_channels(app):
    from piantao.ui.card import card_layout
    ev = {**EV, "tainted": True, "via": ["teclado"],
          "blocked": {"voz": "pedida tras leer contenido externo (confirm.allow_tainted)", "gestos": "desactivados (arranca con --gestures)"}}
    c = card_layout(ev, 100)
    notes = [i.text for i in c.items if i.kind == "note"]
    assert len(notes) == 2 and notes[0].startswith("VOZ no disponible") and "allow_tainted" in notes[0]
    assert notes[1].startswith("GESTOS no disponible") and "--gestures" in notes[1]
    assert [i.kind for i in c.items].index("note") > [i.kind for i in c.items].index("answer")
    # un canal disponible no se lista como bloqueado
    ok = card_layout({**ev, "via": ["teclado", "voz"]}, 100)
    assert [i.text for i in ok.items if i.kind == "note"][0].startswith("GESTOS")
    assert card_layout(ev, 100).height > card_layout({**ev, "blocked": {}}, 100).height


def test_long_card_renders_fully_inside_widget(app):
    link, h = make({"size": 96, "corner": "top-left", "margin": 5})
    h.show()
    h.on_event("permission", {**EV, "description": "x " * 300, "explicit": True, "voice_phrase": "confirmo la accion"})
    img = h.grab().toImage()
    # el borde rojo de la tarjeta esta dentro del widget: arriba y abajo
    col = img.width() - 96 - 20  # una columna dentro de la tarjeta (el circulo queda a la izquierda... en top-left)
    def red_rows(x):
        return [y for y in range(img.height()) if (c := img.pixelColor(x, y)).red() > 200 and c.green() < 110 and c.alpha() > 200]
    ys = red_rows(img.width() // 2 + 40)
    assert ys and min(ys) <= 6 and max(ys) >= img.height() - 7
    h.close()


def test_permission_card_shows_hidden_hud_and_hides_again(app):
    link, h = make({"hide_when_idle": True, "size": 100})
    h.set_state("idle")
    assert not h.isVisible()
    h.on_event("permission", {"phase": "request", "kind": "x", "via": ["teclado"]})
    assert h.isVisible()
    h.on_event("permission", {"phase": "decided", "allowed": False, "kind": "x"})
    assert not h.isVisible()
    h.close()


def test_panel_banner_text(app):
    from piantao.ui.panel import permission_lines
    lines = permission_lines(EV)
    assert "controlar el escritorio" in lines[0] and "cerrar la ventana de Firefox" in lines
    assert any("contenido externo" in l for l in lines) and "denegará" in permission_lines({**EV, "via": []})[-1]
