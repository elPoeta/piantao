import importlib.util
from pathlib import Path

import pytest
import yaml

SPEC = importlib.util.spec_from_file_location("migrate_from_poeta", Path(__file__).resolve().parent.parent / "scripts" / "migrate_from_poeta.py")
mig = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mig)


@pytest.mark.parametrize("old,new", [
    ("POETA", "Piantao"), ("Poeta", "Piantao"), ("poeta", "piantao"), ("P.O.E.T.A.", "Piantao"),
    ("${POETA_HOME:-~/AI/poeta}", "${PIANTAO_HOME:-~/AI/piantao}"), ("org.poeta.Assistant", "org.piantao.Assistant"),
    ("P.O.E.T.A. - Personal Offline Executive & Thinking Assistant", "Piantao - asistente personal local"),
    ("P.O.E.T.A. (Personal Offline Executive & Thinking Assistant) sera", "Piantao sera"),
    ("socket: $XDG_RUNTIME_DIR/poeta/ui.sock", "socket: $XDG_RUNTIME_DIR/piantao/ui.sock"),
    ("la poesia es bonita", "la poesia es bonita"),  # no es el nombre
])
def test_rename_text(old, new):
    assert mig.rename_text(old) == new


def make_install(tmp_path):
    root, home = tmp_path / "piantao", tmp_path / "home"
    (root / "config").mkdir(parents=True)
    (root / "logs").mkdir()
    (root / "piantao").mkdir()
    (root / "piantao" / "__init__.py").write_text("")
    (root / "poeta").mkdir()
    (root / "poeta" / "__init__.py").write_text("")
    (root / "config" / "voice.yaml").write_text(
        'wake_word:\n  phrase: poeta\n  aliases: [boeta, poetas]  # como la transcribe Whisper\n  threshold: 0.8\n', encoding="utf-8")
    (root / "config" / "settings.yaml").write_text('assistant:\n  name: "POETA"\npaths:\n  poeta_home: "${POETA_HOME:-~/AI/poeta}"\n')
    (root / "config" / "portals.yaml").write_text("app_id: org.poeta.Assistant\nenabled: true\n")
    (root / ".env").write_text("POETA_HOME=/x\nOPENAI_API_KEY=sk-1\n")
    (root / "logs" / "poeta.log").write_text("historial\n")
    (home / ".config/systemd/user").mkdir(parents=True)
    (home / ".config/systemd/user/poeta.service").write_text("[Unit]\n")
    (home / ".local/share/applications").mkdir(parents=True)
    (home / ".local/share/applications/org.poeta.Assistant.desktop").write_text("[Desktop Entry]\n")
    return root, home


def test_plan_apply_and_idempotent(tmp_path, monkeypatch):
    root, home = make_install(tmp_path)
    monkeypatch.setattr(mig, "_systemctl", lambda *a: None)
    acts = mig.plan(root, home)
    assert {a[0] for a in acts} == {"edit", "move", "rmtree", "service", "remove"}
    assert (root / "poeta").exists()  # el plan no cambia nada
    mig.apply(acts, root, out=lambda *_: None)
    voice = yaml.safe_load((root / "config" / "voice.yaml").read_text())["wake_word"]
    assert voice["phrase"] == "piantao" and voice["aliases"] == ["piantado", "pianto", "piantau"] and voice["threshold"] == 0.8
    assert yaml.safe_load((root / "config/settings.yaml").read_text())["assistant"]["name"] == "Piantao"
    assert "PIANTAO_HOME" in (root / ".env").read_text() and "OPENAI_API_KEY=sk-1" in (root / ".env").read_text()
    assert "org.piantao.Assistant" in (root / "config/portals.yaml").read_text()
    assert (root / "config/voice.yaml.bak-poeta").exists() and "poeta" in (root / "config/voice.yaml.bak-poeta").read_text()
    assert (root / "logs/piantao.log").read_text() == "historial\n" and not (root / "logs/poeta.log").exists()
    assert not (root / "poeta").exists() and (root / "piantao").exists()
    assert not (home / ".config/systemd/user/poeta.service").exists()
    assert not (home / ".local/share/applications/org.poeta.Assistant.desktop").exists()
    assert mig.plan(root, home) == []  # ya migrado: no hay nada mas que hacer


def test_old_package_dir_kept_if_new_one_missing(tmp_path):
    root, home = make_install(tmp_path)
    (root / "piantao" / "__init__.py").unlink()
    assert "rmtree" not in {a[0] for a in mig.plan(root, home)}


def test_main_dry_run_changes_nothing(tmp_path, monkeypatch, capsys):
    root, home = make_install(tmp_path)
    monkeypatch.setattr(mig, "ROOT", root)
    assert mig.main(["--dry-run", "--home", str(home)]) == 0
    assert "[simulacion]" in capsys.readouterr().out
    assert (root / "poeta").exists() and "poeta" in (root / "config/voice.yaml").read_text()
