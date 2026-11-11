import importlib.util
from pathlib import Path

import pytest

SPEC = importlib.util.spec_from_file_location("kde_sc", Path(__file__).resolve().parent.parent / "scripts" / "install_kde_shortcuts.py")
sc = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(sc)


def test_install_writes_desktop_files_and_registers_keys(tmp_path, monkeypatch):
    monkeypatch.setattr(sc, "_kwrite", lambda: "/usr/bin/kwriteconfig6")
    calls = []
    ok = sc.install({"talk": "Ctrl+Alt+Space", "stop": "Meta+H"}, tmp_path, root=Path("/opt/piantao"),
                    run=lambda c: calls.append(c) or True, out=lambda *_: None)
    assert ok
    talk = (tmp_path / ".local/share/applications/piantao-talk.desktop").read_text()
    stop = (tmp_path / ".local/share/applications/piantao-stop.desktop").read_text()
    assert "X-KDE-GlobalAccel-CommandShortcut=true" in talk and "Exec=" in talk
    assert talk.splitlines()[4].endswith("/opt/piantao/scripts/talk.py") and "--stop" in stop
    assert ["/usr/bin/kwriteconfig6", "--file", "kglobalshortcutsrc", "--group", "services", "--group", "piantao-talk.desktop",
            "--key", "_launch", "Ctrl+Alt+Space"] in calls
    assert any(c[-1] == "Meta+H" for c in calls) and ["kbuildsycoca6"] in calls
    assert ["systemctl", "--user", "restart", "plasma-kglobalaccel.service"] in calls


def test_install_reports_failure_without_kwriteconfig_or_on_error(tmp_path, monkeypatch):
    monkeypatch.setattr(sc, "_kwrite", lambda: None)
    assert sc.install({"talk": "Ctrl+Alt+Space"}, tmp_path, run=lambda c: True, out=lambda *_: None) is False
    assert (tmp_path / ".local/share/applications/piantao-talk.desktop").exists()  # igual deja el .desktop para asignarlo a mano
    monkeypatch.setattr(sc, "_kwrite", lambda: "/x/kwriteconfig6")
    assert sc.install({"talk": "Ctrl+Alt+Space"}, tmp_path, run=lambda c: False, out=lambda *_: None) is False


def test_remove_and_key_validation(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(sc, "_kwrite", lambda: "/x/kwriteconfig6")
    sc.install({"talk": "Ctrl+Alt+Space"}, tmp_path, run=lambda c: True, out=lambda *_: None)
    calls = []
    sc.remove(tmp_path, run=lambda c: calls.append(c) or True, out=lambda *_: None)
    assert not (tmp_path / ".local/share/applications/piantao-talk.desktop").exists()
    assert any("--delete" in c for c in calls)
    assert sc.main(["--talk-key", "Ctrl;rm -rf", "--home", str(tmp_path)]) == 2
