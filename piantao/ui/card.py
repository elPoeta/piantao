"""Tarjeta de permiso del HUD: dice QUE se pide y QUE hay que decir o hacer. Sin scroll: la tarjeta se agranda a su contenido,
y lo mas importante (como contestar) va arriba para que nunca quede recortado."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from PySide6.QtCore import QRectF, Qt
from PySide6.QtGui import QColor, QFont, QFontMetrics, QPainter, QPen

KIND_TEXT = {
    "desktop_control": "controlar el escritorio", "window_control": "controlar ventanas", "process_stop": "detener un proceso",
    "service_control": "controlar un servicio", "run_automation": "ejecutar una rutina", "camera_capture": "usar la cámara",
    "cloud_transfer": "enviar datos a la nube", "desktop_notify": "mostrar una notificación",
    "screen_capture": "capturar la pantalla",
}
TAG_COLORS = {"VOZ": "#22c55e", "GESTO": "#a855f7", "TECLADO": "#64748b"}
MAX_WHAT_LINES = 3


@dataclass
class Item:
    kind: str  # title | answer | what | warn
    text: str = ""
    tag: str = ""
    height: int = 0
    font_px: int = 0
    bold: bool = False
    color: str = "#e5e7eb"


@dataclass
class Card:
    width: int
    height: int
    pad: int
    items: list[Item] = field(default_factory=list)


def _font(px: int, bold: bool = False) -> QFont:
    f = QFont()
    f.setPixelSize(max(8, px))
    f.setBold(bold)
    return f


def fit_text(fm: QFontMetrics, text: str, width: int, max_lines: int) -> str:
    """Recorta con '…' para que quepa en `max_lines` lineas del ancho dado (nunca scroll)."""
    flags = int(Qt.TextFlag.TextWordWrap)
    limit = fm.lineSpacing() * max_lines + 1
    if fm.boundingRect(0, 0, width, 10_000, flags, text).height() <= limit:
        return text
    words = text.split()
    while words:
        words.pop()
        cand = " ".join(words) + "…"
        if fm.boundingRect(0, 0, width, 10_000, flags, cand).height() <= limit:
            return cand
    return "…"


def answer_rows(d: dict[str, Any]) -> list[tuple[str, str]]:
    via = [v for v in d.get("via") or []]
    rows: list[tuple[str, str]] = []
    if "voz" in via:
        phrase = d.get("voice_phrase")
        rows.append(("VOZ", f"«{phrase}»  o  «no»" if d.get("explicit") and phrase else "«sí»  o  «no»"))
    if "gestos" in via:
        rows.append(("GESTO", "pulgar arriba = sí · abajo = no"))
    if "teclado" in via:
        rows.append(("TECLADO", "escribí la frase en la terminal" if d.get("explicit") else "respondé en la terminal"))
    return rows


def card_layout(d: dict[str, Any], size_px: int) -> Card:
    pad = max(8, size_px // 8)
    width = int(size_px * 4.0)
    inner = width - 2 * pad
    u = size_px / 96.0
    items: list[Item] = []
    kind = str(d.get("kind") or "?")
    what = KIND_TEXT.get(kind, kind)
    rows = answer_rows(d)

    t = _font(int(15 * u), True)
    items.append(Item("title", "¿AUTORIZAR?" + ("  (acción sensible)" if d.get("explicit") else ""), font_px=int(15 * u),
                      bold=True, color="#fca5a5", height=QFontMetrics(t).lineSpacing()))
    if rows:
        tag_w = int(size_px * 0.95)
        for tag, text in rows:
            f = _font(int(19 * u) if tag == "VOZ" else int(13 * u), True)
            fm = QFontMetrics(f)
            w = inner - tag_w - pad
            txt = fit_text(fm, text, w, 2)
            h = max(fm.boundingRect(0, 0, w, 10_000, int(Qt.TextFlag.TextWordWrap), txt).height(), fm.lineSpacing())
            items.append(Item("answer", txt, tag, h + pad // 2, int(19 * u) if tag == "VOZ" else int(13 * u), True, "#ffffff"))
    else:
        f = _font(int(13 * u), True)
        items.append(Item("warn", "Sin canal para responder: se denegará", font_px=int(13 * u), bold=True, color="#f87171",
                          height=QFontMetrics(f).lineSpacing() + pad // 2))
    wf = _font(int(12 * u))
    wfm = QFontMetrics(wf)
    for name, reason in (d.get("blocked") or {}).items():
        if name in (d.get("via") or []) or not reason:
            continue
        txt = fit_text(wfm, f"{name.upper()} no disponible: {reason}", inner, 2)
        items.append(Item("note", txt, font_px=int(11 * u), color="#94a3b8",
                          height=wfm.boundingRect(0, 0, inner, 10_000, int(Qt.TextFlag.TextWordWrap), txt).height()))
    desc = str(d.get("description") or "").strip()
    body = f"{what[:1].upper()}{what[1:]}" + (f": {desc}" if desc else "")
    body = fit_text(wfm, body, inner, MAX_WHAT_LINES)
    items.append(Item("what", body, font_px=int(12 * u), color="#cbd5e1",
                      height=wfm.boundingRect(0, 0, inner, 10_000, int(Qt.TextFlag.TextWordWrap), body).height()))
    if d.get("tainted"):
        items.append(Item("warn", "⚠ pedida tras leer contenido externo", font_px=int(12 * u), color="#f59e0b",
                          height=wfm.lineSpacing()))
    gap = pad // 2
    height = 2 * pad + sum(i.height for i in items) + gap * (len(items) - 1)
    return Card(width, height, pad, items)


def paint_card(p: QPainter, card: Card, x: int, y: int) -> None:
    p.save()
    rect = QRectF(x + 3, y + 3, card.width - 6, card.height - 6)
    p.setPen(QPen(QColor("#ef4444"), 2))
    p.setBrush(QColor(15, 17, 21, 240))
    p.drawRoundedRect(rect, 12, 12)
    cy = y + card.pad
    tag_w = int(card.width * 0.95 / 4.0)
    for it in card.items:
        p.setFont(_font(it.font_px, it.bold))
        if it.kind == "answer":
            col = QColor(TAG_COLORS.get(it.tag, "#64748b"))
            tag_rect = QRectF(x + card.pad, cy, tag_w, min(it.height, QFontMetrics(p.font()).lineSpacing()))
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(col)
            p.drawRoundedRect(tag_rect, 5, 5)
            p.setPen(QColor("#0b0d10"))
            p.setFont(_font(max(8, int(it.font_px * 0.62)), True))
            p.drawText(tag_rect, int(Qt.AlignmentFlag.AlignCenter), it.tag)
            p.setFont(_font(it.font_px, it.bold))
            p.setPen(QColor(it.color))
            p.drawText(QRectF(x + card.pad * 2 + tag_w, cy, card.width - tag_w - card.pad * 3, it.height + 4),
                       int(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignTop | Qt.TextFlag.TextWordWrap), it.text)
        else:
            p.setPen(QColor(it.color))
            p.drawText(QRectF(x + card.pad, cy, card.width - 2 * card.pad, it.height + 4),
                       int(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignTop | Qt.TextFlag.TextWordWrap), it.text)
        cy += it.height + card.pad // 2
    p.restore()
