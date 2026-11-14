import { describe, expect, it } from "vitest";
import { HOLD_S, TILT, BOARD_SCALE, CARD_SCALE, DWELL_S, HandsInput, Interaction, OneEuro, PinchFilter, handMetrics, toScreen, type HandSample, type Lm, type Viewport } from "./holo-logic";

const vp: Viewport = { vw: 640, vh: 480, cw: 800, ch: 600, mirror: false };

function hand(wx: number, wy: number, pinch: boolean): Lm[] {
  const lm: Lm[] = Array.from({ length: 21 }, () => ({ x: wx, y: wy }));
  lm[9] = { x: wx, y: wy - 0.2 };                       // palma = 0.2 (en alto)
  lm[4] = { x: wx, y: wy - 0.3 };
  lm[8] = { x: wx + (pinch ? 0.01 : 0.2), y: wy - 0.3 };
  return lm;
}
const S = (x: number, y: number, pinching: boolean): HandSample => ({ cursor: { x, y }, pinching });
const mk = (): Interaction => { const it = new Interaction(); it.setSize(800, 600); return it; };
let T = 0;
const step = (it: Interaction, a: HandSample | null, b: HandSample | null = null, m: HandSample | null = null, dt = 0.016) => { T += dt; return it.update([a, b, m], T); };
const card = (it: Interaction, id = "c", x = 400, y = 300) => { const c = it.addCard(id, 200, 100); c.x = x; c.y = y; return c; };

describe("cover mapping", () => {
  it("centro y espejo", () => {
    expect(toScreen({ x: 0.5, y: 0.5 }, vp)).toEqual({ x: 400, y: 300 });
    const m = toScreen({ x: 0.1, y: 0.5 }, { ...vp, mirror: true });
    const n = toScreen({ x: 0.9, y: 0.5 }, vp);
    expect(m.x).toBeCloseTo(n.x);
  });
  it("cover recorta los lados", () => {
    const p = toScreen({ x: 0, y: 0 }, { vw: 1000, vh: 100, cw: 500, ch: 500, mirror: false });
    expect(p.x).toBeLessThan(0);
  });
});

describe("pinch", () => {
  it("histeresis", () => {
    const f = new PinchFilter();
    for (let i = 0; i < 4; i++) f.update(0.1);
    expect(f.on).toBe(true);
    f.update(0.4); expect(f.on).toBe(true);
    for (let i = 0; i < 4; i++) f.update(0.8);
    expect(f.on).toBe(false);
  });
  it("metricas", () => {
    const m = handMetrics(hand(0.5, 0.7, true), 1)!;
    expect(m.pinch).toBeLessThan(0.3);
    expect(handMetrics(hand(0.5, 0.7, false), 1)!.pinch).toBeGreaterThan(0.5);
    expect(handMetrics([], 1)).toBeNull();
  });
});

describe("HandsInput ranuras", () => {
  it("una mano en ranura 0 y se mantiene", () => {
    const h = new HandsInput();
    const o = h.process([hand(0.3, 0.7, false)], 1.33, vp);
    expect(o[0]).not.toBeNull(); expect(o[1]).toBeNull();
  });
  it("dos manos no se intercambian aunque cambie el orden", () => {
    const h = new HandsInput();
    const L = hand(0.2, 0.7, false), R = hand(0.8, 0.7, false);
    const a = h.process([L, R], 1.33, vp);
    const b = h.process([R, L], 1.33, vp);
    expect(b[0]!.cursor.x).toBeCloseTo(a[0]!.cursor.x);
    expect(b[1]!.cursor.x).toBeCloseTo(a[1]!.cursor.x);
  });
  it("si desaparece una, la otra conserva su ranura", () => {
    const h = new HandsInput();
    h.process([hand(0.2, 0.7, false), hand(0.8, 0.7, false)], 1.33, vp);
    const o = h.process([hand(0.8, 0.7, false)], 1.33, vp);
    expect(o[0]).toBeNull(); expect(o[1]).not.toBeNull();
  });
  it("sin manos, todo nulo", () => {
    const h = new HandsInput();
    expect(h.process([], 1.33, vp)).toEqual([null, null]);
  });
});

describe("agarrar y arrastrar", () => {
  it("pellizco en vacio no agarra nada", () => {
    const it = mk(); card(it);
    for (let i = 0; i < 3; i++) step(it, S(50, 550, true));
    expect(it.slots[0].grab).toBeNull();
  });
  it("agarra, arrastra y suelta", () => {
    const it = mk(); const c = card(it);
    step(it, S(380, 320, false));
    const ev = step(it, S(380, 320, true));
    expect(ev.some((e) => e.type === "grab")).toBe(true);
    for (let i = 0; i < 30; i++) step(it, S(480, 420, true));
    expect(c.x).toBeGreaterThan(450); expect(c.y).toBeGreaterThan(380);
    const drop = step(it, S(480, 420, false));
    expect(drop.some((e) => e.type === "drop")).toBe(true);
    expect(c.held).toBeNull();
  });
  it("lanzamiento con inercia que se frena", () => {
    const it = mk(); const c = card(it, "c", 200, 300);
    step(it, S(200, 300, false)); step(it, S(200, 300, true));
    for (let i = 0; i < 6; i++) step(it, S(200 + i * 25, 300, true));
    step(it, S(350, 300, false), null, null, 0.01);
    const x0 = c.x;
    for (let i = 0; i < 10; i++) step(it, null);
    expect(c.x).toBeGreaterThan(x0);
    for (let i = 0; i < 300; i++) step(it, null);
    expect(Math.abs(c.vx)).toBeLessThan(1);
  });
  it("soltar quieto no lanza", () => {
    const it = mk(); const c = card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true));
    for (let i = 0; i < 6; i++) step(it, S(400, 300, true));
    step(it, S(400, 300, false), null, null, 0.3);
    expect(c.vx).toBe(0);
  });
  it("tocar la cruz de cerrar emite close y quita la tarjeta", () => {
    const it = mk(); card(it);
    const bx = 400 + 100 - 20, by = 300 - 50 + 20;
    step(it, S(bx, by, false));
    step(it, S(bx, by, true));
    expect(step(it, S(bx, by, false), null, null, 0.1)).toContainEqual({ type: "close", id: "c" });
    expect(it.cards.size).toBe(0);
  });
  it("el nucleo: un toque emite ring; arrastrarlo lo mueve sin emitir", () => {
    const it = mk();
    step(it, S(it.ring.x, it.ring.y, false)); step(it, S(it.ring.x, it.ring.y, true));
    expect(step(it, S(it.ring.x, it.ring.y, false), null, null, 0.1)).toContainEqual({ type: "ring" });
    const it2 = mk(); const x0 = it2.ring.x, y0 = it2.ring.y;
    step(it2, S(x0, y0, false)); step(it2, S(x0, y0, true));
    let ev: any[] = [];
    for (let i = 1; i <= 25; i++) ev.push(...step(it2, S(x0 + i * 8, y0 + i * 12, true)));
    ev.push(...step(it2, S(x0 + 200, y0 + 300, false)));
    expect(ev.some((e) => e.type === "ring")).toBe(false);
    expect(it2.ring.x).toBeGreaterThan(x0 + 120); expect(it2.ring.y).toBeGreaterThan(y0 + 150);
    it2.setSize(800, 600); expect(it2.ring.x).toBeGreaterThan(x0 + 120);        // reajustar el tamaño no lo devuelve al centro
  });
  it("burbujas: aparecen al abrir el nucleo, se tocan, y cerradas no reaccionan", () => {
    const it = mk(); it.setOrbits(["files", "mic", "arrange", "clear"]);
    step(it, null);
    expect(it.orbits.every((o) => o.r === 0)).toBe(true);
    const o0 = it.orbits[0];
    step(it, S(o0.x, o0.y, false)); expect(step(it, S(o0.x, o0.y, true)).some((e) => e.type === "orbit")).toBe(false);
    it.setOpen(true);
    for (let i = 0; i < 80; i++) step(it, null, null, null, 0.016);
    expect(it.ring.bloom).toBe(1);
    expect(it.orbits.every((o) => o.r > 30)).toBe(true);
    for (const o of it.orbits) { expect(o.x).toBeGreaterThan(0); expect(o.x).toBeLessThan(800); expect(o.y).toBeGreaterThan(0); expect(o.y).toBeLessThan(600); }
    const t = it.orbits[1];
    for (let i = 0; i < 12; i++) step(it, S(t.x, t.y, false));
    expect(step(it, S(t.x, t.y, true))).toContainEqual({ type: "orbit", id: "mic" });
  });
  it("tarjeta superior gana", () => {
    const it = mk(); card(it, "a"); const b = card(it, "b");
    expect(it.cardAt({ x: 400, y: 300 })!.id).toBe("b"); expect(b.z).toBeGreaterThan(it.cards.get("a")!.z);
  });
});

describe("zoom con dos manos", () => {
  const pinchBoth = (it: Interaction, ax: number, bx: number, y = 300) => { step(it, S(ax, y, true), S(bx, y, true)); };
  it("una sola mano pellizcando nunca hace zoom", () => {
    const it = mk(); const c = card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true));
    for (let i = 0; i < 20; i++) step(it, S(400, 300, true));
    expect(c.scale).toBe(1); expect(it.board.scale).toBe(1); expect(it.zoom).toBeNull();
  });
  it("separar las manos agranda la tarjeta agarrada", () => {
    const it = mk(); const c = card(it);
    step(it, S(380, 300, false), S(700, 500, false));
    step(it, S(380, 300, true), S(700, 500, false));
    step(it, S(380, 300, true), S(700, 500, true));
    for (let i = 0; i < 15; i++) step(it, S(300, 300, true), S(500, 300, true));
    const s0 = c.scale;
    for (let i = 0; i < 40; i++) step(it, S(150, 300, true), S(650, 300, true));
    expect(c.scale).toBeGreaterThan(s0 * 1.5);
    expect(it.board.scale).toBe(1);
  });
  it("sin tarjeta, zoom del tablero anclado al punto medio", () => {
    const it = mk();
    for (let i = 0; i < 3; i++) pinchBoth(it, 350, 450);
    const world = it.toBoard({ x: 400, y: 300 });
    for (let i = 0; i < 60; i++) pinchBoth(it, 250, 550);
    expect(it.board.scale).toBeGreaterThan(1.5);
    const back = it.toScreenFromBoard(world);
    expect(back.x).toBeCloseTo(400, 0); expect(back.y).toBeCloseTo(300, 0);
  });
  it("juntar las manos achica y respeta limites", () => {
    const it = mk(); const c = card(it);
    step(it, S(380, 300, false), S(700, 500, false)); step(it, S(380, 300, true), S(700, 500, false));
    step(it, S(380, 300, true), S(700, 500, true));
    for (let i = 0; i < 20; i++) step(it, S(100, 300, true), S(700, 300, true));
    for (let i = 0; i < 60; i++) step(it, S(399, 300, true), S(401, 300, true));
    expect(c.scale).toBeGreaterThanOrEqual(CARD_SCALE.min);
    expect(c.scale).toBeLessThan(0.6);
    const it2 = mk();
    for (let i = 0; i < 3; i++) pinchBoth(it2, 380, 420);
    for (let i = 0; i < 80; i++) pinchBoth(it2, 0, 800);
    expect(it2.board.scale).toBeLessThanOrEqual(BOARD_SCALE.max);
  });
  it("girar las manos rota la tarjeta", () => {
    const it = mk(); const c = card(it);
    step(it, S(380, 300, false)); step(it, S(380, 300, true));
    step(it, S(380, 300, true), S(500, 300, true));
    for (let i = 0; i < 10; i++) step(it, S(380, 300, true), S(500, 300, true));
    for (let i = 0; i < 10; i++) step(it, S(380, 300, true), S(440, 400, true));
    expect(c.rot).not.toBe(0);
  });
  it("al soltar el zoom la mano que sigue pellizcando no arrastra", () => {
    const it = mk(); const c = card(it);
    step(it, S(380, 300, false)); step(it, S(380, 300, true));
    step(it, S(380, 300, true), S(500, 300, true));
    for (let i = 0; i < 5; i++) step(it, S(380, 300, true), S(500, 300, true));
    step(it, S(380, 300, true), S(500, 300, false));
    const x = c.x;
    for (let i = 0; i < 5; i++) step(it, S(600, 450, true), null);
    expect(c.x).toBe(x); expect(it.zoom).toBeNull();
  });
  it("ownsHands: solo con pellizco (las manos abiertas siguen llegando al servidor)", () => {
    const it = mk();
    step(it, S(100, 100, false), null); expect(it.ownsHands()).toBe(false);
    step(it, S(100, 100, false), S(300, 100, false)); expect(it.ownsHands()).toBe(false);
    step(it, S(100, 100, true), null); expect(it.ownsHands()).toBe(true);
  });
});

describe("raton", () => {
  it("rueda escala tarjeta o tablero", () => {
    const it = mk(); const c = card(it);
    it.wheel({ x: 400, y: 300 }, 1.5); expect(c.scale).toBeCloseTo(1.5);
    it.wheel({ x: 20, y: 20 }, 1.5); expect(it.board.scale).toBeCloseTo(1.5);
    for (let i = 0; i < 20; i++) it.wheel({ x: 20, y: 20 }, 2);
    expect(it.board.scale).toBe(BOARD_SCALE.max);
    it.resetView(); expect(it.board.scale).toBe(1);
  });
  it("raton arrastra con la ranura 2", () => {
    const it = mk(); const c = card(it);
    step(it, null, null, S(400, 300, false)); step(it, null, null, S(400, 300, true));
    for (let i = 0; i < 20; i++) step(it, null, null, S(300, 300, true));
    expect(c.x).toBeLessThan(350);
  });
});

describe("W4.1: agarre permisivo, toques, colocacion y orden", () => {
  it("pellizco algo fuera del borde todavia agarra (margen)", () => {
    const it = mk(); card(it);                       // tarjeta 200x100 centrada en (400,300): borde derecho en x=500
    step(it, S(520, 300, false)); step(it, S(520, 300, true));
    expect(it.slots[0].grab).toBe("c");
    const it2 = mk(); card(it2);
    step(it2, S(620, 300, false)); step(it2, S(620, 300, true));
    expect(it2.slots[0].grab).toBeNull();
  });
  it("el margen elige la tarjeta mas cercana", () => {
    const it = mk(); card(it, "a", 300, 300); card(it, "b", 540, 300);   // bordes a 400 y 440
    step(it, S(430, 300, false)); step(it, S(430, 300, true));
    expect(it.slots[0].grab).toBe("b");
  });
  it("toque corto sin moverse = tap; arrastrar o mantener no", () => {
    const it = mk(); card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true), null, null, 0.016);
    expect(step(it, S(400, 300, false), null, null, 0.1)).toContainEqual({ type: "tap", id: "c" });
    const it2 = mk(); card(it2);
    step(it2, S(400, 300, false)); step(it2, S(400, 300, true));
    for (let i = 0; i < 8; i++) step(it2, S(400 + i * 20, 300, true));
    expect(step(it2, S(560, 300, false)).some((e) => e.type === "tap")).toBe(false);
    const it3 = mk(); card(it3);
    step(it3, S(400, 300, false)); step(it3, S(400, 300, true));
    expect(step(it3, S(400, 300, false), null, null, 1.2).some((e) => e.type === "tap")).toBe(false);
  });
  it("perder la mano pellizcando no cuenta como toque", () => {
    const it = mk(); card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true));
    expect(step(it, null).some((e) => e.type === "tap")).toBe(false);
  });
  it("tarjeta no cerrable ignora la esquina de cerrar", () => {
    const it = mk(); const c = it.addCard("t", 150, 96, { closable: false }); c.x = 400; c.y = 300;
    const bx = 400 + 75 - 20, by = 300 - 48 + 20;
    step(it, S(bx, by, false));
    expect(step(it, S(bx, by, true)).some((e) => e.type === "close")).toBe(false);
    expect(it.cards.has("t")).toBe(true);
  });
  it("30 tarjetas nuevas quedan siempre dentro de la pantalla; las que caben no se solapan", () => {
    const it = mk();
    for (let i = 0; i < 30; i++) it.addCard(`k${i}`, 300, 200);
    for (const c of it.cards.values()) {
      expect(c.x - c.w / 2).toBeGreaterThanOrEqual(-1); expect(c.x + c.w / 2).toBeLessThanOrEqual(801);
      expect(c.y - c.h / 2).toBeGreaterThanOrEqual(-1); expect(c.y + c.h / 2).toBeLessThanOrEqual(601);
    }
    const first = [...it.cards.values()].slice(0, 2);
    for (let i = 0; i < first.length; i++) for (let j = i + 1; j < first.length; j++) {
      const a = first[i], b = first[j];
      expect(Math.abs(a.x - b.x) >= (a.w + b.w) / 2 || Math.abs(a.y - b.y) >= (a.h + b.h) / 2).toBe(true);
    }
  });
  it("pantalla grande: caben 6 tarjetas 300x200 en 1280x720 sin solaparse", () => {
    const it = new Interaction(); it.setSize(1280, 720);
    for (let i = 0; i < 6; i++) it.addCard(`k${i}`, 300, 200);
    const l = [...it.cards.values()];
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++)
      expect(Math.abs(l[i].x - l[j].x) >= 300 || Math.abs(l[i].y - l[j].y) >= 200).toBe(true);
  });
  it("arrange mete todas en pantalla sin solaparse y restablece la vista", () => {
    const it = new Interaction(); it.setSize(1280, 720);
    for (let i = 0; i < 14; i++) { const c = it.addCard(`k${i}`, 300, 220); c.x = 5; c.y = 5; c.scale = 2; }
    it.board.scale = 2; it.board.tx = -300;
    it.arrange();
    expect(it.board.scale).toBe(1); expect(it.board.tx).toBe(0);
    const l = [...it.cards.values()];
    for (const c of l) {
      expect(c.x - (c.w * c.scale) / 2).toBeGreaterThanOrEqual(0); expect(c.x + (c.w * c.scale) / 2).toBeLessThanOrEqual(1280);
      expect(c.y - (c.h * c.scale) / 2).toBeGreaterThanOrEqual(0); expect(c.y + (c.h * c.scale) / 2).toBeLessThanOrEqual(720 - 70);
    }
    for (let i = 0; i < l.length; i++) for (let j = i + 1; j < l.length; j++) {
      const a = l[i], b = l[j];
      expect(Math.abs(a.x - b.x) >= (a.w * a.scale + b.w * b.scale) / 2 || Math.abs(a.y - b.y) >= (a.h * a.scale + b.h * b.scale) / 2).toBe(true);
    }
  });
  it("sensibilidad del pellizco", async () => {
    const m = await import("./holo-logic");
    const f = new m.PinchFilter();
    m.setPinchSensitivity(0.3); for (let i = 0; i < 4; i++) f.update(0.38);
    expect(f.on).toBe(false);
    m.setPinchSensitivity(0.5); f.reset(); for (let i = 0; i < 4; i++) f.update(0.38);
    expect(f.on).toBe(true);
    m.setPinchSensitivity(0.42);
  });
});


describe("W4.2: apuntar y esperar, lector con scroll, alcance, filtros", () => {
  const run = (it: Interaction, a: HandSample | null, secs: number, hz = 30) => {
    const ev: any[] = [];
    for (let i = 0; i < Math.round(secs * hz); i++) ev.push(...step(it, a, null, null, 1 / hz));
    return ev;
  };
  it("apuntar quieto sobre una tarjeta la 'toca' sin pellizcar, y no repite hasta salir", () => {
    const it = mk(); card(it);
    const ev = run(it, S(400, 300, false), DWELL_S.tap + 0.4);
    expect(ev.filter((e) => e.type === "tap")).toEqual([{ type: "tap", id: "c" }]);
    expect(run(it, S(402, 301, false), 3).some((e) => e.type === "tap")).toBe(false);
    run(it, S(40, 560, false), 0.5);                                // se va
    expect(run(it, S(400, 300, false), DWELL_S.tap + 0.4).some((e) => e.type === "tap")).toBe(true);
  });
  it("el progreso sube mientras esta quieto y se reinicia si se mueve mucho o pasa de largo", () => {
    const it = mk(); card(it);
    run(it, S(400, 300, false), 0.5); expect(it.slots[0].dwell).toBeGreaterThan(0.3);
    run(it, S(470, 340, false), 0.1); expect(it.slots[0].dwell).toBeLessThan(0.2);   // se corrio mas que el radio
    const ev = run(it, S(40, 560, false), 3); expect(ev.length).toBe(0);
  });
  it("un temblor chico no pierde el progreso", () => {
    const it = mk(); card(it);
    const ev: any[] = [];
    for (let i = 0; i < 40; i++) ev.push(...step(it, S(400 + (i % 2) * 14, 300 + ((i >> 1) % 2) * 10, false), null, null, 1 / 30));
    expect(ev.some((e) => e.type === "tap")).toBe(true);
  });
  it("nucleo, burbuja y cruz de cerrar por permanencia", () => {
    const it = mk(); it.setOrbits(["files"]); it.setOpen(true);
    for (let i = 0; i < 60; i++) step(it, null);
    const o = it.orbits[0];
    expect(run(it, S(o.x, o.y, false), 2)).toContainEqual({ type: "orbit", id: "files" });
    const it2 = mk();
    expect(run(it2, S(it2.ring.x, it2.ring.y, false), 2)).toContainEqual({ type: "ring" });
    const it3 = mk(); card(it3);
    expect(run(it3, S(480, 270, false), 2)).toContainEqual({ type: "close", id: "c" });
    expect(it3.cards.size).toBe(0);
  });
  it("con el raton no hay permanencia", () => {
    const it = mk(); card(it);
    const ev: any[] = [];
    for (let i = 0; i < 90; i++) ev.push(...step(it, null, null, S(400, 300, false), 1 / 30));
    expect(ev.length).toBe(0);
  });
  it("el pellizco apunta a donde estaba el dedo un instante antes de cerrarse", () => {
    const it = mk(); card(it, "c", 300, 300);
    for (let i = 0; i < 10; i++) step(it, S(300, 300, false), null, null, 1 / 30);          // sobre la tarjeta
    step(it, S(300, 300, false), null, null, 1 / 30);
    for (let i = 0; i < 2; i++) step(it, S(300 + (i + 1) * 120, 300, false), null, null, 1 / 30); // al cerrar los dedos se corre lejos
    step(it, S(540, 300, true), null, null, 1 / 30);
    expect(it.slots[0].grab).toBe("c");
  });
  it("alcance ampliado: llegar al borde con menos recorrido, siempre dentro de la pantalla", () => {
    const base = toScreen({ x: 0.5, y: 0.5 }, { ...vp, amp: 1.4 });
    expect(base).toEqual({ x: 400, y: 300 });
    const e = toScreen({ x: 0.9, y: 0.1 }, { ...vp, amp: 1.4 });
    expect(e.x).toBeLessThanOrEqual(800); expect(e.y).toBeGreaterThanOrEqual(0);
    expect(toScreen({ x: 0.8, y: 0.5 }, { ...vp, amp: 1.4 }).x).toBeGreaterThan(toScreen({ x: 0.8, y: 0.5 }, vp).x);
  });
  it("One Euro: quieta suaviza el temblor; en movimiento sigue sin quedarse atras", () => {
    const f = new OneEuro(); let t = 0; let out = { x: 0, y: 0 };
    let jitter = 0;
    for (let i = 0; i < 60; i++) { t += 1 / 30; out = f.filter({ x: 500 + (i % 2 ? 6 : -6), y: 300 }, t); if (i > 30) jitter = Math.max(jitter, Math.abs(out.x - 500)); }
    expect(jitter).toBeLessThan(4);
    for (let i = 0; i < 20; i++) { t += 1 / 30; out = f.filter({ x: 500 + i * 40, y: 300 }, t); }
    expect(500 + 19 * 40 - out.x).toBeLessThan(150);
  });
  it("pellizco: un solo cuadro ruidoso no lo cambia", () => {
    const f = new PinchFilter();
    f.update(0.1); expect(f.on).toBe(false); f.update(0.1); expect(f.on).toBe(true);
    f.update(0.9); expect(f.on).toBe(true); f.update(0.1); f.update(0.9); expect(f.on).toBe(true);
    f.update(0.9); f.update(0.9); expect(f.on).toBe(false);
  });
});


describe("W4.3: ventanas 3D, listas, giro, descarte", () => {
  const win = (it: Interaction, id = "w") => it.addCard(id, 560, 680, { kind: "window", titleH: 48 });
  const run = (it: Interaction, a: HandSample | null, secs: number, hz = 30) => {
    const ev: any[] = [];
    for (let i = 0; i < Math.round(secs * hz); i++) ev.push(...step(it, a, null, null, 1 / hz));
    return ev;
  };
  const bigIt = () => { const it = new Interaction(); it.setSize(1280, 720); return it; };

  it("una ventana nueva se abre centrada y ajustada para entrar entera", () => {
    const it = bigIt(); const w = win(it);
    expect(w.scale).toBeLessThan(1);
    const sx = (w.h * w.scale) / 2;
    expect(w.y - sx).toBeGreaterThanOrEqual(0); expect(w.y + sx).toBeLessThanOrEqual(720);
    expect(Math.abs(w.x - 640)).toBeLessThan(5);
  });
  it("tocar la barra de titulo cierra la ventana (tambien por permanencia)", () => {
    const it = bigIt(); const w = win(it);
    const p = { x: w.x, y: w.y - (w.h * w.scale) / 2 + 20 };
    step(it, S(p.x, p.y, false)); step(it, S(p.x, p.y, true));
    expect(step(it, S(p.x, p.y, false), null, null, 0.1)).toContainEqual({ type: "close", id: "w" });
    const it2 = bigIt(); const w2 = win(it2);
    expect(run(it2, S(w2.x - 50, w2.y - (w2.h * w2.scale) / 2 + 20, false), 2)).toContainEqual({ type: "close", id: "w" });
  });
  it("arrastrar la barra de titulo mueve la ventana", () => {
    const it = bigIt(); const w = win(it); const y0 = w.y;
    const p = { x: w.x, y: w.y - (w.h * w.scale) / 2 + 20 };
    step(it, S(p.x, p.y, false)); step(it, S(p.x, p.y, true));
    for (let i = 1; i <= 15; i++) step(it, S(p.x + i * 10, p.y + i * 6, true));
    expect(w.x).toBeGreaterThan(640 + 100); expect(w.y).toBeGreaterThan(y0 + 60);
  });
  it("pellizcar y arrastrar el cuerpo desplaza (no mueve); quieto ~1 s pasa a mover", () => {
    const it = bigIt(); const w = win(it); const x0 = w.x, y0 = w.y;
    step(it, S(w.x, w.y, false)); step(it, S(w.x, w.y, true));
    let total = 0;
    for (let i = 1; i <= 10; i++) for (const e of step(it, S(w.x, w.y - i * 15, true))) if (e.type === "scroll") total += e.dy;
    expect(total).toBeGreaterThan(100); expect(w.x).toBe(x0); expect(w.y).toBe(y0);
    const cy = it.slots[0].cursor.y;
    run(it, S(w.x, cy, true), HOLD_S + 0.3);                           // quieto: se promueve a "mover"
    expect(it.slots[0].mode).toBe("move");
    for (let i = 1; i <= 10; i++) step(it, S(w.x + i * 12, cy, true));
    expect(w.x).toBeGreaterThan(x0 + 60);
  });
  it("apuntando a la franja de arriba/abajo del cuerpo desplaza sin pellizcar", () => {
    const it = bigIt(); const w = win(it);
    const half = (w.h * w.scale) / 2;
    const down = run(it, S(w.x, w.y + half - 12, false), 0.5).filter((e) => e.type === "scroll");
    expect(down.length).toBeGreaterThan(5); expect(down.every((e) => e.dy > 0 && e.id === "w")).toBe(true);
    const up = run(it, S(w.x, w.y - half + 48 * w.scale + 10, false), 0.5).filter((e) => e.type === "scroll");
    expect(up.every((e) => e.dy < 0)).toBe(true);
    expect(run(it, S(w.x, w.y, false), 0.5).some((e) => e.type === "scroll")).toBe(false);
  });
  it("mover una tarjeta y quedarse quieto ~1 s la pone en modo giro 3D; soltar conserva la inclinacion", () => {
    const it = mk(); const c = card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true));
    for (let i = 1; i <= 8; i++) step(it, S(400 + i * 10, 300, true));          // "carga" la tarjeta
    run(it, S(480, 300, true), HOLD_S + 0.3);
    expect(it.slots[0].mode).toBe("rotate");
    for (let i = 1; i <= 20; i++) step(it, S(480 + i * 10, 300 + i * 4, true));
    expect(c.ry).toBeGreaterThan(0.5); expect(c.rx).toBeGreaterThan(0.2);
    expect(Math.abs(c.ry)).toBeLessThanOrEqual(TILT.max); const xr = c.x;
    step(it, S(680, 380, false));
    expect(c.ry).toBeGreaterThan(0.5); expect(c.x).toBe(xr);
  });
  it("quieto sin haber movido nada no gira (sigue siendo un toque largo)", () => {
    const it = mk(); card(it);
    step(it, S(400, 300, false)); step(it, S(400, 300, true));
    run(it, S(400, 300, true), HOLD_S + 0.5);
    expect(it.slots[0].mode).toBe("move");
  });
  it("el raton con shift gira de inmediato", () => {
    const it = mk(); const c = card(it);
    step(it, null, null, { cursor: { x: 400, y: 300 }, pinching: false });
    step(it, null, null, { cursor: { x: 400, y: 300 }, pinching: true, rotate: true });
    for (let i = 1; i <= 10; i++) step(it, null, null, { cursor: { x: 400 + i * 10, y: 300 }, pinching: true, rotate: true });
    expect(c.ry).toBeGreaterThan(0.3); expect(c.x).toBe(400);
  });
  it("lista: tocar una fila emite row; por permanencia tambien; la cabecera no", () => {
    const it = mk(); const c = it.addCard("l", 340, 300, { kind: "list", rows: [{ id: "a", y0: 50, y1: 90 }, { id: "b", y0: 90, y1: 130 }] });
    c.x = 400; c.y = 300;
    const rowY = (top: number) => 300 - 150 + top;
    step(it, S(380, rowY(110), false)); step(it, S(380, rowY(110), true));
    expect(step(it, S(380, rowY(110), false), null, null, 0.1)).toContainEqual({ type: "row", id: "l", row: "b" });
    const it2 = mk(); const c2 = it2.addCard("l", 340, 300, { kind: "list", rows: [{ id: "a", y0: 50, y1: 90 }] }); c2.x = 400; c2.y = 300;
    expect(run(it2, S(380, rowY(70), false), 1.6)).toContainEqual({ type: "row", id: "l", row: "a" });
    const it3 = mk(); const c3 = it3.addCard("l", 340, 300, { kind: "list", rows: [{ id: "a", y0: 50, y1: 90 }] }); c3.x = 400; c3.y = 300;
    step(it3, S(380, rowY(20), false)); step(it3, S(380, rowY(20), true));
    expect(step(it3, S(380, rowY(20), false), null, null, 0.1).some((e) => e.type === "row")).toBe(false);
  });
  it("arrastrar una lista por una fila la mueve y NO selecciona la fila", () => {
    const it = mk(); const c = it.addCard("l", 340, 300, { kind: "list", rows: [{ id: "a", y0: 50, y1: 90 }] }); c.x = 400; c.y = 300;
    const ev: any[] = [];
    step(it, S(380, 200 + 70, false)); step(it, S(380, 270, true));
    for (let i = 1; i <= 15; i++) ev.push(...step(it, S(380 + i * 10, 270 + i * 5, true)));
    ev.push(...step(it, S(530, 345, false), null, null, 0.3));
    expect(ev.some((e) => e.type === "row")).toBe(false); expect(c.x).toBeGreaterThan(500);
  });
  it("lanzar una tarjeta con fuerza fuera de la pantalla la descarta", () => {
    const it = mk(); card(it, "c", 700, 300);
    step(it, S(700, 300, false)); step(it, S(700, 300, true));
    for (let i = 1; i <= 6; i++) step(it, S(700 + i * 40, 300, true), null, null, 0.016);   // ~2500 px/s
    let closed = step(it, S(940, 300, false), null, null, 0.016).some((e) => e.type === "close" && e.id === "c");
    for (let i = 0; i < 60 && !closed; i++) closed = step(it, null).some((e) => e.type === "close" && e.id === "c");
    expect(closed).toBe(true); expect(it.cards.size).toBe(0);
  });
  it("un lanzamiento suave rebota y se queda; arrastrar fuera y soltar la devuelve adentro", () => {
    const it = mk(); const c = card(it, "c", 600, 300);
    step(it, S(600, 300, false)); step(it, S(600, 300, true));
    for (let i = 1; i <= 8; i++) step(it, S(600 + i * 40, 300, true), null, null, 0.03);
    step(it, S(1000, 300, false), null, null, 0.2);   // soltada lejos fuera de la pantalla, sin velocidad
    for (let i = 0; i < 5; i++) step(it, null);
    expect(it.cards.has("c")).toBe(true);
    expect(c.x).toBeLessThanOrEqual(800 - 40 + 1); expect(c.x).toBeGreaterThanOrEqual(0);
  });
  it("las dos manos pellizcando hacen zoom de la ventana; el nucleo no cuenta como objetivo", () => {
    const it = bigIt(); const w = win(it); const s0 = w.scale;
    step(it, S(w.x, w.y, false), S(w.x + 200, w.y, false));
    step(it, S(w.x, w.y, true), S(w.x + 200, w.y, false)); step(it, S(w.x, w.y, true), S(w.x + 200, w.y, true));
    for (let i = 0; i < 10; i++) step(it, S(w.x, w.y, true), S(w.x + 200, w.y, true));
    for (let i = 0; i < 30; i++) step(it, S(w.x - 100, w.y, true), S(w.x + 300, w.y, true));
    expect(w.scale).toBeGreaterThan(s0 * 1.3);
  });
  it("ordenar no mueve las ventanas y deja la inclinacion a cero", () => {
    const it = bigIt(); const w = win(it); const c = it.addCard("c", 300, 200); c.rx = 0.5; c.ry = 0.5; const wx = w.x;
    it.arrange();
    expect(c.rx).toBe(0); expect(c.ry).toBe(0); expect(w.x).toBe(wx);
  });
});
