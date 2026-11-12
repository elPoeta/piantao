from __future__ import annotations

from dataclasses import dataclass
from typing import Any

LOOPBACK = {"127.0.0.1", "localhost", "::1"}


class WebConfigError(ValueError):
    pass


@dataclass(frozen=True)
class WebConfig:
    enabled: bool = True
    host: str = "127.0.0.1"
    port: int = 8765
    pairing_ttl_s: int = 120
    session_max_age_s: int = 7 * 24 * 3600
    session_idle_s: int = 12 * 3600
    max_sessions: int = 8
    max_clients: int = 8
    voice_enabled: bool = True     # voz por el navegador (el audio solo se procesa si la activas desde la pagina)
    voice_barge_in: bool = False   # interrumpir a Piantao hablandole encima (conviene con auriculares o buena cancelacion de eco)
    voice_barge_ms: int = 400      # voz sostenida necesaria para interrumpir
    static_dir: str | None = None  # solo pruebas: carpeta alternativa de estaticos

    @classmethod
    def from_config(cls, cfg: dict[str, Any]) -> "WebConfig":
        raw = (cfg.get("web") or {}).get("web") or {}  # cfg["web"] es el contenido de web.yaml
        if not isinstance(raw, dict):
            raise WebConfigError("web.yaml: 'web' debe ser un mapa")
        known = set(cls.__dataclass_fields__)
        unknown = set(raw) - known
        if unknown:
            raise WebConfigError(f"web.yaml: claves desconocidas {sorted(unknown)}")
        c = cls(**{k: raw[k] for k in known if k in raw})
        for key in ("enabled", "voice_enabled", "voice_barge_in"):
            if not isinstance(getattr(c, key), bool):
                raise WebConfigError(f"web.{key} debe ser true o false")
        if c.host not in LOOPBACK:
            raise WebConfigError("web.host: por ahora solo localhost (127.0.0.1); el acceso remoto llega en la fase W5")
        for key, lo, hi in (("port", 1024, 65535), ("pairing_ttl_s", 30, 600), ("session_max_age_s", 600, 90 * 24 * 3600),
                            ("session_idle_s", 300, 30 * 24 * 3600), ("max_sessions", 1, 32), ("max_clients", 1, 32), ("voice_barge_ms", 150, 2000)):
            v = getattr(c, key)
            if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
                raise WebConfigError(f"web.{key} debe ser un entero entre {lo} y {hi}")
        return c
