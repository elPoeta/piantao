import { describe, expect, it } from "vitest";
import { BLINK_S, POSES, STATE_COLOR, STATE_LABEL, cellOf, colorOf, cssColor, poseFor } from "./sprites";

describe("sprites", () => {
  it("la hoja es 4x2 y cada pose ocupa una celda distinta en el orden de la hoja", () => {
    expect(POSES).toHaveLength(8);
    expect(cellOf("reposo")).toEqual({ col: 0, row: 0 }); expect(cellOf("escribiendo")).toEqual({ col: 3, row: 0 });
    expect(cellOf("analizando")).toEqual({ col: 0, row: 1 }); expect(cellOf("celebrando")).toEqual({ col: 3, row: 1 });
    expect(new Set(POSES.map((p) => JSON.stringify(cellOf(p)))).size).toBe(8);
  });
  it("cada estado del agente tiene pose, color, etiqueta; lo desconocido cae en reposo", () => {
    const states = ["idle", "listening", "transcribing", "thinking", "tool", "speaking", "confirming", "stopped", "searching", "writing", "analyzing", "explaining", "celebrating", "offline", "acting"];
    for (const s of states) { expect(POSES).toContain(poseFor(s)); expect(STATE_COLOR[s]).toBeDefined(); expect(STATE_LABEL[s]).toBeTruthy(); }
    expect(poseFor("algo-nuevo")).toBe("reposo"); expect(colorOf("algo-nuevo")).toBe(STATE_COLOR.idle);
  });
  it("las poses de trabajo coinciden con lo que hace Piantao", () => {
    expect(poseFor("searching")).toBe("buscando"); expect(poseFor("writing")).toBe("escribiendo"); expect(poseFor("analyzing")).toBe("analizando");
    expect(poseFor("explaining")).toBe("explicando"); expect(poseFor("celebrating")).toBe("celebrando"); expect(poseFor("speaking")).toBe("hablando");
    expect(poseFor("thinking")).toBe("pensando"); expect(poseFor("listening")).toBe("reposo");
  });
  it("el parpadeo es mas lento en reposo que en cualquier estado de trabajo y el color CSS es hex valido", () => {
    for (const [k, v] of Object.entries(BLINK_S)) if (k !== "idle") expect(v).toBeLessThan(BLINK_S.idle);
    for (const s of Object.keys(STATE_COLOR)) expect(cssColor(s)).toMatch(/^#[0-9a-f]{6}$/);
  });
});
