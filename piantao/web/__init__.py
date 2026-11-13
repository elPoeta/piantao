"""Servicio web de Piantao (v2.0): la misma sesion que la terminal, en el navegador. Solo en localhost; ver docs/PIANTAO_v2.0_diseno.md."""

from .auth import PairingManager, SessionStore
from .chat import ChatSession, WebConfirmer
from .config import WebConfig, WebConfigError
from .vision import WebVision
from .board import Board, register_board
from .files import FileBrowser
from .gateway import WebGateway

__all__ = ["FileBrowser", "Board", "register_board", "WebVision", "ChatSession", "WebConfirmer", "PairingManager", "SessionStore", "WebConfig", "WebConfigError", "WebGateway"]
