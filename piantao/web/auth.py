"""Emparejamiento y sesiones del servicio web.

- El codigo de emparejamiento se pide por el socket Unix privado (`python main.py pair`) o aparece en la terminal de Piantao:
  nunca viaja por la red hasta que TU lo escribes en el navegador. Es de un solo uso, vence rapido y tiene freno ante intentos fallidos.
- La sesion es un token aleatorio en una cookie HttpOnly/SameSite=Strict; en disco solo se guarda su hash (0600).
"""

from __future__ import annotations

import hashlib
import hmac
import json
import os
import secrets
import time
from pathlib import Path
from typing import Any, Callable

ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"  # sin 0/O/1/I/L
MAX_FAILURES = 5
LOCKOUT_S = 60


def _norm(code: str) -> str:
    return "".join(ch for ch in str(code).upper() if ch in ALPHABET)


class PairingManager:
    def __init__(self, ttl_s: int = 120, clock: Callable[[], float] = time.monotonic):
        self.ttl_s, self._clock = ttl_s, clock
        self._code: str | None = None
        self._expires = 0.0
        self._fails = 0
        self._locked_until = 0.0

    def issue(self) -> tuple[str, int]:
        """Genera un codigo nuevo (invalida el anterior). Devuelve (codigo 'ABCD-2345', segundos de validez)."""
        raw = "".join(secrets.choice(ALPHABET) for _ in range(8))
        self._code, self._expires = raw, self._clock() + self.ttl_s
        return f"{raw[:4]}-{raw[4:]}", self.ttl_s

    @property
    def locked(self) -> bool:
        return self._clock() < self._locked_until

    def redeem(self, code: Any) -> bool:
        """True una sola vez por codigo valido. Tras 5 fallos seguidos se bloquea 60 s y se descarta el codigo vigente."""
        now = self._clock()
        if now < self._locked_until:
            return False
        ok = False
        if self._code is not None and now < self._expires and isinstance(code, str) and len(code) <= 32:
            ok = hmac.compare_digest(_norm(code).encode(), self._code.encode())
        if ok:
            self._code, self._fails = None, 0
            return True
        self._fails += 1
        if self._fails >= MAX_FAILURES:
            self._code, self._fails, self._locked_until = None, 0, now + LOCKOUT_S
        return False


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


class SessionStore:
    def __init__(self, path: Path | str | None = None, max_age_s: int = 7 * 24 * 3600, idle_s: int = 12 * 3600,
                 max_sessions: int = 8, clock: Callable[[], float] = time.time):
        self.path = Path(path) if path else None
        self.max_age_s, self.idle_s, self.max_sessions, self._clock = max_age_s, idle_s, max_sessions, clock
        self._s: dict[str, dict[str, float]] = {}
        self._load()

    # -- persistencia (solo hashes) -----------------------------------------------------------------------------
    def _load(self) -> None:
        if self.path and self.path.is_file():
            try:
                data = json.loads(self.path.read_text(encoding="utf-8"))
                self._s = {k: v for k, v in data.items() if isinstance(v, dict) and {"created", "seen"} <= set(v)}
            except (OSError, ValueError):
                self._s = {}
        self._prune()

    def _save(self) -> None:
        if not self.path:
            return
        self.path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.path.with_suffix(".tmp")
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(self._s, f)
        os.replace(tmp, self.path)

    def _prune(self) -> None:
        now = self._clock()
        dead = [k for k, v in self._s.items() if now - v["created"] > self.max_age_s or now - v["seen"] > self.idle_s]
        for k in dead:
            del self._s[k]
        if dead:
            self._save()

    # -- API -------------------------------------------------------------------------------------------------------
    def create(self) -> str:
        self._prune()
        while len(self._s) >= self.max_sessions:  # se descarta la mas antigua
            oldest = min(self._s, key=lambda k: self._s[k]["created"])
            del self._s[oldest]
        token = secrets.token_urlsafe(32)
        now = self._clock()
        self._s[_hash(token)] = {"created": now, "seen": now}
        self._save()
        return token

    def verify(self, token: str | None) -> str | None:
        """Devuelve el id (hash) de la sesion si es valida; renueva la actividad."""
        if not token or len(token) > 100:
            return None
        sid = _hash(token)
        s = self._s.get(sid)
        if s is None:
            return None
        now = self._clock()
        if now - s["created"] > self.max_age_s or now - s["seen"] > self.idle_s:
            del self._s[sid]
            self._save()
            return None
        if now - s["seen"] > 60:  # no escribir a disco en cada mensaje
            s["seen"] = now
            self._save()
        return sid

    def verify_sid(self, sid: str) -> bool:
        s = self._s.get(sid)
        return s is not None and self._clock() - s["created"] <= self.max_age_s

    def revoke(self, token: str | None) -> None:
        if token and self._s.pop(_hash(token), None) is not None:
            self._save()

    def revoke_all(self) -> int:
        n = len(self._s)
        self._s.clear()
        self._save()
        return n

    def __len__(self) -> int:
        return len(self._s)
