import { describe, expect, it } from "vitest";
import { BOARD_SCALE, CARD_SCALE, HandsInput, Interaction, PinchFilter, handMetrics, toScreen, type HandSample, type Lm, type Viewport } from "./holo-logic";

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
  it("boton cerrar emite close y quita la tarjeta", () => {
    const it = mk(); card(it);
    const bx = 400 + 100 - 20, by = 300 - 50 + 20;
    step(it, S(bx, by, false));
    const ev = step(it, S(bx, by, true));
    expect(ev).toContainEqual({ type: "close", id: "c" });
    expect(it.cards.size).toBe(0);
  });
  it("anillo y orbitas", () => {
    const it = mk(); it.orbits = [{ id: "audit", x: 600, y: 120, r: 30 }];
    step(it, S(it.ring.x, it.ring.y, false));
    expect(step(it, S(it.ring.x, it.ring.y, true))).toContainEqual({ type: "ring" });
    for (let i = 0; i < 12; i++) step(it, S(600, 120, false));
    expect(step(it, S(600, 120, true))).toContainEqual({ type: "orbit", id: "audit" });
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
