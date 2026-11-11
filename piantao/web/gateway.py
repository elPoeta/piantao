"""Pasarela web: sirve la interfaz y expone, por un unico WebSocket, el mismo protocolo que el socket del panel.

Defensas: solo loopback; Host y Origin con lista cerrada (DNS rebinding y CSWSH); cookie HttpOnly SameSite=Strict;
CSRF por cabecera personalizada; CSP estricta sin inline ni CDN; cola acotada por cliente; comandos solo de la lista fija.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from pathlib import Path
from typing import Any, Awaitable, Callable

from aiohttp import WSMsgType, web

from ..ipc.protocol import MAX_LINE, VERSION, ProtocolError, decode, encode
from .auth import PairingManager, SessionStore
from .config import WebConfig

log = logging.getLogger("piantao.web")
Handler = Callable[[dict[str, Any]], Awaitable[Any]]
COOKIE = "piantao_session"
CSRF_HEADER = "X-Piantao"
QUEUE_SIZE = 256
STATIC = Path(__file__).parent / "static"

CSP = ("default-src 'none'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; "
       "font-src 'self'; connect-src 'self'; media-src 'self' blob:; worker-src 'self' blob:; manifest-src 'self'; "
       "base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), display-capture=()",
    "Cache-Control": "no-store",
}


class WebGateway:
    def __init__(self, bus: Any, snapshot: Callable[[], dict[str, Any]], handlers: dict[str, Handler], cfg: WebConfig,
                 sessions: SessionStore, pairing: PairingManager, audit: Callable[..., None] | None = None):
        self.bus, self.snapshot, self.handlers, self.cfg = bus, snapshot, dict(handlers), cfg
        self.sessions, self.pairing, self._audit = sessions, pairing, audit
        self.static = Path(cfg.static_dir) if cfg.static_dir else STATIC
        self.port = cfg.port
        self.chat: Any = None
        self._runner: web.AppRunner | None = None
        self._clients: set["_WsClient"] = set()
        self._unsub: Callable[[], None] | None = None
        self._loop: asyncio.AbstractEventLoop | None = None
        self._hosts: set[str] = set()
        self._origins: set[str] = set()

    # -- ciclo de vida ---------------------------------------------------------------------------------------------
    async def start(self) -> None:
        self._loop = asyncio.get_running_loop()
        app = web.Application(middlewares=[self._guard], client_max_size=64 * 1024)
        app.add_routes([
            web.get("/", self._index), web.get("/api/session", self._session), web.post("/api/pair", self._pair),
            web.post("/api/logout", self._logout), web.get("/ws", self._ws),
        ])
        if (self.static / "assets").is_dir():
            app.router.add_static("/assets", self.static / "assets", follow_symlinks=False)
        self._runner = web.AppRunner(app, access_log=None, handler_cancellation=True)
        await self._runner.setup()
        site = web.TCPSite(self._runner, self.cfg.host, self.cfg.port)
        await site.start()
        self.port = site._server.sockets[0].getsockname()[1]  # type: ignore[union-attr]
        self._hosts = {f"localhost:{self.port}", f"127.0.0.1:{self.port}", f"[::1]:{self.port}"}
        self._origins = {f"http://{h}" for h in self._hosts}
        self._unsub = self.bus.subscribe(self._on_event)
        log.info("web: escuchando en http://localhost:%s", self.port)

    async def stop(self) -> None:
        if self._unsub:
            self._unsub()
        for c in list(self._clients):
            await c.close()
        if self._runner:
            await self._runner.cleanup()

    @property
    def url(self) -> str:
        return f"http://localhost:{self.port}"

    def pair_url(self, code: str) -> str:
        return f"{self.url}/#pair={code}"

    def audit(self, event: str, **data: Any) -> None:
        if self._audit:
            with contextlib.suppress(Exception):
                self._audit(event, **data)

    # -- middleware: Host/Origin/CSRF + cabeceras ------------------------------------------------------------------
    @web.middleware
    async def _guard(self, request: web.Request, handler: Callable[..., Awaitable[web.StreamResponse]]) -> web.StreamResponse:
        def deny(status: int, why: str) -> web.Response:
            self.audit("web_rejected", why=why, path=request.path[:80])
            return self._secure(web.Response(status=status, text=why))

        if request.headers.get("Host", "") not in self._hosts:
            return deny(421, "host no permitido")
        origin = request.headers.get("Origin")
        if request.method != "GET" or request.path == "/ws":
            if origin is None or origin not in self._origins:
                return deny(403, "origen no permitido")
        if request.method == "POST" and request.headers.get(CSRF_HEADER) != "1":
            return deny(403, "falta la cabecera de seguridad")
        try:
            resp = await handler(request)
        except web.HTTPException as exc:
            if exc.status < 400:  # redirecciones y similares pasan tal cual
                raise
            return self._secure(web.Response(status=exc.status, text=exc.reason))
        return self._secure(resp)

    @staticmethod
    def _secure(resp: Any) -> Any:
        for k, v in SECURITY_HEADERS.items():
            resp.headers.setdefault(k, v)
        return resp

    def _sid(self, request: web.Request) -> str | None:
        return self.sessions.verify(request.cookies.get(COOKIE))

    # -- rutas -----------------------------------------------------------------------------------------------------
    async def _index(self, request: web.Request) -> web.StreamResponse:
        f = self.static / "index.html"
        if not f.is_file():
            return web.Response(status=503, text="Interfaz no compilada: ejecuta `npm run build` en web/")
        return web.Response(body=f.read_bytes(), content_type="text/html", charset="utf-8")

    async def _session(self, request: web.Request) -> web.Response:
        return web.json_response({"paired": self._sid(request) is not None, "v": VERSION})

    async def _pair(self, request: web.Request) -> web.Response:
        try:
            body = await request.json()
        except (ValueError, UnicodeDecodeError):
            return web.json_response({"ok": False, "error": "JSON invalido"}, status=400)
        if self.pairing.locked:
            self.audit("web_pair", ok=False, why="bloqueado")
            return web.json_response({"ok": False, "error": "demasiados intentos, espera un minuto"}, status=429)
        code = body.get("code") if isinstance(body, dict) else None
        if not self.pairing.redeem(code):
            self.audit("web_pair", ok=False)
            return web.json_response({"ok": False, "error": "codigo invalido o vencido"}, status=403)
        token = self.sessions.create()
        self.audit("web_pair", ok=True)
        resp = web.json_response({"ok": True})
        resp.set_cookie(COOKIE, token, httponly=True, samesite="Strict", path="/", max_age=self.cfg.session_max_age_s,
                        secure=False)
        return resp

    async def _logout(self, request: web.Request) -> web.Response:
        self.sessions.revoke(request.cookies.get(COOKIE))
        resp = web.json_response({"ok": True})
        resp.del_cookie(COOKIE, path="/")
        return resp

    async def _ws(self, request: web.Request) -> web.StreamResponse:
        sid = self._sid(request)
        if sid is None:
            return web.Response(status=401, text="sin sesion")
        if len(self._clients) >= self.cfg.max_clients:
            return web.Response(status=503, text="demasiados clientes")
        ws = web.WebSocketResponse(max_msg_size=MAX_LINE, heartbeat=20)
        await ws.prepare(request)
        client = _WsClient(self, ws, sid)
        self._clients.add(client)
        self.audit("web_connect", via="web")
        try:
            await client.run()
        finally:
            self._clients.discard(client)
            await client.close()
            self.audit("web_disconnect", via="web")
        return ws

    # -- eventos del bus (otros hilos posibles) ----------------------------------------------------------------------
    def _on_event(self, ev: Any) -> None:
        msg = {"t": "event", "kind": ev.kind, "data": ev.data, "ts": ev.ts}
        loop = self._loop
        if loop is None or loop.is_closed():
            return
        try:
            running = asyncio.get_running_loop()
        except RuntimeError:
            running = None
        if running is loop:  # solo si estamos en el hilo de NUESTRO bucle; otro bucle en este hilo no sirve
            self._fanout(msg)
        else:
            loop.call_soon_threadsafe(self._fanout, msg)

    def _fanout(self, msg: dict[str, Any]) -> None:
        for c in list(self._clients):
            c.send(msg)

    def broadcast(self, msg: dict[str, Any]) -> None:
        """Envia un mensaje a todos los navegadores conectados (solo desde el hilo del bucle)."""
        self._fanout(msg)

    @property
    def clients(self) -> int:
        return len(self._clients)

    def kick(self, sid: str | None = None) -> None:
        """Cierra conexiones (todas, o las de una sesion revocada)."""
        for c in list(self._clients):
            if sid is None or c.sid == sid:
                c.abort()


class _WsClient:
    def __init__(self, gw: WebGateway, ws: web.WebSocketResponse, sid: str):
        self.gw, self.ws, self.sid = gw, ws, sid
        self.queue: asyncio.Queue[str | None] = asyncio.Queue(QUEUE_SIZE)
        self._closed = False

    def send(self, msg: dict[str, Any]) -> None:
        if self._closed:
            return
        try:
            self.queue.put_nowait(encode(msg).decode("utf-8").rstrip("\n"))
        except asyncio.QueueFull:
            log.warning("web: cliente demasiado lento, desconectado")
            self.abort()
        except ProtocolError:
            log.warning("web: mensaje demasiado grande, descartado")

    def abort(self) -> None:
        self._closed = True
        with contextlib.suppress(asyncio.QueueFull):
            self.queue.put_nowait(None)
        t = self.ws._req.transport if getattr(self.ws, "_req", None) is not None else None  # noqa: SLF001
        if t is not None:
            t.abort()

    async def close(self) -> None:
        self._closed = True
        with contextlib.suppress(asyncio.QueueFull):
            self.queue.put_nowait(None)
        with contextlib.suppress(Exception):
            await self.ws.close()

    async def _writer(self) -> None:
        try:
            while (data := await self.queue.get()) is not None:
                await self.ws.send_str(data)
        except (ConnectionError, OSError, RuntimeError):
            pass

    async def run(self) -> None:
        self.send({"t": "hello", "v": VERSION})
        try:
            self.send({"t": "snapshot", "data": self.gw.snapshot()})
        except Exception:  # noqa: BLE001
            log.exception("web: no se pudo armar el snapshot")
        wtask = asyncio.create_task(self._writer())
        try:
            async for m in self.ws:
                if m.type != WSMsgType.TEXT:
                    if m.type == WSMsgType.BINARY:
                        self.send({"t": "reply", "id": None, "ok": False, "error": "binario no soportado todavia"})
                        continue
                    break
                if not self.gw.sessions.verify_sid(self.sid):  # sesion revocada mientras estaba conectada
                    break
                await self._handle(m.data)
        finally:
            self._closed = True
            with contextlib.suppress(asyncio.QueueFull):
                self.queue.put_nowait(None)
            wtask.cancel()
            await asyncio.gather(wtask, return_exceptions=True)

    async def _handle(self, text: str) -> None:
        try:
            msg = decode(text.encode("utf-8"))
        except ProtocolError as exc:
            self.send({"t": "reply", "id": None, "ok": False, "error": str(exc)})
            return
        if msg["t"] != "cmd":
            self.send({"t": "reply", "id": msg.get("id"), "ok": False, "error": "tipo de mensaje no soportado"})
            return
        cid, name, args = msg.get("id"), msg.get("name"), msg.get("args") or {}
        handler = self.gw.handlers.get(name) if isinstance(name, str) else None
        if handler is None or not isinstance(args, dict):
            self.send({"t": "reply", "id": cid, "ok": False, "error": f"comando desconocido: {name!r}"})
            return
        try:
            data = await asyncio.wait_for(handler(args), 10.0)
            self.send({"t": "reply", "id": cid, "ok": True, "data": data})
        except (ValueError, KeyError, LookupError) as exc:
            self.send({"t": "reply", "id": cid, "ok": False, "error": str(exc)[:200]})
        except asyncio.TimeoutError:
            self.send({"t": "reply", "id": cid, "ok": False, "error": "tiempo agotado"})
        except Exception:  # noqa: BLE001
            log.exception("web: fallo el comando %s", name)
            self.send({"t": "reply", "id": cid, "ok": False, "error": "error interno"})
