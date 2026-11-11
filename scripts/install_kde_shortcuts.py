#!/usr/bin/env python3
"""Crea atajos GLOBALES de KDE que llaman a scripts/talk.py (no dependen del portal XDG, que en algunos equipos no entrega la senal).

    python3 scripts/install_kde_shortcuts.py                         # hablar = Ctrl+Alt+Space
    python3 scripts/install_kde_shortcuts.py --talk-key "Meta+H" --stop-key "Meta+Shift+H"
    python3 scripts/install_kde_shortcuts.py --remove

Escribe ~/.local/share/applications/piantao-talk.desktop (y piantao-stop.desktop si pides --stop-key) y registra la tecla en
kglobalshortcutsrc con kwriteconfig6. Despues recarga KDE; si no queda activo al instante, cierra sesion y vuelve a entrar
o asigna la tecla a mano en Preferencias del sistema -> Atajos -> (entrada "Piantao: hablar").
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
_KEY = re.compile(r"^[A-Za-z0-9_+ ]{1,40}$")
ENTRIES = {"talk": ("Piantao: hablar", "talk.py", []), "stop": ("Piantao: callar", "talk.py", ["--stop"])}


def desktop_text(name: str, script: Path, extra: list[str]) -> str:
    exec_line = " ".join([shutil.which("python3") or "/usr/bin/python3", str(script), *extra])
    return (f"[Desktop Entry]\nType=Application\nName={name}\nComment=Controla a Piantao con un atajo global\n"
            f"Exec={exec_line}\nTerminal=false\nNoDisplay=true\nX-KDE-GlobalAccel-CommandShortcut=true\n"
            f"Icon=audio-input-microphone\n")


def _run(cmd: list[str]) -> bool:
    try:
        return subprocess.run(cmd, capture_output=True, timeout=30).returncode == 0
    except (OSError, subprocess.SubprocessError):
        return False


def _kwrite() -> str | None:
    return shutil.which("kwriteconfig6") or shutil.which("kwriteconfig5")


def install(keys: dict[str, str], home: Path, root: Path = ROOT, run=_run, out=print) -> bool:
    apps = home / ".local" / "share" / "applications"
    apps.mkdir(parents=True, exist_ok=True)
    kw = _kwrite()
    ok = True
    for which, key in keys.items():
        name, script, extra = ENTRIES[which]
        fname = f"piantao-{which}.desktop"
        (apps / fname).write_text(desktop_text(name, root / "scripts" / script, extra), encoding="utf-8")
        out(f"  escrito {apps / fname}")
        if kw is None:
            out("  !! no encontre kwriteconfig6: asigna la tecla a mano (ver arriba)")
            ok = False
            continue
        good = run([kw, "--file", "kglobalshortcutsrc", "--group", "services", "--group", fname, "--key", "_launch", key])
        out(f"  tecla {key} para '{name}': {'registrada' if good else 'NO se pudo registrar'}")
        ok = ok and good
    run(["kbuildsycoca6"])
    run(["systemctl", "--user", "restart", "plasma-kglobalaccel.service"])
    return ok


def remove(home: Path, run=_run, out=print) -> None:
    kw = _kwrite()
    for which in ENTRIES:
        fname = f"piantao-{which}.desktop"
        f = home / ".local" / "share" / "applications" / fname
        if f.exists():
            f.unlink()
            out(f"  eliminado {f}")
        if kw:
            run([kw, "--file", "kglobalshortcutsrc", "--group", "services", "--group", fname, "--key", "_launch", "--delete"])
    run(["kbuildsycoca6"])
    run(["systemctl", "--user", "restart", "plasma-kglobalaccel.service"])


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--talk-key", default="Ctrl+Alt+Space")
    ap.add_argument("--stop-key", default="")
    ap.add_argument("--remove", action="store_true")
    ap.add_argument("--home", default=str(Path.home()), help=argparse.SUPPRESS)
    a = ap.parse_args(argv)
    home = Path(a.home)
    if a.remove:
        remove(home)
        return 0
    keys = {"talk": a.talk_key, **({"stop": a.stop_key} if a.stop_key else {})}
    for k in keys.values():
        if not _KEY.match(k):
            print(f"Tecla invalida: {k!r} (ej. Ctrl+Alt+Space, Meta+H)", file=sys.stderr)
            return 2
    ok = install(keys, home)
    print("\nListo. Con Piantao corriendo (voice), prueba la tecla." if ok else
          "\nQuedo a medias: abre Preferencias del sistema -> Atajos, busca 'Piantao: hablar' y asignale una tecla.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
