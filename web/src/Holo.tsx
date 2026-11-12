import { useEffect, useRef, useState } from "preact/hooks";
import { Link } from "./api";
import { Msg } from "./Chat";
import { HandSample, HandsInput, Interaction, Lm, Viewport } from "./holo-logic";
import { renderCard, formatRows } from "./holo-cards";
import { HoloScene } from "./holo-scene";
import { VisionClient } from "./vision";
import type { VisionUi } from "./VisionBar";
import type { VoiceUi } from "./VoiceBar";

export interface BoardCard { id: string; title: string; text: string; image: string | null; origin: string; ts: number }

const ORBITS = [
  { id: "audit", label: "Auditoría" }, { id: "memories", label: "Memorias" }, { id: "tools", label: "Herramientas" }, { id: "perms", label: "Permisos" },
];
const STALE_HANDS_MS = 600;

interface Props {
  link: Link; vision: VisionClient; vis: VisionUi; vui: VoiceUi; state: string; connected: boolean;
  cards: BoardCard[]; msgs: Msg[]; busy: boolean;
  onCloseCard: (id: string) => void; onClearBoard: () => void;
  onSend: (t: string) => void; onStop: () => void; onToggleMic: () => void; onToggleCam: () => void; onExit: () => void;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

export function Holo(p: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const skel = useRef<HTMLCanvasElement>(null);
  const it = useRef(new Interaction());
  const scene = useRef<HoloScene>();
  const known = useRef(new Set<string>());
  const live = useRef(p); live.current = p;
  const [list, setList] = useState<{ id: string; title: string; local: boolean }[]>([]);
  const [webgl, setWebgl] = useState(true);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const refreshList = () => setList([...known.current].map((id) => ({ id, ...(meta.current.get(id) ?? { title: id, local: false }) })));
  const meta = useRef(new Map<string, { title: string; local: boolean }>());

  async function addCard(c: { id: string; title: string; text: string; origin: string; image?: string | null }, local: boolean) {
    if (known.current.has(c.id)) return;
    known.current.add(c.id);
    meta.current.set(c.id, { title: c.title, local });
    const image = c.image ? await loadImage(`/media/${encodeURIComponent(c.image)}`) : null;
    if (!known.current.has(c.id)) return; // se cerro mientras cargaba la imagen
    const art = renderCard({ id: c.id, title: c.title, text: c.text, origin: c.origin, image });
    const model = it.current.addCard(c.id, art.w, art.h);
    void model;
    scene.current?.setCard(c.id, art.canvas, art.w, art.h);
    refreshList();
  }

  function dropCard(id: string) {
    if (!known.current.has(id)) return;
    known.current.delete(id);
    it.current.removeCard(id); scene.current?.removeCard(id);
    const m = meta.current.get(id); meta.current.delete(id);
    if (m && !m.local) live.current.onCloseCard(id);
    refreshList();
  }

  async function orbit(id: string) {
    const l = live.current.link;
    try {
      let title = "", data: unknown;
      if (id === "audit") { title = "Auditoría reciente"; data = await l.command("query", { kind: "audit", n: 12 }); }
      else if (id === "memories") { title = "Memorias"; data = await l.command("query", { kind: "memories", limit: 12 }); }
      else if (id === "tools") { title = "Herramientas usadas"; data = await l.command("query", { kind: "tool_history", limit: 12 }); }
      else { title = "Permisos"; data = await l.command("get_permissions"); }
      void addCard({ id: `local-${id}-${Date.now()}`, title, text: formatRows(data), origin: "system" }, true);
    } catch (e) { setMsg((e as Error).message); window.setTimeout(() => setMsg(""), 4000); }
  }

  // escena + bucle
  useEffect(() => {
    const el = root.current!, cv = canvas.current!;
    const sc = new HoloScene(cv);
    scene.current = sc; setWebgl(sc.ok);
    const inter = it.current;
    const layout = () => {
      const r = el.getBoundingClientRect();
      inter.setSize(r.width, r.height);
      inter.orbits = ORBITS.map((o, i) => ({ id: o.id, x: inter.ring.x + 112 + i * 76, y: inter.ring.y, r: 32 }));
      sc.resize(r.width, r.height);
    };
    sc.setOrbits(ORBITS);
    layout();
    const ro = new ResizeObserver(layout); ro.observe(el);

    const hands = new HandsInput();
    let samples: (HandSample | null)[] = [null, null];
    let lastHands = 0;
    const v = live.current.vision;
    v.attach(video.current, skel.current);
    v.hands = (hs: Lm[][], aspect: number) => {
      const r = el.getBoundingClientRect(), vv = video.current;
      const vp: Viewport = { vw: vv?.videoWidth || 640, vh: vv?.videoHeight || 480, cw: r.width, ch: r.height, mirror: true };
      samples = hands.process(hs, aspect, vp); lastHands = performance.now();
    };
    v.owner = () => inter.ownsHands();

    // raton / tactil: ranura 2
    let mouse: HandSample | null = null;
    const pt = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const onMove = (e: PointerEvent) => { mouse = { cursor: pt(e), pinching: !!(e.buttons & 1) }; };
    const onDown = (e: PointerEvent) => { cv.setPointerCapture(e.pointerId); mouse = { cursor: pt(e), pinching: true }; };
    const onUp = (e: PointerEvent) => { mouse = { cursor: pt(e), pinching: false }; if (e.pointerType !== "mouse") mouse = null; };
    const onLeave = () => { mouse = null; };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); inter.wheel(pt(e as unknown as PointerEvent), Math.exp(-e.deltaY * 0.0015)); };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onLeave); cv.addEventListener("pointerleave", onLeave); cv.addEventListener("wheel", onWheel, { passive: false });

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const hs = now - lastHands > STALE_HANDS_MS ? [null, null] : samples;
      const evs = inter.update([hs[0] ?? null, hs[1] ?? null, mouse], now / 1000);
      for (const e of evs) {
        if (e.type === "close") dropCard(e.id);
        else if (e.type === "ring") live.current.onToggleMic();
        else if (e.type === "orbit") void orbit(e.id);
      }
      const cur = live.current;
      sc.render(inter, cur.state, cur.vui.state === "listening" ? cur.vui.level : 0, now / 1000);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onLeave); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("wheel", onWheel);
      v.hands = null; v.owner = null; v.attach(null, null);
      sc.dispose(); scene.current = undefined; known.current.clear(); meta.current.clear(); inter.clear();
    };
  }, []);

  // sincroniza las tarjetas del servidor con la escena
  useEffect(() => {
    const ids = new Set(p.cards.map((c) => c.id));
    for (const c of p.cards) void addCard(c, false);
    for (const id of [...known.current]) if (!id.startsWith("local-") && !ids.has(id)) {
      known.current.delete(id); meta.current.delete(id); it.current.removeCard(id); scene.current?.removeCard(id);
    }
    refreshList();
  }, [p.cards]);

  const last = [...p.msgs].reverse().find((m) => m.role === "assistant");
  const caption = last ? last.parts.filter((x) => x.k === "text").map((x) => (x as { t: string }).t).join("").slice(-320) : "";
  const camOn = p.vis.state === "on";

  return (
    <div class="holo" ref={root}>
      <video ref={video} class="holo-video" playsInline muted aria-hidden="true" style={{ opacity: camOn ? 0.45 : 0 }} />
      <canvas ref={skel} class="holo-skel" aria-hidden="true" style={{ opacity: camOn ? 0.8 : 0 }} />
      <canvas ref={canvas} class="holo-scene" aria-label="Tablero holográfico" />
      <div class="holo-top">
        <button type="button" class="ghost" onClick={p.onExit}>← Volver al chat</button>
        <details class="holo-list">
          <summary>Tarjetas ({list.length})</summary>
          {list.length === 0 ? <p class="muted small">No hay tarjetas. Pedile a Piantao que te muestre algo, o usá las órbitas.</p> :
            <ul>{list.map((c) => <li key={c.id}><span>{c.title}</span> <button type="button" class="ghost" onClick={() => dropCard(c.id)}>Cerrar</button></li>)}</ul>}
        </details>
        <span class="small muted holo-help">{camOn ? "Pellizcá para agarrar · dos manos pellizcando: separá para agrandar, girá para rotar" : "Mouse: arrastrar tarjetas, rueda para zoom"}</span>
        {!webgl && <p class="error small" role="alert">Este navegador no pudo iniciar WebGL: usá la lista de tarjetas.</p>}
        {msg && <p class="error small" role="alert">{msg}</p>}
      </div>
      {caption && <p class="holo-caption" role="status" aria-live="polite">{caption}</p>}
      <form class="holo-bar" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (t && !p.busy && p.connected) { p.onSend(t); setText(""); } }}>
        <input class="holo-input" value={text} maxLength={8000} aria-label="Mensaje" placeholder={p.connected ? "Escribile a Piantao..." : "Sin conexion..."}
          onInput={(e) => setText((e.target as HTMLInputElement).value)} />
        {p.busy ? <button type="button" class="stop" onClick={p.onStop}>Detener</button> : <button type="submit" disabled={!text.trim() || !p.connected}>Enviar</button>}
        {p.vui.available && <button type="button" class={p.vui.state !== "off" ? "mic mic-on" : "ghost"} aria-pressed={p.vui.state !== "off"} onClick={p.onToggleMic}>{p.vui.state !== "off" ? "Apagar mic" : "Micrófono"}</button>}
        {p.vis.available && <button type="button" class={camOn ? "mic mic-on" : "ghost"} aria-pressed={camOn} disabled={p.vis.state === "loading"} onClick={p.onToggleCam}>{camOn ? "Apagar cámara" : p.vis.state === "loading" ? "Cargando..." : "Cámara y manos"}</button>}
        <button type="button" class="ghost" onClick={() => it.current.resetView()}>Restablecer vista</button>
        <button type="button" class="ghost" disabled={list.length === 0} onClick={() => { for (const c of [...list]) if (c.local) dropCard(c.id); p.onClearBoard(); }}>Limpiar tablero</button>
      </form>
      {p.vis.error && <p class="error small holo-err" role="alert">{p.vis.error}</p>}
    </div>
  );
}
