// Logica de manipulacion del tablero holografico, SIN dependencias de navegador ni de three.js (se prueba con vitest).
// Entradas: puntos de la mano (MediaPipe, normalizados) o un puntero de raton. Salidas: posicion/escala/rotacion de tarjetas
// y eventos (cerrar, tocar el anillo, elegir una orbita). Nada de esto decide permisos: los gestos con consecuencias
// (palma, pulgares) los decide el servidor.

export interface V2 { x: number; y: number }
export interface Lm { x: number; y: number; z?: number }
export interface Viewport { vw: number; vh: number; cw: number; ch: number; mirror: boolean; amp?: number }

/** Distancia pulgar-indice / tamaño de la palma. `on`: empieza el pellizco; `off`: se suelta (histeresis). Ajustable. */
export const tuning = { on: 0.34, off: 0.52 };
export function setPinchSensitivity(on: number): void { tuning.on = clamp(on, 0.2, 0.6); tuning.off = tuning.on + 0.18; }
export const GRAB_MARGIN = 70;       // px alrededor de una tarjeta donde un pellizco todavia la agarra (el mas cercano gana)
export const TAP_MAX_MOVE = 45; export const TAP_MAX_S = 0.6;
export const LOOKBACK_S = 0.12;      // el objetivo de un pellizco se busca tambien donde estaba el dedo justo antes de cerrarse
export const DWELL_S = { tap: 0.85, orbit: 1.0, ring: 1.2, close: 1.2, reader_close: 1.0 };
export const DWELL_RADIUS = 38;      // el cursor puede temblar hasta esto sin perder el progreso
export const SCROLL_BAND = 0.16;     // fraccion superior/inferior del lector que desplaza al apuntar
export const SCROLL_SPEED = 900;     // px/s a tope de franja
export const REACH = 1.4;            // amplificacion del alcance de la mano alrededor del centro
export const CARD_SCALE = { min: 0.4, max: 3.2 };
export const BOARD_SCALE = { min: 0.4, max: 3 };
const SMOOTH = 0.8;

export const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const dist = (a: V2, b: V2): number => Math.hypot(a.x - b.x, a.y - b.y);

/** Coordenadas normalizadas del video -> pixeles del contenedor (video con object-fit: cover, espejado opcional). */
export function toScreen(p: V2, v: Viewport): V2 {
  const s = Math.max(v.cw / v.vw, v.ch / v.vh);
  const dw = v.vw * s, dh = v.vh * s;
  let x = (v.cw - dw) / 2 + (v.mirror ? 1 - p.x : p.x) * dw, y = (v.ch - dh) / 2 + p.y * dh;
  if (v.amp && v.amp !== 1) { x = clamp(v.cw / 2 + (x - v.cw / 2) * v.amp, 0, v.cw); y = clamp(v.ch / 2 + (y - v.ch / 2) * v.amp, 0, v.ch); }
  return { x, y };
}

/** Filtro One Euro: suaviza fuerte con la mano quieta y casi nada cuando se mueve rapido (menos temblor sin retraso). */
export class OneEuro {
  private px: V2 | null = null; private dx: V2 = { x: 0, y: 0 }; private t = 0;
  constructor(private minCutoff = 1.6, private beta = 0.008, private dCutoff = 1.0) {}
  private alpha(cutoff: number, dt: number): number { const tau = 1 / (2 * Math.PI * cutoff); return 1 / (1 + tau / dt); }
  filter(p: V2, now: number): V2 {
    if (!this.px || now - this.t > 0.5) { this.px = { ...p }; this.dx = { x: 0, y: 0 }; this.t = now; return { ...p }; }
    const dt = Math.max(1e-3, now - this.t); this.t = now;
    const ad = this.alpha(this.dCutoff, dt);
    const raw = { x: (p.x - this.px.x) / dt, y: (p.y - this.px.y) / dt };
    this.dx = { x: this.dx.x + ad * (raw.x - this.dx.x), y: this.dx.y + ad * (raw.y - this.dx.y) };
    const speed = Math.hypot(this.dx.x, this.dx.y);
    const a = this.alpha(this.minCutoff + this.beta * speed, dt);
    this.px = { x: this.px.x + a * (p.x - this.px.x), y: this.px.y + a * (p.y - this.px.y) };
    return { ...this.px };
  }
  reset(): void { this.px = null; }
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

/** Pellizco con histeresis y "merito" de 2 cuadros seguidos (un cuadro ruidoso no pellizca ni suelta). */
export class PinchFilter {
  on = false;
  private run = 0;
  update(ratio: number): boolean {
    const want = this.on ? ratio < tuning.off : ratio < tuning.on; // ¿el cuadro dice "pellizcado"?
    if (want === this.on) { this.run = 0; return this.on; }
    if (++this.run >= 2) { this.on = want; this.run = 0; }
    return this.on;
  }
  reset(): void { this.on = false; this.run = 0; }
}

export interface HandSample { cursor: V2; pinching: boolean }

/** Convierte las manos detectadas en muestras estables por "ranura" (la mano 0 y la 1 no se intercambian entre cuadros). */
export class HandsInput {
  private wrists: (V2 | null)[] = [null, null];
  private filters = [new PinchFilter(), new PinchFilter()];
  private smooth = [new OneEuro(), new OneEuro()];
  private clock = 0;

  process(hands: Lm[][], aspect: number, vp: Viewport, now?: number): (HandSample | null)[] {
    const t = now ?? (this.clock += 1 / 24);
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
      out[slot] = { cursor: this.smooth[slot].filter(toScreen(m.cursor, vp), t), pinching: this.filters[slot].update(m.pinch) };
    });
    for (const s of [0, 1]) if (!used.has(s)) { this.wrists[s] = null; this.filters[s].reset(); this.smooth[s].reset(); }
    return out;
  }

  reset(): void { this.wrists = [null, null]; this.filters.forEach((f) => f.reset()); this.smooth.forEach((f) => f.reset()); }
}

// -- tablero --------------------------------------------------------------------------------------------------------
export interface CardModel {
  id: string; x: number; y: number; w: number; h: number; scale: number; rot: number; z: number; vx: number; vy: number;
  held: number | null; hover: boolean; closable: boolean;
}
export interface RingModel { x: number; y: number; r: number }
export interface OrbitItem { id: string; x: number; y: number; r: number }
export type HoloEvent = { type: "close"; id: string } | { type: "ring" } | { type: "orbit"; id: string } | { type: "grab"; id: string } | { type: "drop"; id: string } | { type: "tap"; id: string }
  | { type: "scroll"; dy: number } | { type: "reader_close" };

export interface Slot {
  visible: boolean; pinching: boolean; cursor: V2; grab: string | null; off: V2; hover: string | null; last: V2; lastT: number; start: V2; startT: number;
  hist: { t: number; x: number; y: number }[]; dwell: number; dwellKey: string | null; dwellAnchor: V2; dwellT0: number; dwellDone: string | null; scrollLast: V2 | null;
}
const newSlot = (): Slot => ({ visible: false, pinching: false, cursor: { x: 0, y: 0 }, grab: null, off: { x: 0, y: 0 }, hover: null, last: { x: 0, y: 0 }, lastT: 0, start: { x: 0, y: 0 }, startT: 0,
  hist: [], dwell: 0, dwellKey: null, dwellAnchor: { x: 0, y: 0 }, dwellT0: 0, dwellDone: null, scrollLast: null });

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
  /** Rectangulo (px de pantalla) del lector de documentos cuando esta abierto: tiene prioridad sobre todo el tablero. */
  reader: { x: number; y: number; w: number; h: number } | null = null;
  cw = 800; ch = 600;
  private zc = 1;
  private placed = 0;

  setSize(cw: number, ch: number): void { this.cw = cw; this.ch = ch; this.ring = { x: cw / 2, y: Math.min(110, ch * 0.2), r: 42 }; }

  /** Coloca la tarjeta en el primer hueco libre de la pantalla (debajo del anillo y sobre la barra inferior). */
  addCard(id: string, w: number, h: number, opts: { closable?: boolean } = {}): CardModel {
    const c: CardModel = { id, w, h, scale: 1, rot: 0, z: ++this.zc, vx: 0, vy: 0, held: null, hover: false, closable: opts.closable !== false, x: 0, y: 0 };
    const p = this.freeSpot(w, h);
    c.x = p.x; c.y = p.y;
    this.cards.set(id, c);
    this.placed++;
    return c;
  }

  private area(): { x0: number; y0: number; x1: number; y1: number } {
    return { x0: 16, y0: Math.min(this.ring.y + this.ring.r + 24, this.ch * 0.3), x1: this.cw - 16, y1: this.ch - 84 };
  }

  private freeSpot(w: number, h: number, skip?: Set<string>): V2 {
    const a = this.area(), gap = 14;
    const boxes = [...this.cards.values()].filter((c) => !skip?.has(c.id)).map((c) => {
      const s = this.toScreenFromBoard({ x: c.x, y: c.y });
      return { x: s.x, y: s.y, hw: (c.w * c.scale * this.board.scale) / 2 + gap, hh: (c.h * c.scale * this.board.scale) / 2 + gap };
    });
    const free = (x: number, y: number) => boxes.every((b) => Math.abs(b.x - x) >= b.hw + w / 2 || Math.abs(b.y - y) >= b.hh + h / 2);
    // candidatos: esquina del area y pegados (con `gap`) a las tarjetas existentes; prueba fila por fila, de izquierda a derecha
    const xs = [a.x0 + w / 2, ...boxes.map((b) => b.x + b.hw + w / 2)].filter((x) => x <= a.x1 - w / 2).sort((p, q) => p - q);
    const ys = [a.y0 + h / 2, ...boxes.map((b) => b.y + b.hh + h / 2)].filter((y) => y <= a.y1 - h / 2).sort((p, q) => p - q);
    for (const y of ys) for (const x of xs) if (free(x, y)) return this.toBoard({ x, y });
    const k = this.placed % 8; // sin hueco: en cascada, siempre dentro de la pantalla
    return this.toBoard({ x: clamp(a.x0 + w / 2 + 30 * k, w / 2, this.cw - w / 2), y: clamp(a.y0 + h / 2 + 24 * k, h / 2, this.ch - h / 2 - 70) });
  }

  /** Reordena las tarjetas en una grilla que entra entera en pantalla (las achica hasta 0,4× si hace falta). Vuelve la vista a 1:1. */
  arrange(ids?: string[]): void {
    this.resetView();
    const list = [...this.cards.values()].filter((c) => !ids || ids.includes(c.id)).sort((p, q) => p.z - q.z);
    if (list.length === 0) return;
    const a = this.area(), gap = 14;
    for (let f = 1; f >= 0.4 - 1e-9; f -= 0.05) {
      const pos: V2[] = [];
      let x = a.x0, y = a.y0, rowH = 0, ok = true;
      for (const c of list) {
        const w = c.w * f, h = c.h * f;
        if (x + w > a.x1 && x > a.x0) { x = a.x0; y += rowH + gap; rowH = 0; }
        if (y + h > a.y1) { ok = false; break; }
        pos.push({ x: x + w / 2, y: y + h / 2 });
        x += w + gap; rowH = Math.max(rowH, h);
      }
      if (ok || f < 0.4 + 1e-9) {
        list.forEach((c, i) => { const p = pos[i] ?? { x: this.cw / 2, y: this.ch / 2 }; c.scale = f; c.rot = 0; c.x = p.x; c.y = p.y; c.vx = c.vy = 0; });
        return;
      }
    }
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

  /** Tarjeta bajo el punto; con `margin` (px de pantalla) tambien la que esta cerca: pellizcar a medias sobre el borde la agarra. */
  cardAt(screen: V2, margin = 0): CardModel | null {
    let best: CardModel | null = null, bestD = Infinity;
    for (const c of this.cards.values()) {
      const l = this.localOf(c, screen);
      const m = margin / (c.scale * this.board.scale);
      const dx = Math.max(0, Math.abs(l.x) - c.w / 2), dy = Math.max(0, Math.abs(l.y) - c.h / 2);
      if (dx > m || dy > m) continue;
      const d = Math.hypot(dx, dy);
      if (d < bestD - 1e-6 || (Math.abs(d - bestD) <= 1e-6 && best && c.z > best.z)) { best = c; bestD = d; }
    }
    return best;
  }

  /** ¿El punto cae sobre el boton de cerrar (esquina superior derecha) de la tarjeta? */
  onClose(c: CardModel, screen: V2): boolean {
    const l = this.localOf(c, screen);
    return c.closable && Math.hypot(l.x - (c.w / 2 - 20), l.y - (-c.h / 2 + 20)) <= 22;
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
    for (let i = 0; i < 3; i++) this.updateSlot(i, samples[i] ?? null, now, dt);
    if (!this.reader) this.updateZoom();
    this.stepInertia(dt);
    for (const c of this.cards.values()) c.hover = this.slots.some((s) => s.visible && s.hover === c.id);
    return this.events;
  }

  private histAt(slot: Slot, t: number): V2 {
    for (const h of slot.hist) if (h.t >= t) return { x: h.x, y: h.y };
    return { ...slot.cursor };
  }

  private target(p: V2): { over: ReturnType<Interaction["overUi"]>; card: CardModel | null } {
    const over = this.overUi(p);
    return { over, card: over ? null : this.cardAt(p, GRAB_MARGIN) };
  }

  private updateSlot(i: number, s: HandSample | null, now: number, dt: number): void {
    const slot = this.slots[i];
    if (!s) {
      if (slot.pinching) this.release(i, now, true); // mano perdida: no cuenta como toque
      slot.visible = false; slot.hover = null; slot.hist = []; this.resetDwell(slot); slot.scrollLast = null;
      return;
    }
    const first = !slot.visible;
    slot.visible = true;
    slot.cursor = first ? { ...s.cursor } : { x: slot.cursor.x + SMOOTH * (s.cursor.x - slot.cursor.x), y: slot.cursor.y + SMOOTH * (s.cursor.y - slot.cursor.y) };
    slot.hist.push({ t: now, x: slot.cursor.x, y: slot.cursor.y });
    while (slot.hist.length > 2 && now - slot.hist[0].t > 0.4) slot.hist.shift();
    if (this.reader) { this.readerSlot(i, slot, s, now, dt); return; }
    const here = this.target(slot.cursor);
    slot.hover = here.card ? here.card.id : null;
    if (s.pinching && !slot.pinching) {
      slot.pinching = true; this.resetDwell(slot);
      // con la mano, el objetivo es lo que hay donde estaba el dedo un instante ANTES de cerrarse (al cerrar, el cursor se corre)
      let t = here;
      if (i < 2) { const past = this.target(this.histAt(slot, now - LOOKBACK_S)); if (past.over || past.card) t = past; }
      this.pinchStart(i, slot, t.over, t.card, now);
    } else if (!s.pinching && slot.pinching) this.release(i, now);
    else if (slot.pinching && slot.grab && !this.zoom) this.drag(slot, now);
    if (i < 2 && !slot.pinching && !this.zoom) this.dwellStep(slot, here, now); else if (slot.pinching) this.resetDwell(slot);
  }

  // -- permanencia ("clic" apuntando y quedandose quieto) ---------------------------------------------------------
  private resetDwell(slot: Slot): void { slot.dwell = 0; slot.dwellKey = null; slot.dwellDone = null; }

  private dwellStep(slot: Slot, here: { over: ReturnType<Interaction["overUi"]>; card: CardModel | null }, now: number): void {
    let key: string | null = null, dur = DWELL_S.tap;
    if (here.over) { key = here.over.type === "ring" ? "ring" : `orbit:${here.over.id}`; dur = here.over.type === "ring" ? DWELL_S.ring : DWELL_S.orbit; }
    else {
      const c = this.cardAt(slot.cursor, 0);
      if (c) { if (this.onClose(c, slot.cursor)) { key = `close:${c.id}`; dur = DWELL_S.close; } else { key = `tap:${c.id}`; } }
    }
    this.dwellRun(slot, key, dur, now);
  }

  private dwellRun(slot: Slot, key: string | null, dur: number, now: number): void {
    if (!key) { this.resetDwell(slot); return; }
    if (key !== slot.dwellKey) { slot.dwellKey = key; slot.dwellAnchor = { ...slot.cursor }; slot.dwellT0 = now; slot.dwell = 0; if (slot.dwellDone !== key) slot.dwellDone = null; return; }
    if (slot.dwellDone === key) { slot.dwell = 0; return; } // ya disparo: hay que salir del objetivo para volver a usarlo
    if (dist(slot.cursor, slot.dwellAnchor) > DWELL_RADIUS) { slot.dwellAnchor = { ...slot.cursor }; slot.dwellT0 = now; slot.dwell = 0; return; }
    slot.dwell = clamp((now - slot.dwellT0) / dur, 0, 1);
    if (slot.dwell < 1) return;
    slot.dwellDone = key; slot.dwell = 0;
    if (key === "ring") this.events.push({ type: "ring" });
    else if (key === "reader_close") this.events.push({ type: "reader_close" });
    else if (key.startsWith("orbit:")) this.events.push({ type: "orbit", id: key.slice(6) });
    else if (key.startsWith("close:")) { const id = key.slice(6); this.events.push({ type: "close", id }); this.removeCard(id); }
    else if (key.startsWith("tap:")) this.events.push({ type: "tap", id: key.slice(4) });
  }

  // -- lector de documentos abierto ------------------------------------------------------------------------------
  private readerSlot(i: number, slot: Slot, s: HandSample, now: number, dt: number): void {
    const r = this.reader!;
    slot.hover = null;
    const inside = slot.cursor.x >= r.x && slot.cursor.x <= r.x + r.w && slot.cursor.y >= r.y && slot.cursor.y <= r.y + r.h;
    const closeHit = dist(slot.cursor, { x: r.x + r.w - 34, y: r.y + 34 }) <= 30;
    if (s.pinching && !slot.pinching) {                      // pellizco: en el boton cierra, dentro arrastra el texto, fuera cierra
      slot.pinching = true; this.resetDwell(slot);
      slot.start = { ...slot.cursor }; slot.startT = now; slot.scrollLast = { ...slot.cursor };
      if (closeHit) { this.events.push({ type: "reader_close" }); slot.scrollLast = null; }
      return;
    }
    if (!s.pinching && slot.pinching) {
      slot.pinching = false; slot.scrollLast = null;
      if (!inside && now - slot.startT <= TAP_MAX_S && dist(slot.cursor, slot.start) <= TAP_MAX_MOVE) this.events.push({ type: "reader_close" });
      return;
    }
    if (slot.pinching) {
      if (slot.scrollLast && inside) { const dy = slot.scrollLast.y - slot.cursor.y; if (dy !== 0) this.events.push({ type: "scroll", dy }); }
      slot.scrollLast = { ...slot.cursor };
      return;
    }
    if (i >= 2) return; // el raton usa la rueda
    if (inside && !closeHit) {                               // apuntando a la franja de arriba/abajo: desplaza (sin pellizcar)
      const rel = (slot.cursor.y - r.y) / r.h;
      if (rel < SCROLL_BAND) this.events.push({ type: "scroll", dy: -((SCROLL_BAND - rel) / SCROLL_BAND) * SCROLL_SPEED * dt });
      else if (rel > 1 - SCROLL_BAND) this.events.push({ type: "scroll", dy: ((rel - (1 - SCROLL_BAND)) / SCROLL_BAND) * SCROLL_SPEED * dt });
    }
    this.dwellRun(slot, closeHit ? "reader_close" : null, DWELL_S.reader_close, now);
  }

  private pinchStart(i: number, slot: Slot, over: ReturnType<Interaction["overUi"]>, card: CardModel | null, now: number): void {
    if (over) { this.events.push(over.type === "ring" ? { type: "ring" } : { type: "orbit", id: over.id }); return; }
    if (!card) return;
    if (this.onClose(card, slot.cursor)) { this.events.push({ type: "close", id: card.id }); this.removeCard(card.id); return; }
    const b = this.toBoard(slot.cursor);
    slot.grab = card.id;
    slot.off = { x: b.x - card.x, y: b.y - card.y };
    slot.last = { ...slot.cursor }; slot.lastT = now; slot.start = { ...slot.cursor }; slot.startT = now;
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

  private release(i: number, now: number, lost = false): void {
    const slot = this.slots[i];
    const wasZoom = this.zoom !== null && i < 2;
    slot.pinching = false;
    if (slot.grab) {
      const c = this.cards.get(slot.grab);
      if (c) {
        c.held = null;
        if (!lost && !wasZoom && now - slot.startT <= TAP_MAX_S && dist(slot.cursor, slot.start) <= TAP_MAX_MOVE) { this.events.push({ type: "tap", id: c.id }); }
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
