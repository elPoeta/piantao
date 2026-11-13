"""Explorador de archivos de SOLO LECTURA para el holograma. Usa exactamente las mismas carpetas que el agente
(`file_access.allowed_dirs`), nunca sale de ellas, respeta `protected` y resuelve enlaces simbolicos antes de comprobar.
Muestra texto plano e imagenes; no ejecuta ni abre nada con otras aplicaciones, y no escribe.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable

MAX_ENTRIES = 200
MAX_TEXT_BYTES = 64 * 1024
MAX_CARD_TEXT = 60000  # lo que muestra el lector (la tarjeta solo muestra el comienzo)
MAX_IMAGE_BYTES = 20 * 1024 * 1024
IMAGE_EXT = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif"}
TEXT_EXT = {".txt", ".md", ".markdown", ".rst", ".csv", ".tsv", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".log", ".py", ".js",
            ".ts", ".tsx", ".jsx", ".html", ".css", ".sh", ".sql", ".xml", ".c", ".h", ".cpp", ".rs", ".go", ".java", ".tex", ".env.example"}


def _within(path: Path, base: Path) -> bool:
    return path == base or base in path.parents


class FileBrowser:
    def __init__(self, roots: list[Path], protected: list[Path] | None = None):
        self.roots = [Path(r).resolve() for r in roots]
        self.protected = [Path(p).resolve() for p in protected or []]

    @classmethod
    def from_config(cls, cfg: dict[str, Any], project_root: Path) -> "FileBrowser":
        fa = (cfg.get("permissions") or {}).get("file_access") or {}

        def absolute(p: Any) -> Path:
            path = Path(str(p)).expanduser()
            return (path if path.is_absolute() else Path(project_root) / path).resolve()

        return cls([absolute(p) for p in fa.get("allowed_dirs") or []], [absolute(p) for p in fa.get("protected") or []])

    # -- resolucion -----------------------------------------------------------------------------------------------------
    def _root(self, root: Any) -> Path:
        if isinstance(root, bool) or not isinstance(root, int) or not 0 <= root < len(self.roots):
            raise ValueError("carpeta raiz invalida")
        return self.roots[root]

    def resolve(self, root: Any, rel: Any = "") -> Path:
        base = self._root(root)
        if rel in (None, ""):
            rel = ""
        if not isinstance(rel, str) or "\x00" in rel or rel.startswith(("/", "\\")) or ".." in Path(rel).parts or "\\" in rel:
            raise ValueError("ruta invalida")
        path = (base / rel).resolve()  # sigue enlaces simbolicos
        if not _within(path, base):
            raise ValueError("la ruta sale de la carpeta autorizada")
        if any(_within(path, p) for p in self.protected):
            raise ValueError("ruta protegida")
        return path

    def _kind(self, p: Path) -> str:
        ext = p.suffix.lower()
        if p.is_dir():
            return "dir"
        if ext in IMAGE_EXT:
            return "image"
        if ext in TEXT_EXT or p.name.lower() in {"readme", "makefile", "dockerfile", "license"}:
            return "text"
        if ext == ".pdf":
            return "pdf"
        return "other"

    # -- operaciones ----------------------------------------------------------------------------------------------------
    def list_roots(self) -> list[dict[str, Any]]:
        return [{"root": i, "name": r.name or str(r), "exists": r.is_dir()} for i, r in enumerate(self.roots)
                if not any(_within(r, p) for p in self.protected)]

    def list_dir(self, root: Any, rel: Any = "") -> dict[str, Any]:
        base = self._root(root)
        d = self.resolve(root, rel)
        if not d.is_dir():
            raise ValueError("no es una carpeta")
        entries: list[dict[str, Any]] = []
        try:
            children = sorted(d.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))
        except OSError as exc:
            raise ValueError(f"no se pudo leer la carpeta: {exc.strerror or exc}") from exc
        total = 0
        for c in children:
            if c.name.startswith("."):
                continue
            try:
                r = c.resolve()
                if not _within(r, base) or any(_within(r, p) for p in self.protected):
                    continue  # enlaces que escapan o rutas protegidas: no se muestran
                total += 1
                if len(entries) < MAX_ENTRIES:
                    entries.append({"name": c.name, "kind": self._kind(r), "size": r.stat().st_size if r.is_file() else 0})
            except OSError:
                continue
        rel_path = "" if d == base else d.relative_to(base).as_posix()
        parent = None if d == base else ("" if d.parent == base else d.parent.relative_to(base).as_posix())
        return {"root": root, "name": base.name, "path": rel_path, "parent": parent, "entries": entries, "total": total}

    def read(self, root: Any, rel: Any) -> dict[str, Any]:
        p = self.resolve(root, rel)
        if not p.is_file():
            raise ValueError("no es un archivo")
        kind = self._kind(p)
        size = p.stat().st_size
        out: dict[str, Any] = {"name": p.name, "kind": kind, "size": size}
        if kind == "image":
            if size > MAX_IMAGE_BYTES:
                raise ValueError("la imagen supera 20 MiB")
            from urllib.parse import quote

            out["url"] = f"/api/file?root={root}&path={quote(Path(p).relative_to(self._root(root)).as_posix(), safe='')}"
        elif kind == "text":
            with p.open("rb") as f:
                raw = f.read(MAX_TEXT_BYTES + 1)
            if b"\x00" in raw[:2048]:
                out["kind"], out["text"] = "other", ""
            else:
                text = raw[:MAX_TEXT_BYTES].decode("utf-8", errors="replace").replace("\r\n", "\n")
                out["truncated"] = len(raw) > MAX_TEXT_BYTES or len(text) > MAX_CARD_TEXT
                out["text"] = text[:MAX_CARD_TEXT]
        elif kind == "pdf":
            out["text"] = self._pdf_text(p)
            out["truncated"] = len(out["text"]) >= MAX_CARD_TEXT
        return out

    @staticmethod
    def _pdf_text(p: Path) -> str:
        try:
            from pypdf import PdfReader
        except ImportError:
            return ""
        try:
            reader = PdfReader(str(p))
            parts: list[str] = []
            for page in reader.pages[:40]:
                parts.append(page.extract_text() or "")
                if sum(map(len, parts)) >= MAX_CARD_TEXT:
                    break
            return "\n".join(parts).strip()[:MAX_CARD_TEXT]
        except Exception:  # PDF danado o cifrado: sin vista previa
            return ""

    def image_path(self, root: Any, rel: Any) -> tuple[Path, str]:
        p = self.resolve(int(root) if isinstance(root, str) and root.isdigit() else root, rel)
        mime = IMAGE_EXT.get(p.suffix.lower())
        if mime is None or not p.is_file():
            raise ValueError("imagen no disponible")
        if p.stat().st_size > MAX_IMAGE_BYTES:
            raise ValueError("la imagen supera 20 MiB")
        return p, mime

    def handlers(self) -> dict[str, Callable[[dict[str, Any]], Any]]:
        async def roots(_a: dict[str, Any]) -> list[dict[str, Any]]:
            return self.list_roots()

        async def listing(a: dict[str, Any]) -> dict[str, Any]:
            return self.list_dir(a.get("root", 0), a.get("path", ""))

        async def read(a: dict[str, Any]) -> dict[str, Any]:
            return self.read(a.get("root", 0), a.get("path"))

        return {"files_roots": roots, "files_list": listing, "files_read": read}
