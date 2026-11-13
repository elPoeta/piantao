"""Tablero holografico: tarjetas que Piantao (o vos) ponen en el espacio de la pantalla.

Todo lo que muestra el modelo es contenido NO CONFIABLE: texto plano (nunca HTML), tamanos acotados e imagenes solo de la
carpeta `media/` (sin subcarpetas, sin SVG, sin enlaces simbolicos fuera). La interfaz marca cada tarjeta con su origen.
Las herramientas son de solo visualizacion (nivel 1): no leen ni escriben nada en tu equipo, salvo servir la imagen pedida.
"""

from __future__ import annotations

import logging
import re
import secrets
import time
from pathlib import Path
from typing import Any, Callable

from ..tools.base import Tool, ToolError

log = logging.getLogger("piantao.web.board")
MAX_CARDS = 24
MAX_TITLE = 80
MAX_TEXT = 20000
MAX_IMAGE_BYTES = 8 * 1024 * 1024
IMAGE_EXT = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif"}
_NAME_OK = re.compile(r"^[\w][\w .-]{0,100}$")
_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def clean_text(value: Any, limit: int, what: str, required: bool = False) -> str:
    if value is None or value == "":
        if required:
            raise ValueError(f"{what} es obligatorio")
        return ""
    if not isinstance(value, str):
        raise ValueError(f"{what} debe ser texto")
    text = _CTRL.sub("", value.replace("\r\n", "\n").replace("\r", "\n")).strip()
    if required and not text:
        raise ValueError(f"{what} no puede estar vacio")
    if len(text) > limit:
        raise ValueError(f"{what} supera {limit} caracteres")
    return text


class Board:
    def __init__(self, media_dir: Path, broadcast: Callable[[dict[str, Any]], None], has_clients: Callable[[], bool] = lambda: True,
                 clock: Callable[[], float] = time.time):
        self.media_dir = Path(media_dir)
        self.broadcast, self.has_clients, self._clock = broadcast, has_clients, clock
        self.cards: dict[str, dict[str, Any]] = {}

    # -- imagenes -----------------------------------------------------------------------------------------------------
    def resolve_image(self, name: Any) -> Path:
        """Ruta de una imagen dentro de media/. ValueError con motivo legible si no es servible."""
        if not isinstance(name, str) or not _NAME_OK.match(name) or ".." in name or "/" in name or "\\" in name:
            raise ValueError("nombre de imagen invalido (solo el nombre de un archivo dentro de media/)")
        if Path(name).suffix.lower() not in IMAGE_EXT:
            raise ValueError(f"formato no permitido (usa {', '.join(sorted(IMAGE_EXT))})")
        try:
            root = self.media_dir.resolve()
            path = (root / name).resolve()
        except OSError as exc:
            raise ValueError("no se pudo resolver la imagen") from exc
        if path.parent != root:
            raise ValueError("la imagen debe estar directamente en media/")
        if not path.is_file():
            raise ValueError(f"no existe media/{name}")
        if path.stat().st_size > MAX_IMAGE_BYTES:
            raise ValueError("la imagen supera 8 MiB")
        return path

    @staticmethod
    def image_type(name: str) -> str:
        return IMAGE_EXT[Path(name).suffix.lower()]

    # -- operaciones --------------------------------------------------------------------------------------------------
    def add(self, title: Any, text: Any = None, image: Any = None, origin: str = "model") -> dict[str, Any]:
        title = clean_text(title, MAX_TITLE, "title", required=True)
        text = clean_text(text, MAX_TEXT, "text")
        img = None
        if image not in (None, ""):
            self.resolve_image(image)
            img = image
        if not text and img is None:
            raise ValueError("la tarjeta necesita text o image")
        if origin not in ("model", "user"):
            raise ValueError("origen invalido")
        while len(self.cards) >= MAX_CARDS:  # se descarta la mas antigua
            oldest = min(self.cards.values(), key=lambda c: c["ts"])
            self.remove(oldest["id"])
        card = {"id": secrets.token_hex(6), "title": title, "text": text, "image": img, "origin": origin, "ts": self._clock()}
        self.cards[card["id"]] = card
        self.broadcast({"t": "board", "ev": "add", "card": card})
        return card

    def remove(self, cid: Any) -> bool:
        if not isinstance(cid, str) or cid not in self.cards:
            return False
        del self.cards[cid]
        self.broadcast({"t": "board", "ev": "remove", "id": cid})
        return True

    def clear(self) -> int:
        n = len(self.cards)
        self.cards.clear()
        self.broadcast({"t": "board", "ev": "clear"})
        return n

    def snapshot(self) -> list[dict[str, Any]]:
        return sorted(self.cards.values(), key=lambda c: c["ts"])

    # -- herramientas del agente ----------------------------------------------------------------------------------------
    def tools(self) -> list[Tool]:
        async def present(args: dict[str, Any]) -> str:
            try:
                card = self.add(args.get("title"), args.get("text"), args.get("image"), origin="model")
            except ValueError as exc:
                raise ToolError(str(exc)) from exc
            where = "" if self.has_clients() else " (no hay ninguna pantalla abierta ahora: la veras al abrir Holo)"
            return f"Tarjeta '{card['title']}' mostrada en el tablero{where}."

        async def clear(args: dict[str, Any]) -> str:
            cid = args.get("id")
            if cid:
                if not self.remove(cid):
                    raise ToolError("no hay una tarjeta con ese id")
                return "Tarjeta retirada."
            return f"Tablero limpio ({self.clear()} tarjetas retiradas)."

        async def state(args: dict[str, Any]) -> str:
            if not self.cards:
                return "El tablero esta vacio."
            return "\n".join(f"- {c['id']}: {c['title']} ({'imagen ' + c['image'] if c['image'] else str(len(c['text'])) + ' caracteres'}, "
                             f"origen {c['origin']})" for c in self.snapshot())

        obj = lambda props, req: {"type": "object", "properties": props, "required": req, "additionalProperties": False}  # noqa: E731
        return [
            Tool("board_present", "Muestra una tarjeta holografica en la pantalla del usuario (tablero). Sirve para mostrar resultados, "
                 "listas o imagenes de la carpeta media/. Texto plano, sin HTML.",
                 obj({"title": {"type": "string", "description": f"Titulo corto (max {MAX_TITLE})"},
                      "text": {"type": "string", "description": f"Contenido en texto plano (max {MAX_TEXT})"},
                      "image": {"type": "string", "description": "Nombre de un archivo de imagen dentro de media/"}}, ["title"]),
                 present, "system_info", source="board",
                 describe=lambda a: (f"Mostrar la tarjeta '{str(a.get('title', ''))[:60]}' en el tablero", {"title": str(a.get("title", ""))[:60]})),
            Tool("board_clear", "Retira una tarjeta del tablero (con id) o limpia todo el tablero (sin id).",
                 obj({"id": {"type": "string", "description": "Id de la tarjeta; omitilo para limpiar todo"}}, []),
                 clear, "system_info", source="board", describe=lambda a: ("Retirar tarjetas del tablero", {})),
            Tool("board_state", "Lista las tarjetas que hay ahora en el tablero.", obj({}, []), state, "system_info", source="board",
                 describe=lambda a: ("Ver el tablero", {})),
        ]

    # -- comandos de la interfaz (los dispara la persona, no el modelo) --------------------------------------------------
    def handlers(self) -> dict[str, Callable[[dict[str, Any]], Any]]:
        async def board_state(args: dict[str, Any]) -> list[dict[str, Any]]:
            return self.snapshot()

        async def board_add(args: dict[str, Any]) -> dict[str, Any]:
            return self.add(args.get("title"), args.get("text"), args.get("image"), origin="user")

        async def board_close(args: dict[str, Any]) -> bool:
            return self.remove(args.get("id"))

        async def board_clear(args: dict[str, Any]) -> int:
            return self.clear()

        return {"board_state": board_state, "board_add": board_add, "board_close": board_close, "board_clear": board_clear}


def register_board(registry: Any, board: Board) -> list[str]:
    tools = board.tools()
    for t in tools:
        registry.register(t)
    return [t.name for t in tools]
