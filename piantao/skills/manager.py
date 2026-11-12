"""Skills: carpetas con un SKILL.md (formato de las skills de Claude) que le ensenan al agente a hacer algo concreto.

Carga progresiva: al modelo solo se le muestra nombre + descripcion; el cuerpo entra al contexto cuando llama a `skill_load`.
Una skill es TEXTO QUE LE DA INSTRUCCIONES AL MODELO, asi que es un vector de inyeccion y se trata como el codigo de un servidor MCP:
- solo se leen carpetas que el usuario autoriza en config/skills.yaml;
- cada skill tiene una huella (hash de todos sus archivos) que debe aprobarse con `python main.py skills approve NOMBRE`;
  si cambia un solo byte vuelve a pendiente y deja de ofrecerse; ni el modelo ni la web pueden aprobar;
- no se siguen enlaces simbolicos, hay limites de tamano y cantidad, y toda lectura se verifica contra la huella en el momento de usarla;
- una skill no sube permisos: sus scripts solo corren por `run_command`, con lista blanca y confirmacion como cualquier comando.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import time
from dataclasses import dataclass, field
from pathlib import Path, PurePosixPath
from typing import Any, Callable

import yaml

NAME_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
SKILL_FILE = "SKILL.md"


class SkillsConfigError(ValueError):
    pass


class SkillError(Exception):
    """Fallo esperable al usar una skill; el mensaje se le devuelve al modelo o al usuario."""


@dataclass(frozen=True)
class SkillsConfig:
    enabled: bool = True
    dirs: tuple[str, ...] = ("skills",)
    max_skills: int = 50
    max_files: int = 100
    max_total_bytes: int = 2_000_000
    max_body_chars: int = 20_000
    max_file_bytes: int = 100_000
    index_desc_chars: int = 160
    max_index_chars: int = 3000

    @classmethod
    def from_config(cls, cfg: dict[str, Any]) -> "SkillsConfig":
        raw = (cfg.get("skills") or {}).get("skills") or {}
        if not isinstance(raw, dict):
            raise SkillsConfigError("skills.yaml: 'skills' debe ser un mapa")
        known = set(cls.__dataclass_fields__)
        if set(raw) - known:
            raise SkillsConfigError(f"skills.yaml: claves desconocidas {sorted(set(raw) - known)}")
        d = cls()
        dirs = raw.get("dirs", list(d.dirs))
        if not isinstance(dirs, list) or not all(isinstance(x, str) and x.strip() for x in dirs):
            raise SkillsConfigError("skills.yaml: dirs debe ser una lista de carpetas")
        enabled = raw.get("enabled", True)
        if not isinstance(enabled, bool):
            raise SkillsConfigError("skills.yaml: enabled debe ser true o false")
        nums: dict[str, int] = {}
        for key, lo, hi in (("max_skills", 1, 500), ("max_files", 1, 1000), ("max_total_bytes", 1000, 50_000_000),
                            ("max_body_chars", 500, 200_000), ("max_file_bytes", 500, 5_000_000),
                            ("index_desc_chars", 40, 500), ("max_index_chars", 200, 20_000)):
            v = raw.get(key, getattr(d, key))
            if isinstance(v, bool) or not isinstance(v, int) or not lo <= v <= hi:
                raise SkillsConfigError(f"skills.yaml: {key} debe ser un entero entre {lo} y {hi}")
            nums[key] = v
        return cls(enabled=enabled, dirs=tuple(dirs), **nums)


@dataclass
class SkillInfo:
    name: str
    path: Path
    status: str  # approved | pending | changed | invalid | duplicate
    description: str = ""
    fingerprint: str = ""
    files: list[tuple[str, int]] = field(default_factory=list)
    error: str = ""

    def public(self) -> dict[str, Any]:
        return {"name": self.name, "status": self.status, "description": self.description, "fingerprint": self.fingerprint[:16],
                "files": [{"path": p, "bytes": n} for p, n in self.files], "error": self.error}


def parse_frontmatter(text: str) -> tuple[dict[str, Any], str]:
    if not text.startswith("---"):
        raise SkillError("SKILL.md debe empezar con un encabezado '---' con name y description")
    m = re.match(r"^---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)", text, re.S)
    if not m:
        raise SkillError("el encabezado de SKILL.md no se cierra con '---'")
    try:
        meta = yaml.safe_load(m.group(1)) or {}
    except yaml.YAMLError as exc:
        raise SkillError(f"encabezado YAML invalido: {exc}") from exc
    if not isinstance(meta, dict):
        raise SkillError("el encabezado de SKILL.md debe ser un mapa")
    return meta, text[m.end():]


def fingerprint_of(files: dict[str, bytes]) -> str:
    h = hashlib.sha256()
    for rel in sorted(files):
        h.update(rel.encode("utf-8") + b"\0" + hashlib.sha256(files[rel]).digest())
    return h.hexdigest()


class SkillsManager:
    def __init__(self, cfg: SkillsConfig, root: Path | str, audit: Any = None):
        self.cfg, self.root, self.audit = cfg, Path(root), audit
        self.pins_path = self.root / "data" / "skills_pins.json"
        self._cache: dict[Path, tuple[tuple, SkillInfo]] = {}

    # -- auditoria / pins -----------------------------------------------------------------------------------------
    def _audit(self, event: str, **fields: Any) -> None:
        if self.audit is not None:
            try:
                self.audit.record(event, **fields)
            except Exception:  # noqa: BLE001 - la auditoria no debe romper el uso, pero tampoco se oculta en logs
                import logging
                logging.getLogger("piantao.skills").exception("no se pudo auditar %s", event)

    def _pins(self) -> dict[str, Any]:
        try:
            data = json.loads(self.pins_path.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except (OSError, ValueError):
            return {}

    def _write_pins(self, pins: dict[str, Any]) -> None:
        self.pins_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = self.pins_path.with_suffix(".tmp")
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(pins, f, indent=2, ensure_ascii=False)
        os.replace(tmp, self.pins_path)

    # -- carpetas autorizadas ------------------------------------------------------------------------------------
    def _dirs(self) -> list[Path]:
        out = []
        for d in self.cfg.dirs:
            p = Path(d).expanduser()
            out.append(p if p.is_absolute() else self.root / p)
        return out

    def _collect(self, d: Path) -> dict[str, bytes]:
        files: dict[str, bytes] = {}
        total = 0
        stack = [(d, "")]
        while stack:
            cur, prefix = stack.pop()
            try:
                entries = sorted(os.scandir(cur), key=lambda e: e.name)
            except OSError as exc:
                raise SkillError(f"no se pudo leer {cur}: {exc.strerror}") from exc
            for e in entries:
                rel = f"{prefix}{e.name}"
                if e.is_symlink():
                    raise SkillError(f"contiene un enlace simbolico ({rel}); no se permiten")
                if e.is_dir(follow_symlinks=False):
                    stack.append((Path(e.path), rel + "/"))
                elif e.is_file(follow_symlinks=False):
                    if len(files) >= self.cfg.max_files:
                        raise SkillError(f"mas de {self.cfg.max_files} archivos")
                    size = e.stat(follow_symlinks=False).st_size
                    total += size
                    if total > self.cfg.max_total_bytes:
                        raise SkillError(f"supera {self.cfg.max_total_bytes} bytes en total")
                    with open(e.path, "rb") as f:
                        files[rel] = f.read()
                else:
                    raise SkillError(f"archivo especial no permitido ({rel})")
        return files

    def _signature(self, d: Path) -> tuple:
        sig = []
        try:
            for dirpath, dirnames, filenames in os.walk(d, followlinks=False):
                for n in sorted(dirnames + filenames):
                    st = os.lstat(os.path.join(dirpath, n))
                    sig.append((os.path.relpath(os.path.join(dirpath, n), d), st.st_mode, st.st_size, st.st_mtime_ns))
        except OSError:
            return (None,)
        return tuple(sig)

    def _inspect(self, d: Path, files: dict[str, bytes] | None = None) -> tuple[SkillInfo, dict[str, bytes] | None]:
        name = d.name
        try:
            files = files if files is not None else self._collect(d)
            if SKILL_FILE not in files:
                raise SkillError("falta SKILL.md")
            try:
                text = files[SKILL_FILE].decode("utf-8")
            except UnicodeDecodeError as exc:
                raise SkillError("SKILL.md no es UTF-8") from exc
            meta, _body = parse_frontmatter(text)
            if not isinstance(meta.get("name"), str) or not NAME_RE.match(meta["name"]):
                raise SkillError("name invalido: solo minusculas, numeros y guiones (max. 64)")
            if meta["name"] != name:
                raise SkillError(f"name ('{meta['name']}') debe coincidir con la carpeta ('{name}')")
            desc = meta.get("description")
            if not isinstance(desc, str) or not desc.strip() or len(desc) > 1024:
                raise SkillError("description es obligatoria (texto de hasta 1024 caracteres)")
        except SkillError as exc:
            return SkillInfo(name=name, path=d, status="invalid", error=str(exc)), None
        fp = fingerprint_of(files)
        pin = self._pins().get(name)
        status = "pending" if not pin else "approved" if pin.get("fingerprint") == fp else "changed"
        info = SkillInfo(name=name, path=d, status=status, description=" ".join(desc.split()), fingerprint=fp,
                         files=sorted((p, len(b)) for p, b in files.items()))
        return info, files

    def scan(self, fresh: bool = False) -> list[SkillInfo]:
        out: list[SkillInfo] = []
        seen: set[str] = set()
        for base in self._dirs():
            try:
                kids = sorted(p for p in base.iterdir() if p.is_dir() and not p.is_symlink() and not p.name.startswith("."))
            except OSError:
                continue
            for d in kids:
                if not (d / SKILL_FILE).exists() and not (d / SKILL_FILE).is_symlink():
                    continue
                if len(out) >= self.cfg.max_skills:
                    return out
                sig = self._signature(d)
                hit = self._cache.get(d)
                if hit and hit[0] == sig and not fresh:
                    info = hit[1]
                    info = self._restatus(info)
                else:
                    info, _ = self._inspect(d)
                    self._cache[d] = (sig, info)
                if info.name in seen:
                    info = SkillInfo(name=info.name, path=d, status="duplicate", error="nombre repetido en otra carpeta autorizada")
                seen.add(info.name)
                out.append(info)
        return out

    def _restatus(self, info: SkillInfo) -> SkillInfo:
        """El estado depende de los pins (que pueden cambiar sin tocar la carpeta): se recalcula siempre."""
        if info.status in ("invalid", "duplicate"):
            return info
        pin = self._pins().get(info.name)
        info.status = "pending" if not pin else "approved" if pin.get("fingerprint") == info.fingerprint else "changed"
        return info

    def get(self, name: str, fresh: bool = False) -> SkillInfo:
        for s in self.scan(fresh):
            if s.name == name:
                return s
        raise SkillError(f"no existe la skill '{name}'")

    # -- aprobacion (solo CLI) -------------------------------------------------------------------------------------
    def read_body(self, name: str) -> str:
        info = self.get(name, fresh=True)
        if info.status == "invalid":
            raise SkillError(info.error)
        text = (info.path / SKILL_FILE).read_text(encoding="utf-8")
        return parse_frontmatter(text)[1]

    def approve(self, name: str) -> SkillInfo:
        info = self.get(name, fresh=True)
        if info.status in ("invalid", "duplicate"):
            raise SkillError(f"no se puede aprobar: {info.error}")
        pins = self._pins()
        pins[name] = {"fingerprint": info.fingerprint, "approved_at": int(time.time()), "files": len(info.files)}
        self._write_pins(pins)
        self._audit("skill_approved", skill=name, fingerprint=info.fingerprint, files=len(info.files))
        info.status = "approved"
        return info

    def revoke(self, name: str) -> bool:
        pins = self._pins()
        if pins.pop(name, None) is None:
            return False
        self._write_pins(pins)
        self._audit("skill_revoked", skill=name)
        return True

    # -- uso por el modelo ---------------------------------------------------------------------------------------------
    def approved(self) -> list[SkillInfo]:
        return [s for s in self.scan() if s.status == "approved"]

    def index(self) -> str | None:
        """Texto para el prompt del sistema: solo nombre + descripcion de las skills aprobadas, con tope de tamano."""
        if not self.cfg.enabled:
            return None
        lines, used = [], 0
        for s in self.approved():
            desc = s.description if len(s.description) <= self.cfg.index_desc_chars else s.description[: self.cfg.index_desc_chars - 3] + "..."
            line = f"- {s.name}: {desc}"
            if used + len(line) > self.cfg.max_index_chars:
                lines.append("- (hay mas skills; usa skill_list)")
                break
            lines.append(line)
            used += len(line) + 1
        if not lines:
            return None
        return ("Skills disponibles (instrucciones aprobadas por el usuario). Si la tarea coincide con una, "
                "llama a skill_load con su nombre ANTES de actuar y segui sus pasos:\n" + "\n".join(lines))

    def _verified(self, name: str) -> tuple[SkillInfo, dict[str, bytes]]:
        """Relee TODA la carpeta y compara con la huella aprobada: lo que se usa es exactamente lo aprobado."""
        if not isinstance(name, str) or not NAME_RE.match(name):
            raise SkillError("nombre de skill invalido")
        match = next((s for s in self.scan() if s.name == name), None)
        if match is None:
            raise SkillError(f"no existe la skill '{name}'")
        info, files = self._inspect(match.path)
        if info.status != "approved" or files is None:
            self._audit("skill_blocked", skill=name, status=info.status)
            why = {"pending": "esta pendiente de aprobacion", "changed": "cambio desde que se aprobo",
                   "invalid": f"es invalida ({info.error})"}.get(info.status, info.status)
            raise SkillError(f"la skill '{name}' no se puede usar: {why}. El usuario debe revisarla y aprobarla con "
                             f"`python main.py skills approve {name}`.")
        return info, files

    def load(self, name: str) -> str:
        info, files = self._verified(name)
        _meta, body = parse_frontmatter(files[SKILL_FILE].decode("utf-8"))
        body = body.strip()
        note = ""
        if len(body) > self.cfg.max_body_chars:
            body, note = body[: self.cfg.max_body_chars], "\n[... skill recortada por tamano]"
        extra = [p for p, _ in info.files if p != SKILL_FILE]
        self._audit("skill_loaded", skill=name, fingerprint=info.fingerprint, chars=len(body))
        head = f"[SKILL '{name}' aprobada por el usuario. Carpeta: {info.path}]"
        if extra:
            head += f"\nArchivos disponibles con skill_read: {', '.join(extra[:40])}" + (" ..." if len(extra) > 40 else "")
        return f"{head}\n\n{body}{note}"

    def read_file(self, name: str, rel: str) -> str:
        info, files = self._verified(name)
        if not isinstance(rel, str) or not rel or "\x00" in rel or "\\" in rel:
            raise SkillError("ruta invalida")
        p = PurePosixPath(rel)
        if p.is_absolute() or ".." in p.parts or str(p) not in files:
            raise SkillError("ese archivo no pertenece a la skill (rutas relativas a su carpeta, sin '..')")
        raw = files[str(p)]
        if len(raw) > self.cfg.max_file_bytes:
            raise SkillError(f"el archivo supera {self.cfg.max_file_bytes} bytes")
        if b"\x00" in raw[:2048]:
            raise SkillError("el archivo parece binario")
        self._audit("skill_file_read", skill=name, path=str(p), fingerprint=info.fingerprint)
        return raw.decode("utf-8", errors="replace")

    # -- vista para la interfaz (sin aprobar nada) --------------------------------------------------------------
    def view(self, name: str, rel: str | None = None, limit: int = 60_000) -> dict[str, Any]:
        """Contenido para que el usuario lo revise en la web (tambien de skills pendientes). Nunca llega al modelo."""
        info = self.get(name, fresh=True)
        if info.status == "invalid" and rel is None:
            return {**info.public(), "text": ""}
        path = rel or SKILL_FILE
        p = PurePosixPath(path)
        if p.is_absolute() or ".." in p.parts or "\\" in path or str(p) not in {f for f, _ in info.files}:
            raise SkillError("ese archivo no pertenece a la skill")
        raw = (info.path / str(p)).read_bytes()[:limit]
        if b"\x00" in raw[:2048]:
            raise SkillError("archivo binario")
        return {**info.public(), "path": str(p), "text": raw.decode("utf-8", errors="replace")}
