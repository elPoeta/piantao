from __future__ import annotations

from typing import Any

from piantao.tools import Tool, ToolError, ToolRegistry

from .manager import SkillError, SkillsManager


def register_skills(registry: ToolRegistry, mgr: SkillsManager) -> list[str]:
    """skill_list / skill_load / skill_read. Leen solo skills aprobadas y verificadas; son nivel 1 (system_info)."""

    async def skill_list(_a: dict[str, Any]) -> str:
        return mgr.index() or "No hay skills aprobadas."

    async def skill_load(a: dict[str, Any]) -> str:
        try:
            return mgr.load(a["name"])
        except SkillError as exc:
            raise ToolError(str(exc)) from exc

    async def skill_read(a: dict[str, Any]) -> str:
        try:
            return mgr.read_file(a["name"], a["path"])
        except SkillError as exc:
            raise ToolError(str(exc)) from exc

    obj = lambda props, req: {"type": "object", "properties": props, "required": req, "additionalProperties": False}  # noqa: E731
    tools = [
        Tool("skill_list", "Lista las skills disponibles (instrucciones aprobadas por el usuario) con su descripcion.",
             obj({}, []), skill_list, "system_info", source="skills",
             describe=lambda a: ("Listar las skills disponibles", {})),
        Tool("skill_load", "Carga las instrucciones completas de una skill por su nombre. Usala cuando la tarea coincida con su descripcion.",
             obj({"name": {"type": "string", "description": "Nombre de la skill"}}, ["name"]), skill_load, "system_info",
             source="skills", describe=lambda a: (f"Cargar la skill '{a['name']}'", {"skill": a["name"]})),
        Tool("skill_read", "Lee un archivo de una skill (guia, plantilla o script) con una ruta relativa a su carpeta.",
             obj({"name": {"type": "string"}, "path": {"type": "string", "description": "Ruta relativa dentro de la skill"}}, ["name", "path"]),
             skill_read, "system_info", source="skills",
             describe=lambda a: (f"Leer {a['path']} de la skill '{a['name']}'", {"skill": a["name"], "path": a["path"]})),
    ]
    for t in tools:
        registry.register(t)
    return [t.name for t in tools]


def skills_handlers(mgr: SkillsManager) -> dict[str, Any]:
    """Comandos de SOLO LECTURA para la interfaz web. Aprobar o retirar skills no esta aqui a proposito: es solo por terminal."""
    import asyncio

    async def skills_list(_a: dict[str, Any]) -> dict[str, Any]:
        skills = await asyncio.to_thread(mgr.scan)
        return {"enabled": mgr.cfg.enabled, "dirs": list(mgr.cfg.dirs), "skills": [s.public() for s in skills]}

    async def skill_view(a: dict[str, Any]) -> dict[str, Any]:
        name, path = a.get("name"), a.get("path")
        if not isinstance(name, str) or (path is not None and not isinstance(path, str)):
            raise ValueError("name y path deben ser texto")
        try:
            return await asyncio.to_thread(mgr.view, name, path)
        except SkillError as exc:
            raise ValueError(str(exc)) from exc

    return {"skills_list": skills_list, "skill_view": skill_view}
