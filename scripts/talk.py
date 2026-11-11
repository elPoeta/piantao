#!/usr/bin/env python3
"""Pulsa 'hablar' en un Piantao en marcha (o lo interrumpe si esta respondiendo). Solo biblioteca estandar: arranca al instante.

Uso tipico: asignarlo como comando de un atajo personalizado de KDE
(Preferencias del sistema -> Atajos -> Agregar comando), p. ej.:

    python3 /ruta/al/proyecto/scripts/talk.py            # hablar / interrumpir
    python3 /ruta/al/proyecto/scripts/talk.py --stop     # solo callar

Funciona aunque el portal XDG de atajos globales no este disponible.
"""

import json
import os
import socket
import sys
from pathlib import Path


def socket_path() -> Path:
    runtime = os.environ.get("XDG_RUNTIME_DIR")
    base = Path(runtime) if runtime else Path(f"/tmp/piantao-{os.getuid()}")
    return base / "piantao" / "ui.sock"


def main(argv: list[str]) -> int:
    cmd = "interrupt" if "--stop" in argv else "talk"
    path = Path(argv[argv.index("--socket") + 1]) if "--socket" in argv else socket_path()
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(3)
        s.connect(str(path))
        f = s.makefile("rwb")
        f.readline()  # hello
        f.write(json.dumps({"t": "cmd", "id": 1, "name": cmd, "args": {}}).encode() + b"\n")
        f.flush()
        while True:
            line = f.readline()
            if not line:
                print("sin respuesta de Piantao", file=sys.stderr)
                return 1
            msg = json.loads(line)
            if msg.get("t") == "reply" and msg.get("id") == 1:
                return 0 if msg.get("ok") else 1
    except (OSError, ValueError) as exc:
        print(f"No hay un Piantao escuchando en {path}: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
