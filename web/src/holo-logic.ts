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
export const DWELL_S = { tap: 0.85, row: 0.8, orbit: 1.0, ring: 1.2, close: 1.2 };
export const HOLD_S = 1.0;           // quieto este tiempo mientras se sostiene: ventana lee->mueve, tarjeta mueve->gira en 3D
export const STILL_PX = 24;
export const FLICK_SPEED = 1800;     // px/s: soltar a esta velocidad hacia afuera de la pantalla la descarta
export const TILT = { gain: 0.006, max: 1.15 };
export const SCROLL_LOCAL_SPEED = 700; // px del documento por segundo al apuntar a la franja
export const DWELL_RADIUS = 38;      // el cursor puede temblar hasta esto sin perder el progreso
export const SCROLL_BAND = 0.14;     // fraccion superior/inferior del cuerpo de una ventana que desplaza al apuntar
export const REACH = 1;              // 1 = el cursor cae exactamente sobre el dedo que se ve en el video (sin amplificar)
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
  constructor(private minCutoff = 2.2, private beta = 0.02, private dCutoff = 1.0) {}
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

export interface HandSample { cursor: V2; pinching: boolean; rotate?: boolean }

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
export type CardKind = "card" | "window" | "list";
export interface Row { id: string; y0: number; y1: number }          // filas de una lista: y relativa al borde superior de la tarjeta
export interface CardModel {
  id: string; x: number; y: number; w: number; h: number; scale: number; rot: number; rx: number; ry: number; z: number; vx: number; vy: number;
  held: number | null; hover: boolean; closable: boolean; kind: CardKind; titleH: number; rows: Row[]; flick: boolean;
}
export interface RingModel { x: number; y: number; r: number; open: boolean; bloom: number }
export interface OrbitItem { id: string; x: number; y: number; r: number }
export type HoloEvent =
  | { type: "close"; id: string } | { type: "ring" } | { type: "orbit"; id: string } | { type: "grab"; id: string } | { type: "drop"; id: string }
  | { type: "tap"; id: string } | { type: "row"; id: string; row: string } | { type: "scroll"; id: string; dy: number };
type Mode = "none" | "move" | "scroll" | "rotate";
type Zone = { t: "close" } | { t: "title" } | { t: "row"; row: string } | { t: "body" };
const RING = "@ring";

export interface Slot {
  visible: boolean; pinching: boolean; cursor: V2; grab: string | null; off: V2; hover: string | null; last: V2; lastT: number; start: V2; startT: number;
  hist: { t: number; x: number; y: number }[]; dwell: number; dwellKey: string | null; dwellAnchor: V2; dwellT0: number; dwellDone: string | null;
  mode: Mode; hold: number; anchor: V2; anchorT: number; zone: Zone | null; rotBase: { rx: number; ry: number; at: V2 } | null; moved: boolean;
}
const newSlot = (): Slot => ({ visible: false, pinching: false, cursor: { x: 0, y: 0 }, grab: null, off: { x: 0, y: 0 }, hover: null, last: { x: 0, y: 0 }, lastT: 0, start: { x: 0, y: 0 }, startT: 0,
  hist: [], dwell: 0, dwellKey: null, dwellAnchor: { x: 0, y: 0 }, dwellT0: 0, dwellDone: null, mode: "none", hold: 0, anchor: { x: 0, y: 0 }, anchorT: 0, zone: null, rotBase: null, moved: false });

interface Zoom {
  d0: number; a0: number; target: string | "board"; s0: number; r0: number; world0: V2; mid0: V2; t0: V2;
}

export const POINTER = 2; // ranura del raton
type Over = { type: "orbit"; id: string } | { type: "ring" } | null;

export class Interaction {
  cards = new Map<string, CardModel>();
  board = { scale: 1, tx: 0, ty: 0 };
  /** El nucleo: se mueve (pellizco-arrastre), un toque lo abre/cierra y al abrirse despliega las burbujas. */
  ring: RingModel = { x: 0, y: 0, r: 44, open: false, bloom: 0 };
  orbitIds: string[] = [];
  orbits: OrbitItem[] = [];
  slots: Slot[] = [newSlot(), newSlot(), newSlot()];
  events: HoloEvent[] = [];
  zoom: Zoom | null = null;
  cw = 800; ch = 600;
  private zc = 1;
  private placed = 0;
  private ringMoved = false;

  setSize(cw: number, ch: number): void {
    this.cw = cw; this.ch = ch;
    if (!this.ringMoved) { this.ring.x = Math.min(150, cw / 2); this.ring.y = Math.min(110, ch * 0.2); }  // arriba a la izquierda: no tapa las ventanas centradas
    else { this.ring.x = clamp(this.ring.x, this.ring.r, cw - this.ring.r); this.ring.y = clamp(this.ring.y, this.ring.r, ch - this.ring.r); }
  }
  setOrbits(ids: string[]): void { this.orbitIds = ids; this.layoutOrbits(); }
  setOpen(open: boolean): void { this.ring.open = open; }

  private layoutOrbits(): void {
    const n = this.orbitIds.length, R = (this.ring.r + 82) * this.ring.bloom, rr = 34 * this.ring.bloom;
    const dir = this.ring.y < this.ch * 0.55 ? 1 : -1;               // se abren hacia donde hay lugar
    const span = Math.min(Math.PI * 0.8, 0.5 * Math.PI + 0.1 * n);
    this.orbits = this.orbitIds.map((id, k) => {
      const a = n === 1 ? Math.PI / 2 : Math.PI / 2 - span / 2 + (span * k) / (n - 1);
      return { id, x: this.ring.x + Math.cos(a) * R, y: this.ring.y + dir * Math.sin(a) * R, r: rr };
    });
  }

  /** Una tarjeta nueva va al primer hueco libre; una ventana al centro (ajustada para entrar entera, en cascada si hay otras). */
  addCard(id: string, w: number, h: number, opts: { closable?: boolean; kind?: CardKind; titleH?: number; rows?: Row[] } = {}): CardModel {
    const kind = opts.kind ?? "card";
    const c: CardModel = { id, w, h, scale: 1, rot: 0, rx: 0, ry: 0, z: ++this.zc, vx: 0, vy: 0, held: null, hover: false, closable: opts.closable !== false,
      kind, titleH: opts.titleH ?? 0, rows: opts.rows ?? [], flick: false, x: 0, y: 0 };
    if (kind === "window") {
      c.scale = clamp(Math.min((this.ch - 160) / h, (this.cw - 30) / w, 1), CARD_SCALE.min, 1);  // entre la barra superior (~56 px) y la inferior (~70 px)
      const k = [...this.cards.values()].filter((o) => o.kind === "window").length % 6;
      const p = this.toBoard({ x: this.cw / 2 + 28 * k, y: (56 + this.ch - 70) / 2 + 24 * k });
      c.x = p.x; c.y = p.y;
    } else { const p = this.freeSpot(w, h); c.x = p.x; c.y = p.y; }
    this.cards.set(id, c);
    this.placed++;
    return c;
  }

  /** Cambia el contenido de una tarjeta (p. ej. otra carpeta en la lista) conservando su posicion. */
  resize(id: string, w: number, h: number, rows: Row[] = []): void {
    const c = this.cards.get(id);
    if (c) { c.w = w; c.h = h; c.rows = rows; }
  }

  private area(): { x0: number; y0: number; x1: number; y1: number } {
    return { x0: 16, y0: Math.min(this.ring.y + this.ring.r + 24, this.ch * 0.3), x1: this.cw - 16, y1: this.ch - 84 };
  }

  private freeSpot(w: number, h: number): V2 {
    const a = this.area(), gap = 14;
    const boxes = [...this.cards.values()].map((c) => {
      const s = this.toScreenFromBoard({ x: c.x, y: c.y });
      return { x: s.x, y: s.y, hw: (c.w * c.scale * this.board.scale) / 2 + gap, hh: (c.h * c.scale * this.board.scale) / 2 + gap };
    });
    const free = (x: number, y: number) => boxes.every((b) => Math.abs(b.x - x) >= b.hw + w / 2 || Math.abs(b.y - y) >= b.hh + h / 2);
    const xs = [a.x0 + w / 2, ...boxes.map((b) => b.x + b.hw + w / 2)].filter((x) => x <= a.x1 - w / 2).sort((p, q) => p - q);
    const ys = [a.y0 + h / 2, ...boxes.map((b) => b.y + b.hh + h / 2)].filter((y) => y <= a.y1 - h / 2).sort((p, q) => p - q);
    for (const y of ys) for (const x of xs) if (free(x, y)) return this.toBoard({ x, y });
    const k = this.placed % 8; // sin hueco: en cascada, siempre dentro de la pantalla
    return this.toBoard({ x: clamp(a.x0 + w / 2 + 30 * k, w / 2, this.cw - w / 2), y: clamp(a.y0 + h / 2 + 24 * k, h / 2, this.ch - h / 2 - 70) });
  }

  /** Reordena las tarjetas (no las ventanas) en una grilla que entra entera en pantalla; las achica hasta 0,4× si hace falta. */
  arrange(ids?: string[]): void {
    this.resetView();
    const list = [...this.cards.values()].filter((c) => c.kind !== "window" && (!ids || ids.includes(c.id))).sort((p, q) => p.z - q.z);
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
        list.forEach((c, i) => { const p = pos[i] ?? { x: this.cw / 2, y: this.ch / 2 }; c.scale = f; c.rot = c.rx = c.ry = 0; c.x = p.x; c.y = p.y; c.vx = c.vy = 0; });
        return;
      }
    }
  }

  removeCard(id: string): void {
    this.cards.delete(id);
    for (const s of this.slots) if (s.grab === id) { s.grab = null; s.mode = "none"; }
    if (this.zoom && this.zoom.target === id) this.zoom = null;
  }
  clear(): void { this.cards.clear(); this.zoom = null; for (const s of this.slots) { s.grab = null; s.mode = "none"; } this.placed = 0; }

  // -- geometria ---------------------------------------------------------------------------------------------------
  toBoard(p: V2): V2 { return { x: (p.x - this.board.tx) / this.board.scale, y: (p.y - this.board.ty) / this.board.scale }; }
  toScreenFromBoard(p: V2): V2 { return { x: p.x * this.board.scale + this.board.tx, y: p.y * this.board.scale + this.board.ty }; }

  /** Punto de pantalla en el espacio local de la tarjeta (centro = 0,0; sin escala de la tarjeta; la inclinacion 3D no se considera). */
  localOf(c: CardModel, screen: V2): V2 {
    const b = this.toBoard(screen);
    const dx = b.x - c.x, dy = b.y - c.y;
    const cos = Math.cos(-c.rot), sin = Math.sin(-c.rot);
    return { x: (dx * cos - dy * sin) / c.scale, y: (dx * sin + dy * cos) / c.scale };
  }

  /** Tarjeta bajo el punto; con `margin` (px de pantalla) tambien la cercana. Gana la mas cercana; a igual distancia, la de arriba. */
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
  /** Trae la tarjeta al frente. */
  raise(id: string): void { const c = this.cards.get(id); if (c) c.z = ++this.zc; }
  windowAt(screen: V2): CardModel | null { const c = this.cardAt(screen, 0); return c && c.kind === "window" ? c : null; }

  /** Que parte de la tarjeta esta bajo el punto: cerrar, barra de titulo (ventanas), fila (listas) o cuerpo. */
  zoneOf(c: CardModel, screen: V2): Zone {
    const l = this.localOf(c, screen);
    const top = l.y + c.h / 2;
    if (c.kind === "window") return top <= c.titleH ? { t: "title" } : { t: "body" };
    if (c.closable && Math.hypot(l.x - (c.w / 2 - 20), l.y - (-c.h / 2 + 20)) <= 24) return { t: "close" };
    if (c.kind === "list") { const r = c.rows.find((q) => top >= q.y0 && top < q.y1 && Math.abs(l.x) <= c.w / 2); if (r) return { t: "row", row: r.id }; }
    return { t: "body" };
  }

  private overUi(p: V2): Over {
    if (this.ring.bloom > 0.6) for (const o of this.orbits) if (Math.hypot(p.x - o.x, p.y - o.y) <= o.r) return { type: "orbit", id: o.id };
    if (Math.hypot(p.x - this.ring.x, p.y - this.ring.y) <= this.ring.r) return { type: "ring" };
    return null;
  }

  // -- actualizacion ------------------------------------------------------------------------------------------------
  /** `samples[0..1]` = manos, `samples[2]` = puntero (raton). Devuelve los eventos ocurridos en este cuadro. */
  update(samples: (HandSample | null)[], now: number): HoloEvent[] {
    this.events = [];
    const dt = this.slots.some((s) => s.lastT) ? Math.min(0.1, Math.max(0.001, now - Math.max(...this.slots.map((s) => s.lastT)))) : 0.016;
    this.ring.bloom += ((this.ring.open ? 1 : 0) - this.ring.bloom) * Math.min(1, dt * 9);
    if (Math.abs(this.ring.bloom - (this.ring.open ? 1 : 0)) < 0.002) this.ring.bloom = this.ring.open ? 1 : 0;
    this.layoutOrbits();
    for (let i = 0; i < 3; i++) this.updateSlot(i, samples[i] ?? null, now, dt);
    this.updateZoom();
    this.stepInertia(dt);
    for (const c of this.cards.values()) c.hover = this.slots.some((s) => s.visible && s.hover === c.id);
    return this.events;
  }

  private histAt(slot: Slot, t: number): V2 {
    for (const h of slot.hist) if (h.t >= t) return { x: h.x, y: h.y };
    return { ...slot.cursor };
  }

  private target(p: V2): { over: Over; card: CardModel | null; p: V2 } {
    const over = this.overUi(p);
    return { over, card: over ? null : this.cardAt(p, GRAB_MARGIN), p };
  }

  private updateSlot(i: number, s: HandSample | null, now: number, dt: number): void {
    const slot = this.slots[i];
    if (!s) {
      if (slot.pinching) this.release(i, now, true); // mano perdida: no cuenta como toque
      slot.visible = false; slot.hover = null; slot.hist = []; slot.hold = 0; this.resetDwell(slot);
      return;
    }
    const first = !slot.visible;
    slot.visible = true;
    slot.cursor = first ? { ...s.cursor } : { x: slot.cursor.x + SMOOTH * (s.cursor.x - slot.cursor.x), y: slot.cursor.y + SMOOTH * (s.cursor.y - slot.cursor.y) };
    slot.hist.push({ t: now, x: slot.cursor.x, y: slot.cursor.y });
    while (slot.hist.length > 2 && now - slot.hist[0].t > 0.4) slot.hist.shift();
    const here = this.target(slot.cursor);
    slot.hover = here.card ? here.card.id : null;
    if (s.pinching && !slot.pinching) {
      slot.pinching = true; this.resetDwell(slot);
      // con la mano, el objetivo es lo que hay donde estaba el dedo un instante ANTES de cerrarse (al cerrar, el cursor se corre)
      let t = here;
      if (i < 2) { const past = this.target(this.histAt(slot, now - LOOKBACK_S)); if (past.over || past.card) t = past; }
      this.pinchStart(i, slot, t, now, !!s.rotate);
    } else if (!s.pinching && slot.pinching) this.release(i, now);
    else if (slot.pinching && slot.grab && !this.zoom) this.drag(slot, now);
    if (slot.pinching) this.resetDwell(slot);
    else if (i < 2 && !this.zoom) { this.dwellStep(slot, here, now); this.hoverScroll(slot, dt); }
  }

  // -- permanencia ("clic" apuntando y quedandose quieto) ---------------------------------------------------------
  private resetDwell(slot: Slot): void { slot.dwell = 0; slot.dwellKey = null; slot.dwellDone = null; }

  private dwellStep(slot: Slot, here: { over: Over; card: CardModel | null }, now: number): void {
    let key: string | null = null, dur: number = DWELL_S.tap;
    if (here.over) { key = here.over.type === "ring" ? "ring" : `orbit:${here.over.id}`; dur = here.over.type === "ring" ? DWELL_S.ring : DWELL_S.orbit; }
    else {
      const c = this.cardAt(slot.cursor, 0);
      if (c) {
        const z = this.zoneOf(c, slot.cursor);
        if (z.t === "close" || z.t === "title") { key = `close:${c.id}`; dur = DWELL_S.close; }
        else if (z.t === "row") { key = `row:${c.id}:${z.row}`; dur = DWELL_S.row; }
        else if (c.kind === "card") key = `tap:${c.id}`;
      }
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
    else if (key.startsWith("orbit:")) this.events.push({ type: "orbit", id: key.slice(6) });
    else if (key.startsWith("close:")) { const id = key.slice(6); this.events.push({ type: "close", id }); this.removeCard(id); }
    else if (key.startsWith("row:")) { const [, id, row] = key.split(":"); this.events.push({ type: "row", id, row }); }
    else if (key.startsWith("tap:")) this.events.push({ type: "tap", id: key.slice(4) });
  }

  /** Apuntando (sin pellizcar) a la franja de arriba/abajo del cuerpo de una ventana: desplaza el documento. */
  private hoverScroll(slot: Slot, dt: number): void {
    const c = this.cardAt(slot.cursor, 0);
    if (!c || c.kind !== "window") return;
    const l = this.localOf(c, slot.cursor);
    const top = l.y + c.h / 2 - c.titleH, body = c.h - c.titleH;
    if (top < 0 || top > body) return;
    const rel = top / body;
    if (rel < SCROLL_BAND) this.events.push({ type: "scroll", id: c.id, dy: -((SCROLL_BAND - rel) / SCROLL_BAND) * SCROLL_LOCAL_SPEED * dt });
    else if (rel > 1 - SCROLL_BAND) this.events.push({ type: "scroll", id: c.id, dy: ((rel - (1 - SCROLL_BAND)) / SCROLL_BAND) * SCROLL_LOCAL_SPEED * dt });
  }

  // -- agarrar / mover / desplazar / girar ---------------------------------------------------------------------------
  private pinchStart(i: number, slot: Slot, t: { over: Over; card: CardModel | null; p: V2 }, now: number, rotate: boolean): void {
    slot.start = { ...slot.cursor }; slot.startT = now; slot.moved = false; slot.hold = 0; slot.mode = "none"; slot.zone = null;
    slot.anchor = { ...slot.cursor }; slot.anchorT = now;
    if (t.over && t.over.type === "orbit") { this.events.push({ type: "orbit", id: t.over.id }); return; }
    if (t.over && t.over.type === "ring") {                                   // el nucleo: arrastrar lo mueve, un toque lo abre/cierra
      slot.grab = RING; slot.mode = "move"; slot.zone = { t: "body" };
      slot.off = { x: slot.cursor.x - this.ring.x, y: slot.cursor.y - this.ring.y };
      slot.last = { ...slot.cursor }; slot.lastT = now;
      return;
    }
    const card = t.card;
    if (!card) return;
    const zone = this.zoneOf(card, t.p);
    slot.zone = zone;
    const b = this.toBoard(slot.cursor);
    slot.grab = card.id;
    slot.off = { x: b.x - card.x, y: b.y - card.y };
    slot.last = { ...slot.cursor }; slot.lastT = now;
    card.z = ++this.zc; card.held = i; card.vx = card.vy = 0; card.flick = false;
    slot.mode = rotate ? "rotate" : card.kind === "window" && zone.t === "body" ? "scroll" : "move";
    if (slot.mode === "rotate") slot.rotBase = { rx: card.rx, ry: card.ry, at: { ...slot.cursor } };
    this.events.push({ type: "grab", id: card.id });
  }

  private drag(slot: Slot, now: number): void {
    if (dist(slot.cursor, slot.start) > TAP_MAX_MOVE) slot.moved = true;
    // tiempo quieto con el pellizco cerrado: promueve el modo (leer -> mover -> girar en 3D)
    if (dist(slot.cursor, slot.anchor) > STILL_PX) { slot.anchor = { ...slot.cursor }; slot.anchorT = now; slot.hold = 0; }
    else slot.hold = clamp((now - slot.anchorT) / HOLD_S, 0, 1);
    if (slot.grab === RING) {
      this.ring.x = clamp(slot.cursor.x - slot.off.x, this.ring.r, this.cw - this.ring.r);
      this.ring.y = clamp(slot.cursor.y - slot.off.y, this.ring.r, this.ch - this.ring.r);
      if (slot.moved) this.ringMoved = true;
      return;
    }
    const c = slot.grab ? this.cards.get(slot.grab) : null;
    if (!c) return;
    if (slot.hold >= 1 && slot.mode === "scroll") { slot.mode = "move"; const b = this.toBoard(slot.cursor); slot.off = { x: b.x - c.x, y: b.y - c.y }; slot.hold = 0; slot.anchor = { ...slot.cursor }; slot.anchorT = now; }
    else if (slot.hold >= 1 && slot.mode === "move" && slot.moved) { slot.mode = "rotate"; slot.rotBase = { rx: c.rx, ry: c.ry, at: { ...slot.cursor } }; slot.hold = 0; slot.anchor = { ...slot.cursor }; slot.anchorT = now; c.vx = c.vy = 0; }
    if (slot.mode === "rotate") {
      const base = slot.rotBase ?? { rx: c.rx, ry: c.ry, at: { ...slot.cursor } };
      c.ry = clamp(base.ry + (slot.cursor.x - base.at.x) * TILT.gain, -TILT.max, TILT.max);
      c.rx = clamp(base.rx + (slot.cursor.y - base.at.y) * TILT.gain, -TILT.max, TILT.max);
      return;
    }
    if (slot.mode === "scroll") {
      const dy = (slot.last.y - slot.cursor.y) / (c.scale * this.board.scale);
      if (dy !== 0) this.events.push({ type: "scroll", id: c.id, dy });
      slot.last = { ...slot.cursor }; slot.lastT = now;
      return;
    }
    const b = this.toBoard(slot.cursor);
    c.x = b.x - slot.off.x; c.y = b.y - slot.off.y;
    const dt = now - slot.lastT;
    if (dt > 0.004) {
      c.vx = 0.6 * c.vx + 0.4 * (slot.cursor.x - slot.last.x) / dt / this.board.scale;
      c.vy = 0.6 * c.vy + 0.4 * (slot.cursor.y - slot.last.y) / dt / this.board.scale;
      slot.last = { ...slot.cursor }; slot.lastT = now;
    }
  }

  private release(i: number, now: number, lost = false): void {
    const slot = this.slots[i];
    const wasZoom = this.zoom !== null && i < 2;
    const tap = !lost && !wasZoom && !slot.moved && slot.mode !== "rotate" && now - slot.startT <= TAP_MAX_S && dist(slot.cursor, slot.start) <= TAP_MAX_MOVE;
    slot.pinching = false; slot.hold = 0;
    if (slot.grab === RING) { if (tap) this.events.push({ type: "ring" }); slot.grab = null; slot.mode = "none"; return; }
    if (slot.grab) {
      const c = this.cards.get(slot.grab);
      if (c) {
        c.held = null;
        const z = slot.zone;
        let closed = false;
        if (tap && z) {
          if (z.t === "close" || z.t === "title") { this.events.push({ type: "close", id: c.id }); this.removeCard(c.id); closed = true; }
          else if (z.t === "row") this.events.push({ type: "row", id: c.id, row: z.row });
          else if (c.kind === "card") this.events.push({ type: "tap", id: c.id });
        }
        if (!closed) {
          if (wasZoom || now - slot.lastT > 0.15) c.vx = c.vy = 0; // quieto al soltar: sin lanzamiento involuntario
          const sp = Math.hypot(c.vx, c.vy) * this.board.scale;
          c.flick = slot.mode === "move" && sp >= FLICK_SPEED;
          if (!c.flick) this.keepInside(c);
          this.events.push({ type: "drop", id: c.id });
        }
      }
      slot.grab = null;
    }
    slot.mode = "none";
    if (wasZoom) {
      this.zoom = null;
      for (const s of this.slots.slice(0, 2)) { s.grab = null; s.mode = "none"; } // la mano que sigue pellizcando no arrastra hasta pellizcar de nuevo
    }
  }

  /** Una tarjeta soltada fuera de la pantalla vuelve adentro (nunca queda perdida). */
  private keepInside(c: CardModel): void {
    const lo = this.toBoard({ x: 40, y: 40 }), hi = this.toBoard({ x: this.cw - 40, y: this.ch - 70 });
    c.x = clamp(c.x, lo.x, hi.x); c.y = clamp(c.y, lo.y, hi.y);
  }

  private updateZoom(): void {
    const a = this.slots[0], b = this.slots[1];
    const both = a.visible && b.visible && a.pinching && b.pinching;
    if (!both) { if (this.zoom && !(a.pinching && b.pinching)) this.zoom = null; return; }
    const d = Math.max(20, dist(a.cursor, b.cursor));
    const angle = Math.atan2(b.cursor.y - a.cursor.y, b.cursor.x - a.cursor.x);
    const mid = { x: (a.cursor.x + b.cursor.x) / 2, y: (a.cursor.y + b.cursor.y) / 2 };
    if (!this.zoom) {
      const target = [a.grab, b.grab].find((g) => g && g !== RING) ?? "board";
      const card = target === "board" ? null : this.cards.get(target) ?? null;
      const tgt = card ? target : "board";
      this.zoom = { d0: d, a0: angle, target: tgt, s0: card ? card.scale : this.board.scale, r0: card ? card.rot : 0,
        world0: this.toBoard(mid), mid0: mid, t0: { x: this.board.tx, y: this.board.ty } };
      if (card) { card.vx = card.vy = 0; }
      return;
    }
    const z = this.zoom;
    const ratio = d / z.d0;
    if (z.target === "board") {
      const s = clamp(z.s0 * ratio, BOARD_SCALE.min, BOARD_SCALE.max);
      this.board.scale = s;
      this.board.tx = mid.x - z.world0.x * s;    // el punto del tablero que estaba entre las manos sigue entre las manos
      this.board.ty = mid.y - z.world0.y * s;
    } else {
      const c = this.cards.get(z.target);
      if (c) { c.scale = clamp(z.s0 * ratio, CARD_SCALE.min, CARD_SCALE.max); c.rot = z.r0 + (angle - z.a0); }
    }
  }

  private stepInertia(dt: number): void {
    for (const c of [...this.cards.values()]) {
      if (c.held !== null || (Math.abs(c.vx) < 5 && Math.abs(c.vy) < 5)) { if (c.held === null) c.vx = c.vy = 0; continue; }
      c.x += c.vx * dt; c.y += c.vy * dt;
      if (c.flick) {                                           // lanzada con fuerza: si sale de la pantalla, se descarta
        const s = this.toScreenFromBoard({ x: c.x, y: c.y });
        if (s.x < -c.w * c.scale * 0.2 || s.x > this.cw + c.w * c.scale * 0.2 || s.y < -c.h * c.scale * 0.2 || s.y > this.ch + c.h * c.scale * 0.2) {
          this.events.push({ type: "close", id: c.id }); this.removeCard(c.id);
        } else { const k = Math.exp(-dt * 1.2); c.vx *= k; c.vy *= k; if (Math.hypot(c.vx, c.vy) < 300) { c.flick = false; this.keepInside(c); } }
        continue;
      }
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
