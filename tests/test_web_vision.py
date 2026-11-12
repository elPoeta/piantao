import asyncio
import json
import struct
from types import SimpleNamespace as NS

import numpy as np
import pytest

from piantao.core import EventBus
from piantao.gestures import GestureConfig, GestureHub, GesturePolicy, Thresholds, classify, make_gesture_confirmer
from piantao.web import vision as wv
from piantao.web.vision import BIN_LANDMARKS, WebVision, parse_landmarks
from tests.hands_fixture import FIST, OPEN, THUMB_UP, make_hand

ASPECT = 4 / 3


def run(coro):
    return asyncio.run(coro)


def pack(hand, aspect=ASPECT, ts=0):
    """Mano en espacio corregido -> trama como la manda el navegador (x, y, z normalizados)."""
    pts = np.array([(x / aspect, y, z / aspect) for x, y, z in hand.landmarks], dtype="<f4")
    return struct.pack("<BIB", BIN_LANDMARKS, ts, 1) + bytes([1, 230]) + pts.tobytes()


def pack_none():
    return struct.pack("<BIB", BIN_LANDMARKS, 0, 0)


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


class Perms:
    def __init__(self, allowed=True):
        self.allowed, self.calls = allowed, []

    async def check(self, req):
        self.calls.append(req)
        return NS(allowed=self.allowed, reason="no")


def cfg(**over):
    base = dict(hold_s=0.6, activate_hold_s=1.5, armed_s=10, require_arming=True, cooldown_s=1.0, grace_s=0.2)
    base.update(over)
    return GestureConfig(**base)


def make(tmp_path, perms=None, policy=None):
    bus, sent, clk = EventBus(), [], Clock()
    hub = GestureHub(policy or GesturePolicy(), bus, out=lambda *a, **k: None)
    interrupts = []
    hub.on_interrupt = lambda: interrupts.append(1)
    v = WebVision(hub, bus, cfg(), Thresholds(), tmp_path / "cal.json", lambda c, m: sent.append((c, m)), perms, clock=clk, max_fps=30)
    return NS(v=v, hub=hub, bus=bus, sent=sent, clk=clk, interrupts=interrupts)


def feed(m, c, frame, seconds, dt=0.05):
    n = int(round(seconds / dt))
    for _ in range(n):
        m.clk.t += dt
        m.v.on_binary(c, frame)


def gestures(m):
    return [x["name"] for _c, x in m.sent if x.get("ev") == "gesture"]


# ---- formato ----------------------------------------------------------------------------------------------------
def test_roundtrip_preserves_pose_for_python_classifier():
    for fn, pose in ((OPEN, "open_palm"), (FIST, "fist"), (THUMB_UP, "thumb_up")):
        hands = parse_landmarks(pack(fn()), ASPECT)
        assert len(hands) == 1 and classify(hands[0], Thresholds()) == pose and hands[0].aspect == ASPECT


def test_parse_rejects_malformed_frames():
    good = pack(OPEN())
    assert parse_landmarks(pack_none(), ASPECT) == []
    bad = [b"", good[:10], good + b"\x00", bytes([9]) + good[1:], good[:5] + bytes([3]) + good[6:], good[:5] + bytes([2]) + good[6:]]
    nan = bytearray(good)
    nan[8:12] = struct.pack("<f", float("nan"))
    huge = bytearray(good)
    huge[8:12] = struct.pack("<f", 1e9)
    inf = bytearray(good)
    inf[12:16] = struct.pack("<f", float("inf"))
    for b in bad + [bytes(nan), bytes(huge), bytes(inf)]:
        assert parse_landmarks(b, ASPECT) is None


def test_two_hands_sorted_by_confidence():
    a, b = pack(OPEN()), pack(FIST())
    two = struct.pack("<BIB", BIN_LANDMARKS, 0, 2) + a[6:6 + 254] .replace(bytes([1, 230]), bytes([1, 100]), 1) + b[6:]
    hands = parse_landmarks(two, ASPECT)
    assert len(hands) == 2 and hands[0].score > hands[1].score


# ---- ciclo de vida ----------------------------------------------------------------------------------------------
def test_start_validations_single_client_permission_and_stop(tmp_path):
    async def go():
        perms = Perms()
        m = make(tmp_path, perms)
        A, B = object(), object()
        for bad in (None, "x", True, 0.1, 9, float("nan")):
            with pytest.raises(ValueError):
                await m.v.start(A, bad)
        info = await m.v.start(A, 1.33)
        assert info["active"] and m.hub.active and perms.calls[0].kind == "camera_capture" and perms.calls[0].details["via"] == "web"
        with pytest.raises(ValueError, match="otra pestana"):
            await m.v.start(B, 1.33)
        await m.v.stop(B)
        assert m.v.active
        await m.v.stop(A)
        assert not m.v.active and not m.hub.active and m.sent[-1][1] == {"t": "vision", "ev": "off"}
        denied = make(tmp_path, Perms(False))
        with pytest.raises(ValueError, match="permiso denegado"):
            await denied.v.start(A, 1.33)
        assert not denied.v.active and not denied.hub.active
    run(go())


def test_disconnect_stops_vision(tmp_path):
    async def go():
        m = make(tmp_path)
        A = object()
        await m.v.start(A, 1.33)
        m.v.on_disconnect(object())
        await asyncio.sleep(0.02)
        assert m.v.active
        m.v.on_disconnect(A)
        await asyncio.sleep(0.02)
        assert not m.v.active and not m.hub.active
    run(go())


# ---- gestos con la politica del hub --------------------------------------------------------------------------------
def test_palm_interrupts_but_frames_from_other_client_do_not(tmp_path):
    async def go():
        m = make(tmp_path)
        A, B = object(), object()
        await m.v.start(A, ASPECT)
        feed(m, B, pack(OPEN()), 1.0)
        assert m.interrupts == [] and gestures(m) == []
        feed(m, A, pack(OPEN()), 1.0)
        assert gestures(m) == ["palm"] and m.interrupts == [1]
        statuses = [x for _c, x in m.sent if x.get("ev") == "status"]
        assert statuses and statuses[-1]["pose"] == "open_palm" and statuses[-1]["hand"] is True
        assert any(e.kind == "gesture" for e in m.bus.recent("gesture")) or m.bus.recent("gesture")
    run(go())


def test_thumb_answers_confirmation_only_when_armed_and_eligible(tmp_path):
    async def go():
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)
        req = NS(kind="shell_exec", tainted=False, description="x", details={})

        async def keyboard(_r, _e):
            await asyncio.sleep(30)
            return False

        confirm = make_gesture_confirmer(keyboard, m.hub)
        task = asyncio.create_task(confirm(req, False))
        await asyncio.sleep(0.01)
        feed(m, A, pack(THUMB_UP()), 1.2)  # sin activar la interaccion: el pulgar no cuenta
        assert not task.done() and "thumb_up" not in gestures(m)
        feed(m, A, pack(OPEN()), 1.8)       # mano abierta sostenida: activa
        assert "activate" in gestures(m) and not task.done()
        feed(m, A, pack(THUMB_UP()), 1.0)
        assert await asyncio.wait_for(task, 1) is True
        # explicita o tras contenido externo: los gestos no pueden responder
        assert m.hub.blocked_reason(req, True) and m.hub.blocked_reason(NS(kind="x", tainted=True), False)
    run(go())


def test_thumb_down_denies(tmp_path):
    async def go():
        from tests.hands_fixture import THUMB_DOWN
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)
        req = NS(kind="shell_exec", tainted=False, description="x", details={})

        async def keyboard(_r, _e):
            await asyncio.sleep(30)

        task = asyncio.create_task(make_gesture_confirmer(keyboard, m.hub)(req, False))
        await asyncio.sleep(0.01)
        feed(m, A, pack(OPEN()), 1.8)
        feed(m, A, pack(THUMB_DOWN()), 1.0)
        assert await asyncio.wait_for(task, 1) is False
    run(go())


def test_gestures_disabled_by_policy_never_answer(tmp_path):
    async def go():
        m = make(tmp_path, policy=GesturePolicy(confirm_with_gestures=False, interrupt_with_palm=False))
        A = object()
        await m.v.start(A, ASPECT)
        req = NS(kind="shell_exec", tainted=False, description="x", details={})
        assert not m.hub.eligible(req, False)
        feed(m, A, pack(OPEN()), 1.0)
        assert m.interrupts == []
    run(go())


def test_frame_rate_is_capped(tmp_path):
    async def go():
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)
        for _ in range(500):  # sin avanzar el reloj: solo la primera pasa
            m.v.on_binary(A, pack(OPEN()))
        assert m.v.frames == 1
        feed(m, A, pack(OPEN()), 0.5)
        assert m.v.frames > 5
    run(go())


def test_malformed_frames_do_not_crash_or_count(tmp_path):
    async def go():
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)
        for b in (b"", b"\x03", b"\x03" + b"\xff" * 400, bytes([3]) + b"\x00" * 5 + b"\x09"):
            m.clk.t += 1
            m.v.on_binary(A, b)
        assert m.v.frames == 0
    run(go())


# ---- calibracion --------------------------------------------------------------------------------------------------
def test_calibration_measures_both_poses_and_saves(tmp_path, monkeypatch):
    async def go():
        monkeypatch.setattr(wv, "CAL_SECONDS", 0.5)
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)

        async def drive(frame):
            task = asyncio.create_task(m.v.calibrate(A, "open" if frame is OPENF else "closed"))
            for _ in range(20):
                await asyncio.sleep(0.02)
                m.clk.t += 0.05
                m.v.on_binary(A, frame)
            return await task

        OPENF, FISTF = pack(OPEN()), pack(FIST())
        with pytest.raises(ValueError, match="no vi tu mano"):
            await m.v.calibrate(A, "open")
        with pytest.raises(ValueError):
            await m.v.apply_calibration(A)  # faltan muestras
        a = await drive(OPENF)
        b = await drive(FISTF)
        assert a["median"] > b["median"] and a["samples"] >= 5
        assert not m.hub.bus.recent("gesture")  # calibrando no dispara gestos
        res = await m.v.apply_calibration(A)
        assert res["finger_curled"] < res["finger_extended"]
        saved = json.loads((tmp_path / "cal.json").read_text())
        assert saved["finger_extended"] == res["finger_extended"]
        assert m.v.engine.th.finger_extended == res["finger_extended"]
        with pytest.raises(ValueError):
            await m.v.calibrate(A, "otra")
        with pytest.raises(ValueError):
            await m.v.calibrate(object(), "open")
    run(go())


def test_calibration_rejects_indistinguishable_poses(tmp_path, monkeypatch):
    async def go():
        monkeypatch.setattr(wv, "CAL_SECONDS", 0.4)
        m = make(tmp_path)
        A = object()
        await m.v.start(A, ASPECT)
        frame = pack(OPEN())

        async def both(pose):
            t = asyncio.create_task(m.v.calibrate(A, pose))
            for _ in range(15):
                await asyncio.sleep(0.02)
                m.clk.t += 0.05
                m.v.on_binary(A, frame)
            await t

        await both("open")
        await both("closed")  # "puño" igual a mano abierta
        with pytest.raises(ValueError, match="casi no se distinguen"):
            await m.v.apply_calibration(A)
        assert not (tmp_path / "cal.json").exists()
    run(go())


# ---- pasarela: despacho por tipo de trama -----------------------------------------------------------------------------
def test_gateway_dispatches_binary_by_type(tmp_path):
    import aiohttp

    from piantao.web import PairingManager, SessionStore, WebConfig, WebGateway
    from piantao.web.gateway import CSRF_HEADER

    async def go():
        m = make(tmp_path)
        pairing = PairingManager()
        gw = WebGateway(m.bus, lambda: {}, {}, WebConfig(port=0), SessionStore(tmp_path / "s.json"), pairing)
        m.v._send = gw.send_to
        mic = []
        gw.ctx_handlers.update(m.v.handlers())
        gw.binary_handlers[BIN_LANDMARKS] = m.v.on_binary
        gw.binary_handlers[1] = lambda c, d: mic.append(len(d))
        gw.disconnect_hooks.append(m.v.on_disconnect)
        m.v.permissions = None
        await gw.start()
        try:
            async with aiohttp.ClientSession() as s:
                code, _ = pairing.issue()
                await s.post(gw.url + "/api/pair", json={"code": code}, headers={"Origin": gw.url, CSRF_HEADER: "1"})
                async with s.ws_connect(gw.url + "/ws", headers={"Origin": gw.url}) as ws:
                    await ws.receive(); await ws.receive()
                    await ws.send_str(json.dumps({"t": "cmd", "id": 1, "name": "vision_start", "args": {"aspect": ASPECT}}))
                    while json.loads((await asyncio.wait_for(ws.receive(), 3)).data).get("t") != "reply":
                        pass
                    await ws.send_bytes(bytes([1]) + b"\x00" * 10)
                    await ws.send_bytes(pack(OPEN()))
                    status = None
                    for _ in range(10):
                        msg = json.loads((await asyncio.wait_for(ws.receive(), 3)).data)
                        if msg.get("ev") == "status":
                            status = msg
                            break
                    assert status and status["pose"] == "open_palm" and mic == [11]
        finally:
            await gw.stop()
    run(go())
