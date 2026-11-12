// Logica de manipulacion del tablero holografico, SIN dependencias de navegador ni de three.js (se prueba con vitest).
// Entradas: puntos de la mano (MediaPipe, normalizados) o un puntero de raton. Salidas: posicion/escala/rotacion de tarjetas
// y eventos (cerrar, tocar el anillo, elegir una orbita). Nada de esto decide permisos: los gestos con consecuencias
// (palma, pulgares) los decide el servidor.

export interface V2 { x: number; y: number }
export interface Lm { x: number; y: number; z?: number }
export interface Viewport { vw: number; vh: number; cw: number; ch: number; mirror: boolean }

export const PINCH_ON = 0.3;     // distancia pulgar-indice / tamaño de la palma para empezar a pellizcar
export const PINCH_OFF = 0.5;    // para soltar (histeresis: evita parpadeos)
export const CARD_SCALE = { min: 0.4, max: 3.2 };
export const BOARD_SCALE = { min: 0.4, max: 3 };
const SMOOTH = 0.55;

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const dist = (a: V2, b: V2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Coordenadas normalizadas del video -> pixeles del contenedor (video con object-fit: cover, espejado opcional). */
export function toScreen(p: V2, v: Viewport): V2 {
  const s = Math.max(v.cw / v.vw, v.ch / v.vh);
  const dw = v.vw * s, dh = v.vh * s;
  return { x: (v.cw - dw) / 2 + (v.mirror ? 1 - p.x : p.x) * dw, y: (v.ch - dh) / 2 + p.y * dh };
}

export interface HandMetrics { palm: number; pinch: number; thumb: V2; index: V2; cursor: V2 }

/** Metricas de una mano (21 puntos). `aspect` = ancho/alto del video: las distancias se miden sin deformacion. */
export function handMetrics(lm: Lm[], aspect: number): HandMetrics | null {
  if (lm.length !== 21) return null;
  const fix = (p: Lm): V2 => ({ x: p.x * aspect, y: p.y });
  const palm = dist(fix(lm[0]), fix(lm[9]));
  if (palm < 1e-4) return null;
  const pinch = dist(fix(lm[4]), fix(lm[8])) / palm;
  const thumb = { x: lm[4].x, y: lm[4].y }, index = { x: lm[8].x, y: lm[8].y };
  return { palm, pinch, thumb, index, cursor: { x: (thumb.x + index.x) / 2, y: (thumb.y + index.y) / 2 } };
}

export class PinchFilter {
  on = false;
  private ema: number | null = null;
  update(ratio: number): boolean {
    this.ema = this.ema === null ? ratio : 0.5 * this.ema + 0.5 * ratio;
    if (!this.on && this.ema < PINCH_ON) this.on = true;
    else if (this.on && this.ema > PINCH_OFF) this.on = false;
    return this.on;
  }
  reset(): void { this.on = false; this.ema = null; }
}

export interface HandSample { cursor: V2; pinching: boolean }

/** Convierte las manos detectadas en muestras estables por "ranura" (la mano 0 y la 1 no se intercambian entre cuadros). */
export class HandsInput {
  private wrists: (V2 | null)[] = [null, null];
  private filters = [new PinchFilter(), new PinchFilter()];

  process(hands: Lm[][], aspect: number, vp: Viewport): (HandSample | null)[] {
    const ms = hands.map((h) => handMetrics(h, aspect)).filter((m): m is HandMetrics => m !== null).slice(0, 2);
    const wrist = (i: number): V2 => ({ x: hands[i][0].x, y: hands[i][0].y });
    const out: (HandSample | null)[] = [null, null];
    const slotFor: number[] = [];
    if (ms.length === 1) {
      const w = wrist(0);
      const near = [0, 1].filter((k) => this.wrists[k] !== null && dist(this.wrists[k] as V2, w) < 0.35);
      near.sort((x, y) => dist(this.wrists[x] as V2, w) - dist(this.wrists[y] as V2, w));
      const free = [0, 1].find((k) => this.wrists[k] === null);
      slotFor.push(near.length ? near[0] : free ?? 0);
    } else if (ms.length === 2) {
      const w0 = wrist(0), w1 = wrist(1);
      const [p0, p1] = this.wrists;
      const straight = (p0 ? dist(p0, w0) : 0) + (p1 ? dist(p1, w1) : 0);
      const swapped = (p0 ? dist(p0, w1) : 0) + (p1 ? dist(p1, w0) : 0);
      slotFor.push(...(straight <= swapped ? [0, 1] : [1, 0]));
    }
    const used = new Set<number>();
    ms.forEach((m, i) => {
      const slot = slotFor[i];
      used.add(slot);
      this.wrists[slot] = wrist(i);
      out[slot] = { cursor: toScreen(m.cursor, vp), pinching: this.filters[slot].update(m.pinch) };
    });
    for (const s of [0, 1]) if (!used.has(s)) { this.wrists[s] = null; this.filters[s].reset(); }
    return out;
  }

  reset(): void { this.wrists = [null, null]; this.filters.forEach((f) => f.reset()); }
}

// -- tablero --------------------------------------------------------------------------------------------------------
export interface CardModel {
  id: string; x: number; y: number; w: number; h: number; scale: number; rot: number; z: number; vx: number; vy: number;
  held: number | null; hover: boolean;
}
export interface RingModel { x: number; y: number; r: number }
export interface OrbitItem { id: string; x: number; y: number; r: number }
export type HoloEvent = { type: "close"; id: string } | { type: "ring" } | { type: "orbit"; id: string } | { type: "grab"; id: string } | { type: "drop"; id: string };

export interface Slot { visible: boolean; pinching: boolean; cursor: V2; grab: string | null; off: V2; hover: string | null; last: V2; lastT: number }
const newSlot = (): Slot => ({ visible: false, pinching: false, cursor: { x: 0, y: 0 }, grab: null, off: { x: 0, y: 0 }, hover: null, last: { x: 0, y: 0 }, lastT: 0 });

interface Zoom {
  d0: number; a0: number; target: string | "board"; s0: number; r0: number; world0: V2; mid0: V2; t0: V2;
}

export const POINTER = 2; // ranura del raton

export class Interaction {
  cards = new Map<string, CardModel>();
  board = { scale: 1, tx: 0, ty: 0 };
  ring: RingModel = { x: 0, y: 0, r: 40 };
  orbits: OrbitItem[] = [];
  slots: Slot[] = [newSlot(), newSlot(), newSlot()];
  events: HoloEvent[] = [];
  zoom: Zoom | null = null;
  cw = 800; ch = 600;
  private zc = 1;
  private placed = 0;

  setSize(cw: number, ch: number): void { this.cw = cw; this.ch = ch; this.ring = { x: cw / 2, y: Math.min(110, ch * 0.2), r: 42 }; }

  addCard(id: string, w: number, h: number): CardModel {
    const k = this.placed++;
    const cols = Math.max(1, Math.floor((this.cw - 80) / (w + 24)));
    const c: CardModel = {
      id, w, h, scale: 1, rot: 0, z: ++this.zc, vx: 0, vy: 0, held: null, hover: false,
      x: 60 + w / 2 + (k % cols) * (w + 24), y: Math.min(this.ch - h / 2 - 20, 230 + h / 2 + Math.floor(k / cols) * 40),
    };
    this.cards.set(id, c);
    return c;
  }
  removeCard(id: string): void {
    this.cards.delete(id);
    for (const s of this.slots) if (s.grab === id) s.grab = null;
    if (this.zoom && this.zoom.target === id) this.zoom = null;
  }
  clear(): void { this.cards.clear(); this.zoom = null; for (const s of this.slots) s.grab = null; this.placed = 0; }

  // -- geometria ---------------------------------------------------------------------------------------------------
  toBoard(p: V2): V2 { return { x: (p.x - this.board.tx) / this.board.scale, y: (p.y - this.board.ty) / this.board.scale }; }
  toScreenFromBoard(p: V2): V2 { return { x: p.x * this.board.scale + this.board.tx, y: p.y * this.board.scale + this.board.ty }; }

  /** Punto de pantalla en el espacio local de la tarjeta (centro = 0,0; sin escala de la tarjeta). */
  localOf(c: CardModel, screen: V2): V2 {
    const b = this.toBoard(screen);
    const dx = b.x - c.x, dy = b.y - c.y;
    const cos = Math.cos(-c.rot), sin = Math.sin(-c.rot);
    return { x: (dx * cos - dy * sin) / c.scale, y: (dx * sin + dy * cos) / c.scale };
  }

  cardAt(screen: V2): CardModel | null {
    let best: CardModel | null = null;
    for (const c of this.cards.values()) {
      const l = this.localOf(c, screen);
      if (Math.abs(l.x) <= c.w / 2 && Math.abs(l.y) <= c.h / 2 && (!best || c.z > best.z)) best = c;
    }
    return best;
  }

  /** ¿El punto cae sobre el boton de cerrar (esquina superior derecha) de la tarjeta? */
  onClose(c: CardModel, screen: V2): boolean {
    const l = this.localOf(c, screen);
    return Math.hypot(l.x - (c.w / 2 - 20), l.y - (-c.h / 2 + 20)) <= 17;
  }

  private overUi(p: V2): { type: "orbit"; id: string } | { type: "ring" } | null {
    for (const o of this.orbits) if (Math.hypot(p.x - o.x, p.y - o.y) <= o.r) return { type: "orbit", id: o.id };
    if (Math.hypot(p.x - this.ring.x, p.y - this.ring.y) <= this.ring.r) return { type: "ring" };
    return null;
  }

  // -- actualizacion ------------------------------------------------------------------------------------------------
  /** `samples[0..1]` = manos, `samples[2]` = puntero (raton). Devuelve los eventos ocurridos en este cuadro. */
  update(samples: (HandSample | null)[], now: number): HoloEvent[] {
    this.events = [];
    const dt = this.slots.some((s) => s.lastT) ? Math.min(0.1, Math.max(0.001, now - Math.max(...this.slots.map((s) => s.lastT)))) : 0.016;
    for (let i = 0; i < 3; i++) this.updateSlot(i, samples[i] ?? null, now);
    this.updateZoom();
    this.stepInertia(dt);
    for (const c of this.cards.values()) c.hover = this.slots.some((s) => s.visible && s.hover === c.id);
    return this.events;
  }

  private updateSlot(i: number, s: HandSample | null, now: number): void {
    const slot = this.slots[i];
    if (!s) {
      if (slot.pinching) this.release(i, now);
      slot.visible = false; slot.hover = null;
      return;
    }
    const first = !slot.visible;
    slot.visible = true;
    slot.cursor = first ? { ...s.cursor } : { x: slot.cursor.x + SMOOTH * (s.cursor.x - slot.cursor.x), y: slot.cursor.y + SMOOTH * (s.cursor.y - slot.cursor.y) };
    const over = this.overUi(slot.cursor);
    const card = over ? null : this.cardAt(slot.cursor);
    slot.hover = card ? card.id : null;
    if (s.pinching && !slot.pinching) { slot.pinching = true; this.pinchStart(i, slot, over, card, now); }
    else if (!s.pinching && slot.pinching) this.release(i, now);
    else if (slot.pinching && slot.grab && !this.zoom) this.drag(slot, now);
  }

  private pinchStart(i: number, slot: Slot, over: ReturnType<Interaction["overUi"]>, card: CardModel | null, now: number): void {
    if (over) { this.events.push(over.type === "ring" ? { type: "ring" } : { type: "orbit", id: over.id }); return; }
    if (!card) return;
    if (this.onClose(card, slot.cursor)) { this.events.push({ type: "close", id: card.id }); this.removeCard(card.id); return; }
    const b = this.toBoard(slot.cursor);
    slot.grab = card.id;
    slot.off = { x: b.x - card.x, y: b.y - card.y };
    slot.last = { ...slot.cursor }; slot.lastT = now;
    card.z = ++this.zc; card.held = i; card.vx = card.vy = 0;
    this.events.push({ type: "grab", id: card.id });
  }

  private drag(slot: Slot, now: number): void {
    const c = slot.grab ? this.cards.get(slot.grab) : null;
    if (!c) return;
    const b = this.toBoard(slot.cursor);
    c.x = b.x - slot.off.x; c.y = b.y - slot.off.y;
    const dt = now - slot.lastT;
    if (dt > 0.004) {
      // velocidad suavizada, en pixeles de pantalla por segundo
      c.vx = 0.6 * c.vx + 0.4 * (slot.cursor.x - slot.last.x) / dt / this.board.scale;
      c.vy = 0.6 * c.vy + 0.4 * (slot.cursor.y - slot.last.y) / dt / this.board.scale;
      slot.last = { ...slot.cursor }; slot.lastT = now;
    }
  }

  private release(i: number, now: number): void {
    const slot = this.slots[i];
    const wasZoom = this.zoom !== null && i < 2;
    slot.pinching = false;
    if (slot.grab) {
      const c = this.cards.get(slot.grab);
      if (c) {
        c.held = null;
        if (wasZoom || now - slot.lastT > 0.15) c.vx = c.vy = 0; // quieto al soltar: sin lanzamiento involuntario
        this.events.push({ type: "drop", id: c.id });
      }
      slot.grab = null;
    }
    if (wasZoom) {
      this.zoom = null;
      for (const s of this.slots.slice(0, 2)) s.grab = null; // la mano que sigue pellizcando no arrastra hasta pellizcar de nuevo
    }
  }

  private updateZoom(): void {
    const a = this.slots[0], b = this.slots[1];
    const both = a.visible && b.visible && a.pinching && b.pinching;
    if (!both) { if (this.zoom && !(a.pinching && b.pinching)) this.endZoom(); return; }
    const d = Math.max(20, dist(a.cursor, b.cursor));
    const angle = Math.atan2(b.cursor.y - a.cursor.y, b.cursor.x - a.cursor.x);
    const mid = { x: (a.cursor.x + b.cursor.x) / 2, y: (a.cursor.y + b.cursor.y) / 2 };
    if (!this.zoom) {
      const target = a.grab ?? b.grab ?? "board";
      const card = target === "board" ? null : this.cards.get(target) ?? null;
      const tgt = card ? target : "board";
      this.zoom = {
        d0: d, a0: angle, target: tgt, s0: card ? card.scale : this.board.scale, r0: card ? card.rot : 0,
        world0: this.toBoard(mid), mid0: mid, t0: { x: this.board.tx, y: this.board.ty },
      };
      if (card) { card.vx = card.vy = 0; }
      return;
    }
    const z = this.zoom;
    const ratio = d / z.d0;
    if (z.target === "board") {
      const s = clamp(z.s0 * ratio, BOARD_SCALE.min, BOARD_SCALE.max);
      this.board.scale = s;
      // el punto del tablero que estaba entre las manos sigue entre las manos (zoom "hacia los dedos")
      this.board.tx = mid.x - z.world0.x * s;
      this.board.ty = mid.y - z.world0.y * s;
    } else {
      const c = this.cards.get(z.target);
      if (c) { c.scale = clamp(z.s0 * ratio, CARD_SCALE.min, CARD_SCALE.max); c.rot = z.r0 + (angle - z.a0); }
    }
  }

  private endZoom(): void { this.zoom = null; }

  private stepInertia(dt: number): void {
    for (const c of this.cards.values()) {
      if (c.held !== null || (Math.abs(c.vx) < 5 && Math.abs(c.vy) < 5)) { if (c.held === null) c.vx = c.vy = 0; continue; }
      c.x += c.vx * dt; c.y += c.vy * dt;
      const k = Math.exp(-dt * 4);
      c.vx *= k; c.vy *= k;
      const lo = this.toBoard({ x: 30, y: 30 }), hi = this.toBoard({ x: this.cw - 30, y: this.ch - 30 });
      if (c.x < lo.x) { c.x = lo.x; c.vx = Math.abs(c.vx) * 0.4; } else if (c.x > hi.x) { c.x = hi.x; c.vx = -Math.abs(c.vx) * 0.4; }
      if (c.y < lo.y) { c.y = lo.y; c.vy = Math.abs(c.vy) * 0.4; } else if (c.y > hi.y) { c.y = hi.y; c.vy = -Math.abs(c.vy) * 0.4; }
    }
  }

  /** Zoom con la rueda del raton sobre el punto dado: escala la tarjeta bajo el puntero o, si no hay, el tablero. */
  wheel(at: V2, factor: number): void {
    const c = this.cardAt(at);
    if (c) { c.scale = clamp(c.scale * factor, CARD_SCALE.min, CARD_SCALE.max); return; }
    const before = this.toBoard(at);
    this.board.scale = clamp(this.board.scale * factor, BOARD_SCALE.min, BOARD_SCALE.max);
    this.board.tx = at.x - before.x * this.board.scale;
    this.board.ty = at.y - before.y * this.board.scale;
  }

  resetView(): void { this.board = { scale: 1, tx: 0, ty: 0 }; }

  /** Con un pellizco en curso la manipulacion es dueña de las manos: al servidor no se le mandan gestos. Con las manos
   *  abiertas SI llegan (la palma de detener nunca se bloquea). */
  ownsHands(): boolean { return this.slots[0].pinching || this.slots[1].pinching; }
}
