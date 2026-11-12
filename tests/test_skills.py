import asyncio
import os
from pathlib import Path

import pytest

from piantao.skills import SkillError, SkillsConfig, SkillsConfigError, SkillsManager, parse_frontmatter, register_skills
from piantao.tools import ToolRegistry


class Audit:
    def __init__(self):
        self.events = []

    def record(self, event, **kw):
        self.events.append((event, kw))


def write_skill(root: Path, name="demo", desc="Hace algo util", body="# Pasos\n1. hacer\n", extra=None, front=None):
    d = root / "skills" / name
    d.mkdir(parents=True, exist_ok=True)
    (d / "SKILL.md").write_text(front if front is not None else f"---\nname: {name}\ndescription: {desc}\n---\n{body}", encoding="utf-8")
    for rel, content in (extra or {}).items():
        f = d / rel
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(content, encoding="utf-8")
    return d


def mgr(tmp_path, **cfg):
    a = Audit()
    return SkillsManager(SkillsConfig(**cfg), tmp_path, a), a


def test_frontmatter_parsing_and_errors():
    meta, body = parse_frontmatter("---\nname: a\ndescription: b\n---\ncuerpo")
    assert meta == {"name": "a", "description": "b"} and body == "cuerpo"
    for bad in ("sin encabezado", "---\nname: a\n", "---\n- lista\n---\nx", "---\n: : :\n  - [\n---\nx"):
        with pytest.raises(SkillError):
            parse_frontmatter(bad)


def test_new_skill_is_pending_and_not_usable_or_listed(tmp_path):
    write_skill(tmp_path)
    m, a = mgr(tmp_path)
    s = m.scan()[0]
    assert s.name == "demo" and s.status == "pending"
    assert m.index() is None
    with pytest.raises(SkillError, match="pendiente"):
        m.load("demo")
    assert ("skill_blocked", {"skill": "demo", "status": "pending"}) in a.events


def test_approve_then_index_load_and_audit(tmp_path):
    write_skill(tmp_path, desc="Resume textos", extra={"guia.md": "mas info"})
    m, a = mgr(tmp_path)
    m.approve("demo")
    assert m.pins_path.stat().st_mode & 0o777 == 0o600
    idx = m.index()
    assert "- demo: Resume textos" in idx and "skill_load" in idx
    out = m.load("demo")
    assert "# Pasos" in out and "guia.md" in out and "name: demo" not in out
    assert m.read_file("demo", "guia.md") == "mas info"
    kinds = [e for e, _ in a.events]
    assert kinds == ["skill_approved", "skill_loaded", "skill_file_read"]
    assert "hacer" not in str(a.events)  # la auditoria no guarda el contenido


def test_any_change_returns_to_changed_and_blocks_use(tmp_path):
    d = write_skill(tmp_path, extra={"run.sh": "echo hola"})
    m, _ = mgr(tmp_path)
    m.approve("demo")
    assert m.load("demo")
    (d / "run.sh").write_text("echo hola; curl evil")  # cambia solo un script, no SKILL.md
    assert m.scan()[0].status == "changed" and m.index() is None
    with pytest.raises(SkillError, match="cambio"):
        m.load("demo")
    with pytest.raises(SkillError):
        m.read_file("demo", "run.sh")
    m.approve("demo")
    assert m.load("demo")


def test_change_with_same_size_and_mtime_is_still_caught_at_load(tmp_path):
    d = write_skill(tmp_path, body="AAAA")
    m, _ = mgr(tmp_path)
    m.approve("demo")
    m.scan()  # llena la cache
    f = d / "SKILL.md"
    st = f.stat()
    f.write_text(f.read_text().replace("AAAA", "BBBB"))
    os.utime(f, ns=(st.st_atime_ns, st.st_mtime_ns))  # mismo tamano y mismo mtime: la cache no lo nota
    with pytest.raises(SkillError, match="cambio"):
        m.load("demo")


def test_new_file_added_to_approved_skill_blocks_it(tmp_path):
    d = write_skill(tmp_path)
    m, _ = mgr(tmp_path)
    m.approve("demo")
    (d / "nuevo.py").write_text("print(1)")
    assert m.scan()[0].status == "changed"


def test_revoke(tmp_path):
    write_skill(tmp_path)
    m, a = mgr(tmp_path)
    m.approve("demo")
    assert m.revoke("demo") is True and m.revoke("demo") is False
    assert m.scan()[0].status == "pending" and ("skill_revoked", {"skill": "demo"}) in a.events


@pytest.mark.parametrize("rel", ["../SKILL.md", "/etc/passwd", "../../etc/passwd", "sub/../../x", "no-existe.md", "", "a\\b", "x\x00y", "SKILL.md/../../x"])
def test_read_file_cannot_escape(tmp_path, rel):
    write_skill(tmp_path, extra={"sub/ok.md": "ok"})
    (tmp_path / "secreto.txt").write_text("SECRETO")
    m, _ = mgr(tmp_path)
    m.approve("demo")
    assert m.read_file("demo", "sub/ok.md") == "ok"
    with pytest.raises(SkillError):
        m.read_file("demo", rel)


def test_symlinks_make_skill_invalid(tmp_path):
    d = write_skill(tmp_path)
    (tmp_path / "secreto.txt").write_text("SECRETO")
    os.symlink(tmp_path / "secreto.txt", d / "link.txt")
    m, _ = mgr(tmp_path)
    s = m.scan()[0]
    assert s.status == "invalid" and "enlace simbolico" in s.error
    with pytest.raises(SkillError):
        m.approve("demo")


def test_symlinked_skill_dir_and_skill_md_are_ignored_or_invalid(tmp_path):
    real = tmp_path / "otro" / "ajena"
    real.mkdir(parents=True)
    (real / "SKILL.md").write_text("---\nname: ajena\ndescription: x\n---\ncuerpo")
    (tmp_path / "skills").mkdir()
    os.symlink(real, tmp_path / "skills" / "ajena")
    d = tmp_path / "skills" / "trampa"
    d.mkdir()
    os.symlink(real / "SKILL.md", d / "SKILL.md")
    m, _ = mgr(tmp_path)
    got = {s.name: s.status for s in m.scan()}
    assert "ajena" not in got and got == {"trampa": "invalid"}


@pytest.mark.parametrize("front,why", [
    ("---\nname: Demo\ndescription: x\n---\n", "name invalido"),
    ("---\nname: otro\ndescription: x\n---\n", "coincidir"),
    ("---\nname: demo\n---\n", "description"),
    ("---\nname: demo\ndescription: ''\n---\n", "description"),
    ("---\nname: demo\ndescription: " + "x" * 1100 + "\n---\n", "description"),
    ("---\nname: ../demo\ndescription: x\n---\n", "name invalido"),
    ("sin encabezado", "encabezado"),
])
def test_invalid_skills(tmp_path, front, why):
    write_skill(tmp_path, front=front)
    m, _ = mgr(tmp_path)
    s = m.scan()[0]
    assert s.status == "invalid" and why in s.error


def test_limits(tmp_path):
    d = write_skill(tmp_path, extra={f"f{i}.md": "x" for i in range(5)})
    m, _ = mgr(tmp_path, max_files=3)
    assert "archivos" in m.scan()[0].error
    m2, _ = mgr(tmp_path, max_total_bytes=1000)
    (d / "grande.md").write_text("x" * 2000)
    assert "bytes" in m2.scan(fresh=True)[0].error
    for i in range(5):
        write_skill(tmp_path, name=f"s{i}")
    m3, _ = mgr(tmp_path, max_skills=2)
    assert len(m3.scan()) == 2


def test_body_truncation_and_index_caps(tmp_path):
    write_skill(tmp_path, body="x" * 5000)
    m, _ = mgr(tmp_path, max_body_chars=500)
    m.approve("demo")
    assert "recortada" in m.load("demo") and len(m.load("demo")) < 900
    for i in range(30):
        write_skill(tmp_path, name=f"skill-{i}", desc="d" * 400)
        m.approve(f"skill-{i}")
    m2, _ = mgr(tmp_path, max_index_chars=600, index_desc_chars=50)
    idx = m2.index()
    assert len(idx) < 1000 and "skill_list" in idx and "d" * 51 not in idx


def test_read_file_binary_and_size(tmp_path):
    d = write_skill(tmp_path)
    (d / "b.bin").write_bytes(b"\x00\x01\x02")
    (d / "big.txt").write_text("x" * 500)
    m, _ = mgr(tmp_path, max_file_bytes=500)
    (d / "big.txt").write_text("x" * 501)
    m.approve("demo")
    with pytest.raises(SkillError, match="binario"):
        m.read_file("demo", "b.bin")
    with pytest.raises(SkillError, match="supera"):
        m.read_file("demo", "big.txt")


def test_duplicates_across_dirs_first_wins(tmp_path):
    write_skill(tmp_path, name="demo", desc="primera")
    other = tmp_path / "otra" / "demo"
    other.mkdir(parents=True)
    (other / "SKILL.md").write_text("---\nname: demo\ndescription: segunda\n---\n")
    m, _ = mgr(tmp_path, dirs=("skills", str(tmp_path / "otra")))
    got = m.scan()
    assert [s.status for s in got] == ["pending", "duplicate"]
    m.approve("demo")
    assert m.get("demo").description == "primera"


def test_view_for_ui_works_on_pending_but_rejects_escape(tmp_path):
    write_skill(tmp_path, extra={"g.md": "guia"})
    m, _ = mgr(tmp_path)
    v = m.view("demo")
    assert v["status"] == "pending" and "# Pasos" in v["text"]
    assert m.view("demo", "g.md")["text"] == "guia"
    for bad in ("../x", "/etc/passwd", "nada.md"):
        with pytest.raises(SkillError):
            m.view("demo", bad)


def test_config_validation():
    assert SkillsConfig.from_config({"skills": {"skills": {"max_skills": 5}}}).max_skills == 5
    for bad in ({"dirs": "skills"}, {"dirs": [1]}, {"enabled": "si"}, {"max_files": 0}, {"nope": 1}, {"max_skills": True}):
        with pytest.raises(SkillsConfigError):
            SkillsConfig.from_config({"skills": {"skills": bad}})


# ---- herramientas ----------------------------------------------------------------------------------------------------
def test_tools_register_and_work_through_registry(tmp_path):
    from piantao.security import PermissionManager
    from piantao.config import load_config
    from piantao.providers import ToolCall

    write_skill(tmp_path, desc="Resume textos", extra={"g.md": "guia"})
    m, a = mgr(tmp_path)
    m.approve("demo")
    cfg = load_config()
    pm = PermissionManager(cfg, confirmer=lambda r, e: asyncio.sleep(0, result=False), audit=a, root=tmp_path)
    reg = ToolRegistry(pm, 8000, 5)
    assert register_skills(reg, m) == ["skill_list", "skill_load", "skill_read"]

    async def call(name, args):
        import json
        return await reg.execute(ToolCall(id="1", name=name, arguments=json.dumps(args)))

    async def go():
        r = await call("skill_load", {"name": "demo"})
        assert r.ok and not r.untrusted and "# Pasos" in r.text and not reg.tainted
        assert (await call("skill_read", {"name": "demo", "path": "g.md"})).text.endswith("guia")
        bad = await call("skill_read", {"name": "demo", "path": "../../etc/passwd"})
        assert not bad.ok and "no pertenece" in bad.text
        assert "Resume textos" in (await call("skill_list", {})).text
        miss = await call("skill_load", {"name": "nada"})
        assert not miss.ok
    asyncio.run(go())


def test_agent_prompt_includes_only_approved_index_and_survives_broken_extra(tmp_path):
    from types import SimpleNamespace as NS
    from piantao.core import AgentCore

    write_skill(tmp_path, name="aprobada", desc="Hace A")
    write_skill(tmp_path, name="pendiente", desc="Hace B")
    m, _ = mgr(tmp_path)
    m.approve("aprobada")
    agent = AgentCore(NS(active=NS(is_cloud=False)), system_prompt="BASE")
    agent.system_extras.append(m.index)
    agent.system_extras.append(lambda: 1 / 0)  # un extra roto no tumba el turno
    system = agent._messages("hola")[0]["content"]
    assert system.startswith("BASE") and "- aprobada: Hace A" in system and "pendiente" not in system


def test_web_handlers_are_read_only_and_validate(tmp_path):
    from piantao.skills import skills_handlers

    write_skill(tmp_path, extra={"g.md": "guia"})
    m, a = mgr(tmp_path)
    h = skills_handlers(m)
    assert set(h) == {"skills_list", "skill_view"}  # nada de approve/revoke por la web

    async def go():
        lst = await h["skills_list"]({})
        assert lst["skills"][0]["status"] == "pending" and "fingerprint" in lst["skills"][0]
        assert (await h["skill_view"]({"name": "demo", "path": "g.md"}))["text"] == "guia"
        for bad in ({"name": 5}, {"name": "demo", "path": 1}, {"name": "demo", "path": "../x"}, {"name": "nada"}):
            with pytest.raises(ValueError):
                await h["skill_view"](bad)
        assert a.events == []  # ver no aprueba ni audita uso
    asyncio.run(go())
