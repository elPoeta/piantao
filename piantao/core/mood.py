"""Estados finos de Piantao (lo que muestra su figura): a partir de la herramienta que corre se sabe si busca, escribe o analiza.

Solo mira el NOMBRE de la accion de permisos de la herramienta (nunca argumentos ni resultados), asi que no filtra contenido.
"""
from __future__ import annotations

import json
from typing import Any

SEARCHING = "searching"
WRITING = "writing"
ANALYZING = "analyzing"
EXPLAINING = "explaining"
CELEBRATING = "celebrating"

# acciones de config/permissions.yaml agrupadas por lo que "hace" Piantao al ejecutarlas
_SEARCH = {"search_web", "browse_web", "mcp_browse"}
_WRITE = {"create_document", "modify_file", "run_command", "install_package", "delete_data", "mcp_write", "mcp_sensitive",
          "desktop_control", "window_control", "service_control", "process_stop", "run_automation", "desktop_notify", "cloud_transfer"}
# todo lo demas (leer archivos, sistema, capturas, camara, MCP de lectura...) se muestra como "analizando"

# estados que dependen de que el agente este trabajando: el panel/HUD no deben tratarlos como "libre"
BUSY_STATES = frozenset({"thinking", "tool", "speaking", SEARCHING, WRITING, ANALYZING, EXPLAINING})


def action_state(action: str) -> str:
    if action in _SEARCH:
        return SEARCHING
    if action in _WRITE:
        return WRITING
    return ANALYZING


def tool_state(registry: Any, call: Any) -> str:
    """Estado para una llamada a herramienta. Ante cualquier duda (herramienta desconocida, accion dinamica rota): analizando."""
    try:
        tool = registry.get(call.name) if registry is not None else None
        if tool is None:
            return ANALYZING
        action = tool.action
        if callable(action):
            raw = getattr(call, "arguments", "") or "{}"
            args = json.loads(raw) if isinstance(raw, str) else raw
            action = action(args if isinstance(args, dict) else {})
        return action_state(str(action))
    except Exception:  # noqa: BLE001 - es solo cosmetica; jamas debe romper un turno
        return ANALYZING
