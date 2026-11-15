// Poses de Piantao (hoja de sprites 4x2) y como se eligen a partir del estado que publica el agente. Sin dependencias de DOM,
// asi se prueba en vitest. La hoja tiene 8 celdas de 384x512, en este orden: fila 1 = reposo, pensando, hablando, escribiendo;
// fila 2 = analizando, buscando, explicando, celebrando.
export type Pose = "reposo" | "pensando" | "hablando" | "escribiendo" | "analizando" | "buscando" | "explicando" | "celebrando";
export const POSES: Pose[] = ["reposo", "pensando", "hablando", "escribiendo", "analizando", "buscando", "explicando", "celebrando"];
export const CELL_W = 384, CELL_H = 512, SHEET_COLS = 4, SHEET_ROWS = 2;

export const cellOf = (p: Pose): { col: number; row: number } => { const i = POSES.indexOf(p); return { col: i % SHEET_COLS, row: Math.floor(i / SHEET_COLS) }; };

// estado del agente -> pose. Lo desconocido cae en reposo (nunca queda la figura en blanco).
const POSE: Record<string, Pose> = {
  idle: "reposo", listening: "reposo", offline: "reposo", stopped: "reposo",
  thinking: "pensando", transcribing: "pensando", confirming: "pensando",
  speaking: "hablando",
  writing: "escribiendo", tool: "escribiendo", acting: "escribiendo",
  analyzing: "analizando",
  searching: "buscando",
  explaining: "explicando",
  celebrating: "celebrando",
};
export const poseFor = (state: string): Pose => POSE[state] ?? "reposo";

// color del resplandor (el "blink") por estado
export const STATE_COLOR: Record<string, number> = {
  idle: 0x5b7794, offline: 0x3a4654, stopped: 0x3a4654, listening: 0x5ee6a8, transcribing: 0x4cc9f0, thinking: 0x4cc9f0, speaking: 0xb388ff,
  tool: 0xf4a261, acting: 0xf4a261, writing: 0xf4a261, analyzing: 0x2ec4b6, searching: 0x6ea8fe, explaining: 0xc79bff, celebrating: 0xffd166, confirming: 0xf4a261,
};
export const colorOf = (state: string): number => STATE_COLOR[state] ?? STATE_COLOR.idle;
export const cssColor = (state: string): string => "#" + colorOf(state).toString(16).padStart(6, "0");

export const STATE_LABEL: Record<string, string> = {
  idle: "En reposo", offline: "Sin conexion", stopped: "Detenido", listening: "Escuchando", transcribing: "Transcribiendo", thinking: "Pensando",
  speaking: "Hablando", tool: "Usando una herramienta", acting: "Actuando", writing: "Escribiendo", analyzing: "Analizando", searching: "Buscando",
  explaining: "Explicando", celebrating: "Listo", confirming: "Esperando tu permiso",
};
// ritmo del parpadeo del resplandor (segundos); los estados de trabajo laten mas rapido que el reposo
export const BLINK_S: Record<string, number> = { idle: 3.2, listening: 1.4, transcribing: 0.9, thinking: 0.9, speaking: 0.7, tool: 1.1, acting: 1.1, writing: 1, analyzing: 1.2, searching: 0.8, explaining: 1.1, celebrating: 0.5, confirming: 0.8 };
