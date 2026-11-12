"""Vision en el navegador: MediaPipe corre en la pagina y al servidor solo llegan los 21 puntos de la mano.

Nunca viaja una imagen. El motor de gestos es el MISMO de la terminal (piantao.gestures): decide los gestos semanticos y,
con la politica de GestureHub, que gesto puede responder una confirmacion. El navegador no decide permisos.

Binario cliente -> servidor:  [0x03][u32 ts_ms LE][u8 n manos (0..2)] y por mano [u8 lado][u8 confianza 0..255][63 x f32 LE]
(x, y, z normalizados como los da MediaPipe, con x ya espejada si la pagina muestra la camara en espejo).
"""

from __future__ import annotations

import asyncio
import logging
import math
import struct
import time
from pathlib import Path
from typing import Any, Callable

import numpy as np

from ..gestures.engine import GestureConfig, GestureEngine, compute_calibration, mean_finger_ratio, save_calibration
from ..security import ActionRequest
from ..vision.hands import Hand

log = logging.getLogger("piantao.web.vision")
BIN_LANDMARKS = 3
MAX_HANDS = 2
HAND_BYTES = 2 + 63 * 4
SIDES = ("Left", "Right", "?")
CAL_SECONDS = 3.0


def parse_landmarks(data: bytes, aspect: float) -> list[Hand] | None:
    """Trama de puntos -> manos (espacio corregido por aspecto, como HandTracker). None si no es valida."""
    if len(data) < 6 or data[0] != BIN_LANDMARKS:
        return None
    n = data[5]
    if n > MAX_HANDS or len(data) != 6 + n * HAND_BYTES:
        return None
    hands: list[Hand] = []
    for i in range(n):
        off = 6 + i * HAND_BYTES
        side, score = data[off], data[off + 1]
        pts = np.frombuffer(data, dtype="<f4", count=63, offset=off + 2).astype(np.float64).reshape(21, 3)
        if not np.all(np.isfinite(pts)) or np.any(np.abs(pts) > 4.0):
            return None
        lm = tuple((float(x) * aspect, float(y), float(z) * aspect) for x, y, z in pts)
        hands.append(Hand(lm, SIDES[side] if side < len(SIDES) else "?", score / 255.0, aspect))
    hands.sort(key=lambda h: -h.score)
    return hands


class WebVision:
    def __init__(self, hub: Any, bus: Any, cfg: GestureConfig, thresholds: Any, calibration_path: Path,
                 send_json: Callable[[Any, dict[str, Any]], None], permissions: Any = None,
                 clock: Callable[[], float] = time.monotonic, max_fps: float = 30.0, on_stop: Callable[[], None] | None = None):
        self.hub, self.bus, self.cfg, self.th = hub, bus, cfg, thresholds
        self.cal_path, self._send, self.permissions, self._clock = calibration_path, send_json, permissions, clock
        self._min_dt = 1.0 / max_fps
        self.client: Any = None
        self.aspect = 4 / 3
        self.engine: GestureEngine | None = None
        self._last_frame = -1e9
        self._last_status = -1e9
        self._last_pose = ""
        self._cal_pose: str | None = None
        self._cal: dict[str, list[float]] = {"open": [], "closed": []}
        self._locked = asyncio.Lock()
        self.frames = 0
        self.on_stop = on_stop

    @property
    def active(self) -> bool:
        return self.client is not None

    def info(self) -> dict[str, Any]:
        return {"active": self.active, "armed": bool(self.engine and self.engine.armed), "frames": self.frames,
                "confirm_with_gestures": bool(self.hub.policy.confirm_with_gestures),
                "interrupt_with_palm": bool(self.hub.policy.interrupt_with_palm),
                "calibrated": self.cal_path.is_file()}

    # -- ciclo de vida -------------------------------------------------------------------------------------------------
    async def start(self, client: Any, aspect: Any) -> dict[str, Any]:
        if isinstance(aspect, bool) or not isinstance(aspect, (int, float)) or not 0.5 <= float(aspect) <= 3.0:
            raise ValueError("aspect debe ser un numero entre 0.5 y 3 (ancho/alto del video)")
        async with self._locked:
            if self.client is not None and self.client is not client:
                raise ValueError("la camara ya esta activa en otra pestana del navegador")
            if self.client is None:
                if self.permissions is not None:
                    d = await self.permissions.check(ActionRequest(
                        "camera_capture", "Usar la camara del navegador para reconocer gestos (solo viajan los puntos de la mano)",
                        {"purpose": "gestures", "via": "web"}))
                    if not d.allowed:
                        raise ValueError(f"permiso denegado: {d.reason}")
                self.engine = GestureEngine(self.cfg, self.th)
                self.frames = 0
            self.client, self.aspect = client, float(aspect)
            self.hub.active = True
        self._send(client, {"t": "vision", "ev": "ready", **self.info()})
        return self.info()

    async def stop(self, client: Any = None) -> None:
        if self.client is None or (client is not None and client is not self.client):
            return
        old = self.client
        self.client, self.engine, self._cal_pose = None, None, None
        self.hub.active = False
        self._send(old, {"t": "vision", "ev": "off"})
        if self.on_stop:
            self.on_stop()

    def on_disconnect(self, client: Any) -> None:
        if client is self.client:
            asyncio.ensure_future(self.stop(client))

    # -- puntos entrantes (hilo del bucle) --------------------------------------------------------------------------------
    def on_binary(self, client: Any, data: bytes) -> None:
        if client is not self.client or self.engine is None:
            return
        now = self._clock()
        if now - self._last_frame < self._min_dt:
            return  # un cliente que manda de mas se descarta sin trabajo
        hands = parse_landmarks(data, self.aspect)
        if hands is None:
            return
        self._last_frame = now
        self.frames += 1
        hand = hands[0] if hands else None
        if self._cal_pose is not None:  # calibrando: se miden dedos y no se disparan gestos
            if hand is not None:
                self._cal[self._cal_pose].append(mean_finger_ratio(hand))
            self._status(now, hand, force=False)
            return
        for ev in self.engine.update(hand, now):
            self.hub.on_event(ev)
            self._send(client, {"t": "vision", "ev": "gesture", "name": ev.name})
        self._status(now, hand, force=self.engine.pose != self._last_pose)

    def _status(self, now: float, hand: Hand | None, force: bool) -> None:
        if not force and now - self._last_status < 0.25:
            return
        self._last_status = now
        assert self.engine is not None
        self._last_pose = self.engine.pose
        self._send(self.client, {"t": "vision", "ev": "status", "pose": self.engine.pose, "hand": hand is not None,
                                 "armed": self.engine.armed, "calibrating": self._cal_pose})

    # -- calibracion ---------------------------------------------------------------------------------------------------
    async def calibrate(self, client: Any, pose: Any) -> dict[str, Any]:
        if client is not self.client:
            raise ValueError("la camara no esta activa en esta pestana")
        if pose not in ("open", "closed"):
            raise ValueError("pose debe ser 'open' o 'closed'")
        if self._cal_pose is not None:
            raise ValueError("ya hay una medicion en curso")
        self._cal[pose] = []
        self._cal_pose = pose
        try:
            await asyncio.sleep(CAL_SECONDS)
        finally:
            self._cal_pose = None
            if self.engine is not None:
                self.engine.reset()
        xs = self._cal[pose]
        if len(xs) < 5:
            raise ValueError("no vi tu mano: ponela entera frente a la camara y repeti")
        return {"pose": pose, "samples": len(xs), "median": round(sorted(xs)[len(xs) // 2], 2)}

    async def apply_calibration(self, client: Any) -> dict[str, Any]:
        if client is not self.client or self.engine is None:
            raise ValueError("la camara no esta activa en esta pestana")
        th = compute_calibration(self._cal["open"], self._cal["closed"], self.engine.th)  # ValueError con motivo legible
        save_calibration(self.cal_path, th)
        self.engine.th = th
        self.th = th
        self._cal = {"open": [], "closed": []}
        return {"finger_extended": th.finger_extended, "finger_curled": th.finger_curled}

    # -- comandos --------------------------------------------------------------------------------------------------------
    def handlers(self) -> dict[str, Callable[[dict[str, Any], Any], Any]]:
        async def vision_start(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return await self.start(client, args.get("aspect"))

        async def vision_stop(args: dict[str, Any], client: Any) -> bool:
            if client is not self.client:
                return False
            await self.stop(client)
            return True

        async def vision_info(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return {**self.info(), "mine": client is self.client}

        async def vision_calibrate(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return await self.calibrate(client, args.get("pose"))

        async def vision_calibrate_apply(args: dict[str, Any], client: Any) -> dict[str, Any]:
            return await self.apply_calibration(client)

        return {"vision_start": vision_start, "vision_stop": vision_stop, "vision_info": vision_info,
                "vision_calibrate": vision_calibrate, "vision_calibrate_apply": vision_calibrate_apply}
