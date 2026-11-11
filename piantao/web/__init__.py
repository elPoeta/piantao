"""Servicio web de Piantao (v2.0): la misma sesion que la terminal, en el navegador. Solo en localhost; ver docs/PIANTAO_v2.0_diseno.md."""

from .auth import PairingManager, SessionStore
from .config import WebConfig, WebConfigError
from .gateway import WebGateway

__all__ = ["PairingManager", "SessionStore", "WebConfig", "WebConfigError", "WebGateway"]
