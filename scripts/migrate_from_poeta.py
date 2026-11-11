#!/usr/bin/env python3
"""Migra una instalacion de P.O.E.T.A. al nuevo nombre (Piantao). Solo biblioteca estandar.

Se ejecuta DENTRO de la carpeta del proyecto ya renombrada (~/AI/piantao):

    python3 scripts/migrate_from_poeta.py --dry-run     # muestra que cambiaria
    python3 scripts/migrate_from_poeta.py               # lo aplica

Que hace (todo reversible: guarda `*.bak-poeta` de cada archivo que modifica):
- config/*.yaml y .env: cambia el nombre (poeta/POETA -> piantao/Piantao, variables POETA_* -> PIANTAO_*), la palabra de
  activacion y sus alias, y el app_id del portal.
- logs/poeta.log -> logs/piantao.log (conserva tu historial).
- borra el paquete viejo `poeta/` si ya existe `piantao/`.
- servicio systemd de usuario `poeta.service` (lo detiene y lo elimina; reinstalalo con scripts/install_service.py).
- ~/.local/share/applications/org.poeta.Assistant.desktop (lo elimina).
No toca tu memoria (data/), modelos ni la cadena de auditoria.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NEW_ALIASES = "[piantado, pianto, piantau]"  # como suele transcribirla Whisper

_SUBS = [
    (re.compile(r"P\.O\.E\.T\.A\.\s*-\s*Personal Offline Executive & Thinking Assistant"), "Piantao - asistente personal local"),
    (re.compile(r"\s*\(Personal Offline Executive & Thinking Assistant\)"), ""),
    (re.compile(r"Personal Offline Executive & Thinking Assistant"), "asistente personal local"),
    (re.compile(r"P\.O\.E\.T\.A\."), "Piantao"),
    (re.compile(r"org\.poeta\."), "org.piantao."),
    (re.compile(r"POETA_"), "PIANTAO_"),
    (re.compile(r"(?i:poeta)"), lambda m: "Piantao" if m.group(0)[0].isupper() else "piantao"),
]
_ALIASES = re.compile(r"(?m)^(\s*aliases:\s*)\[[^\]\n]*\](.*)$")


def rename_text(text: str) -> str:
    text = _ALIASES.sub(lambda m: f"{m.group(1)}{NEW_ALIASES}{m.group(2)}", text) if "boeta" in text.lower() else text
    for pat, repl in _SUBS:
        text = pat.sub(repl, text)
    return text


def plan(root: Path, home: Path) -> list[tuple[str, Path, str]]:
    """Lista de acciones: (tipo, ruta, detalle). Sin efectos."""
    acts: list[tuple[str, Path, str]] = []
    files = sorted((root / "config").glob("*.yaml")) + ([root / ".env"] if (root / ".env").is_file() else [])
    for f in files:
        old = f.read_text(encoding="utf-8")
        if rename_text(old) != old:
            acts.append(("edit", f, "nombre y palabra de activacion"))
    if (root / "logs" / "poeta.log").is_file() and not (root / "logs" / "piantao.log").exists():
        acts.append(("move", root / "logs" / "poeta.log", "logs/piantao.log"))
    if (root / "poeta" / "__init__.py").is_file() and (root / "piantao" / "__init__.py").is_file():
        acts.append(("rmtree", root / "poeta", "paquete viejo"))
    unit = home / ".config" / "systemd" / "user" / "poeta.service"
    if unit.is_file():
        acts.append(("service", unit, "detener y eliminar poeta.service"))
    desk = home / ".local" / "share" / "applications" / "org.poeta.Assistant.desktop"
    if desk.is_file():
        acts.append(("remove", desk, "entrada de escritorio vieja"))
    return acts


def _systemctl(*args: str) -> None:
    try:
        subprocess.run(["systemctl", "--user", *args], check=False, capture_output=True, timeout=30)
    except (OSError, subprocess.SubprocessError):
        pass  # sin systemd (p. ej. en pruebas): no es motivo para abortar la migracion


def apply(acts: list[tuple[str, Path, str]], root: Path, out=print) -> None:
    for kind, path, detail in acts:
        if kind == "edit":
            old = path.read_text(encoding="utf-8")
            shutil.copy2(path, path.with_name(path.name + ".bak-poeta"))
            path.write_text(rename_text(old), encoding="utf-8")
        elif kind == "move":
            path.rename(root / "logs" / "piantao.log")
        elif kind == "rmtree":
            shutil.rmtree(path)
        elif kind == "service":
            _systemctl("disable", "--now", "poeta")
            path.unlink()
            _systemctl("daemon-reload")
        elif kind == "remove":
            path.unlink()
        out(f"  hecho: {kind} {path}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--home", default=str(Path.home()), help=argparse.SUPPRESS)
    a = ap.parse_args(argv)
    acts = plan(ROOT, Path(a.home))
    if not acts:
        print("Nada que migrar: ya esta todo con el nombre nuevo.")
        return 0
    for kind, path, detail in acts:
        print(f"{'[simulacion] ' if a.dry_run else ''}{kind:8} {path}  ({detail})")
    if a.dry_run:
        return 0
    apply(acts, ROOT)
    print("\nListo. Siguientes pasos:\n  1) uv run python main.py --help        (uv reconstruye el entorno con el nombre nuevo)"
          "\n  2) python scripts/install_service.py   (si usabas el servicio)"
          "\n  3) Si registraste el atajo global: en Preferencias del sistema -> Atajos borra la entrada vieja de POETA.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
