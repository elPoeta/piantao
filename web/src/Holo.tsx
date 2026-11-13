import { useEffect, useRef, useState } from "preact/hooks";
import { Link } from "./api";
import { Msg } from "./Chat";
import { HandSample, HandsInput, Interaction, Lm, REACH, Viewport, setPinchSensitivity } from "./holo-logic";
import { Markdown } from "./markdown";
import { renderCard, renderTile, TileKind } from "./holo-cards";
import { HoloScene } from "./holo-scene";
import { VisionClient } from "./vision";
import type { VisionUi } from "./VisionBar";
import type { VoiceUi } from "./VoiceBar";

export interface BoardCard { id: string; title: string; text: string; image: string | null; origin: string; ts: number }

const ORBITS = [{ id: "files", label: "Archivos" }, { id: "arrange", label: "Ordenar" }, { id: "clear", label: "Limpiar" }];
const PAGE = 10;

export interface Doc { title: string; text: string; image: string | null; origin: string; md: boolean }
interface Entry { name: string; kind: TileKind; size: number }
interface Fx { root: number | null; path: string; parent: string | null; entries: Entry[]; page: number; roots: { root: number; name: string }[] }
const KIND_LABEL: Record<string, string> = { dir: "carpeta", image: "imagen", text: "texto", pdf: "PDF", other: "otro" };
const sizeText = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MiB` : n > 1024 ? `${Math.round(n / 1024)} KiB` : `${n} B`);
const loadSens = (): number => { try { const v = parseFloat(localStorage.getItem("piantao.pinch") ?? ""); return v >= 0.25 && v <= 0.6 ? v : 0.42; } catch { return 0.42; } };
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
  const fxOpen = useRef((_id: string) => {}); const fxCloseReader = useRef(() => {});
  const fxToggle = useRef(() => {}); const fxArrange = useRef(() => {}); const fxClear = useRef(() => {});
  const [list, setList] = useState<{ id: string; title: string; local: boolean }[]>([]);
  const [webgl, setWebgl] = useState(true);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [fx, setFx] = useState<Fx | null>(null);
  const [sens, setSens] = useState(loadSens);
  const docs = useRef(new Map<string, Doc>());
  const [reader, setReader] = useState<(Doc & { id: string }) | null>(null);
  const readerEl = useRef<HTMLDivElement>(null);
  const bodyEl = useRef<HTMLDivElement>(null);
  const readerOn = useRef(false); readerOn.current = !!reader;
  const tiles = useRef<string[]>([]);
  const tileAct = useRef(new Map<string, () => void>());
  const seq = useRef(0);
  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(""), 4000); };

  const refreshList = () => setList([...known.current].map((id) => ({ id, ...(meta.current.get(id) ?? { title: id, local: false }) })));
  const meta = useRef(new Map<string, { title: string; local: boolean }>());

  async function addCard(c: { id: string; title: string; text: string; origin: string; image?: string | null; full?: string; md?: boolean }, local: boolean) {
    if (known.current.has(c.id)) return;
    known.current.add(c.id);
    docs.current.set(c.id, { title: c.title, text: c.full ?? c.text, image: c.image ? (c.image.startsWith("/") ? c.image : `/media/${encodeURIComponent(c.image)}`) : null, origin: c.origin, md: c.md ?? (c.origin === "model" || c.origin === "user") });
    meta.current.set(c.id, { title: c.title, local });
    const image = c.image ? await loadImage(c.image.startsWith("/") ? c.image : `/media/${encodeURIComponent(c.image)}`) : null;
    if (!known.current.has(c.id)) return; // se cerro mientras cargaba la imagen
    if (c.image && !image) c.text = (c.text ? c.text + "\n" : "") + "(no se pudo cargar la imagen)";
    const art = renderCard({ id: c.id, title: c.title, text: c.text, origin: c.origin, image });
    it.current.addCard(c.id, art.w, art.h);
    scene.current?.setCard(c.id, art.canvas, art.w, art.h);
    refreshList();
  }

  // -- explorador de archivos (solo lectura, mismas carpetas que el agente) ------------------------------------------------
  function clearTiles() {
    for (const id of tiles.current) { it.current.removeCard(id); scene.current?.removeCard(id); }
    tiles.current = []; tileAct.current.clear();
  }
  function showTiles(f: Fx) {
    clearTiles();
    const items: { name: string; kind: TileKind; act: () => void }[] = [];
    if (f.root === null) f.roots.forEach((r) => items.push({ name: r.name, kind: "root", act: () => void browse(r.root, "") }));
    else {
      if (f.parent !== null) items.push({ name: "Subir", kind: "up", act: () => void browse(f.root!, f.parent!) });
      else if (f.roots.length > 1) items.push({ name: "Carpetas", kind: "up", act: () => void showRoots() });
      const slice = f.entries.slice(f.page * PAGE, f.page * PAGE + PAGE);
      for (const e of slice) items.push({ name: e.name, kind: e.kind, act: () => (e.kind === "dir" ? void browse(f.root!, join(f.path, e.name)) : void openFile(f.root!, join(f.path, e.name))) });
      if (f.entries.length > (f.page + 1) * PAGE) items.push({ name: `más (${f.entries.length - (f.page + 1) * PAGE})`, kind: "more", act: () => { const n = { ...f, page: f.page + 1 }; setFx(n); showTiles(n); } });
      else if (f.page > 0) items.push({ name: "Primera página", kind: "more", act: () => { const n = { ...f, page: 0 }; setFx(n); showTiles(n); } });
    }
    items.forEach((t, i) => {
      const art = renderTile(t.name, t.kind);
      const id = `tile-${seq.current}-${i}`;
      it.current.addCard(id, art.w, art.h, { closable: false });
      scene.current?.setCard(id, art.canvas, art.w, art.h);
      tiles.current.push(id); tileAct.current.set(id, t.act);
    });
  }
  async function showRoots() {
    const mine = ++seq.current;
    try {
      const roots = (await live.current.link.command("files_roots")) as { root: number; name: string; exists: boolean }[];
      if (mine !== seq.current) return;
      const ok = roots.filter((r) => r.exists);
      if (ok.length === 0) { flash("No hay carpetas autorizadas para mostrar (permissions.yaml → file_access.allowed_dirs)."); return; }
      if (ok.length === 1) { await browse(ok[0].root, "", ok); return; }
      const f: Fx = { root: null, path: "", parent: null, entries: [], page: 0, roots: ok };
      setFx(f); showTiles(f);
    } catch (e) { flash((e as Error).message); }
  }
  async function browse(root: number, path: string, roots?: { root: number; name: string }[]) {
    const mine = ++seq.current;
    try {
      const r = (await live.current.link.command("files_list", { root, path })) as { entries: Entry[]; path: string; parent: string | null; total: number };
      if (mine !== seq.current) return;
      const prev = roots ?? (await rootsOf());
      const f: Fx = { root, path: r.path, parent: r.parent, entries: r.entries, page: 0, roots: prev };
      setFx(f); showTiles(f);
      if (r.entries.length === 0) flash("Carpeta vacía");
      else if (r.total > r.entries.length) flash(`Se muestran ${r.entries.length} de ${r.total} elementos`);
    } catch (e) { flash((e as Error).message); }
  }
  async function rootsOf() {
    try { return ((await live.current.link.command("files_roots")) as { root: number; name: string; exists: boolean }[]).filter((r) => r.exists); } catch { return []; }
  }
  async function openFile(root: number, path: string) {
    try {
      const r = (await live.current.link.command("files_read", { root, path })) as { name: string; kind: string; size: number; text?: string; url?: string; truncated?: boolean };
      let text = r.text ?? "";
      if (r.kind === "other") text = `Sin vista previa para este tipo de archivo (${sizeText(r.size)}).`;
      else if (r.kind === "pdf" && !text) text = "PDF sin texto extraíble (puede ser un escaneo).";
      else if (r.truncated) text += "\n…";
      const full = r.kind === "image" ? "" : text;
      const doc = { id: `local-file-${Date.now()}`, title: r.name, text: full.slice(0, 700), full, origin: "file", image: r.kind === "image" ? r.url : null, md: /\.(md|markdown)$/i.test(r.name) };
      void addCard(doc, true);
      openReader(doc.id, { title: doc.title, text: full, image: doc.image ?? null, origin: "file", md: doc.md });
    } catch (e) { flash((e as Error).message); }
  }
  function openReader(id: string, doc?: Doc) {
    const d = doc ?? docs.current.get(id);
    if (!d) return;
    setReader({ ...d, id });
  }
  const closeReader = () => setReader(null);
  const join = (a: string, b: string) => (a ? `${a}/${b}` : b);
  function toggleFiles() { if (fx) { seq.current++; setFx(null); clearTiles(); } else void showRoots(); }
  function arrange() { it.current.arrange([...known.current, ...tiles.current]); }
  function clearAll() { for (const c of [...list]) dropCard(c.id); live.current.onClearBoard(); }

  function dropCard(id: string) {
    if (!known.current.has(id)) return;
    known.current.delete(id);
    it.current.removeCard(id); scene.current?.removeCard(id);
    const m = meta.current.get(id); meta.current.delete(id); docs.current.delete(id);
    if (readerOn.current && reader?.id === id) setReader(null);
    if (m && !m.local) live.current.onCloseCard(id);
    refreshList();
  }

  fxOpen.current = (id) => openReader(id); fxCloseReader.current = closeReader;
  fxToggle.current = toggleFiles; fxArrange.current = arrange; fxClear.current = clearAll;
  useEffect(() => { setPinchSensitivity(sens); try { localStorage.setItem("piantao.pinch", String(sens)); } catch { /* sin almacenamiento */ } }, [sens]);

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
      const vp: Viewport = { vw: vv?.videoWidth || 640, vh: vv?.videoHeight || 480, cw: r.width, ch: r.height, mirror: true, amp: REACH };
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
      const re = readerEl.current;
      if (re) { const a = el.getBoundingClientRect(), b = re.getBoundingClientRect(); inter.reader = { x: b.left - a.left, y: b.top - a.top, w: b.width, h: b.height }; } else inter.reader = null;
      const evs = inter.update([hs[0] ?? null, hs[1] ?? null, mouse], now / 1000);
      for (const e of evs) {
        if (e.type === "close") dropCard(e.id);
        else if (e.type === "ring") live.current.onToggleMic();
        else if (e.type === "orbit") { if (e.id === "files") fxToggle.current(); else if (e.id === "arrange") fxArrange.current(); else if (e.id === "clear") fxClear.current(); }
        else if (e.type === "tap") { const act = tileAct.current.get(e.id); if (act) act(); else fxOpen.current(e.id); }
        else if (e.type === "scroll") { if (bodyEl.current) bodyEl.current.scrollTop += e.dy; }
        else if (e.type === "reader_close") fxCloseReader.current();
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
      sc.dispose(); scene.current = undefined; known.current.clear(); meta.current.clear(); tiles.current = []; tileAct.current.clear(); inter.clear();
    };
  }, []);

  useEffect(() => {
    if (!reader) return;
    bodyEl.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setReader(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [reader?.id]);

  // sincroniza las tarjetas del servidor con la escena
  useEffect(() => {
    const ids = new Set(p.cards.map((c) => c.id));
    for (const c of p.cards) void addCard({ ...c, full: c.text }, false);
    for (const id of [...known.current]) if (!id.startsWith("local-") && !ids.has(id)) {
      known.current.delete(id); meta.current.delete(id); docs.current.delete(id); it.current.removeCard(id); scene.current?.removeCard(id);
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
      {reader && (
        <div class="holo-backdrop" onClick={closeReader}>
          <div class="holo-reader" role="dialog" aria-modal="true" aria-label={reader.title} ref={readerEl} onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>{reader.title}</h2>
              <span class="small muted">{reader.origin === "model" ? "Piantao" : reader.origin === "user" ? "vos" : reader.origin === "file" ? "archivo" : "sistema"}</span>
              {!reader.id.startsWith("tile-") && docs.current.has(reader.id) && <button type="button" class="ghost" onClick={() => { dropCard(reader.id); closeReader(); }}>Quitar del tablero</button>}
            </header>
            <button type="button" class="holo-x" aria-label="Cerrar lector" onClick={closeReader}>✕</button>
            <div class="holo-reader-body" ref={bodyEl} tabIndex={0}>
              {reader.image && <img src={reader.image} alt={reader.title} />}
              {reader.text && (reader.md ? <Markdown text={reader.text} /> : <pre>{reader.text}</pre>)}
              {!reader.image && !reader.text && <p class="muted">(vacío)</p>}
            </div>
            {camOn && <><div class="holo-edge top" aria-hidden="true">▲ apuntá acá para subir</div><div class="holo-edge bottom" aria-hidden="true">▼ apuntá acá para bajar</div></>}
          </div>
        </div>
      )}
      <div class="holo-top">
        <button type="button" class="ghost" onClick={p.onExit}>← Volver al chat</button>
        <button type="button" class={fx ? "mic mic-on" : "ghost"} aria-pressed={!!fx} onClick={toggleFiles}>Archivos</button>
        <details class="holo-list">
          <summary>Tarjetas ({list.length})</summary>
          {list.length === 0 ? <p class="muted small">No hay tarjetas. Pedile a Piantao que te muestre algo, o usá las órbitas.</p> :
            <ul>{list.map((c) => <li key={c.id}><span>{c.title}</span> <button type="button" class="ghost" onClick={() => dropCard(c.id)}>Cerrar</button></li>)}</ul>}
        </details>
        {fx && (
          <nav class="holo-files" aria-label="Explorador de archivos">
            <p class="small muted">{fx.root === null ? "Carpetas autorizadas" : `/${fx.roots.find((r) => r.root === fx.root)?.name ?? ""}${fx.path ? "/" + fx.path : ""}`}</p>
            <ul>
              {fx.root !== null && fx.parent !== null && <li><button type="button" class="linklike" onClick={() => void browse(fx.root!, fx.parent!)}>⬑ Subir</button></li>}
              {fx.root !== null && fx.parent === null && fx.roots.length > 1 && <li><button type="button" class="linklike" onClick={() => void showRoots()}>⬑ Carpetas</button></li>}
              {fx.root === null && fx.roots.map((r) => <li key={r.root}><button type="button" class="linklike" onClick={() => void browse(r.root, "")}>📁 {r.name}</button></li>)}
              {fx.root !== null && fx.entries.slice(fx.page * PAGE, fx.page * PAGE + PAGE).map((e) => (
                <li key={e.name}><button type="button" class="linklike" onClick={() => (e.kind === "dir" ? void browse(fx.root!, join(fx.path, e.name)) : void openFile(fx.root!, join(fx.path, e.name)))}>{e.name}</button> <span class="small muted">{KIND_LABEL[e.kind] ?? e.kind}{e.kind !== "dir" ? ` · ${sizeText(e.size)}` : ""}</span></li>
              ))}
            </ul>
            {fx.root !== null && fx.entries.length > PAGE && (
              <p class="small"><button type="button" class="ghost" disabled={fx.page === 0} onClick={() => { const n = { ...fx, page: fx.page - 1 }; setFx(n); showTiles(n); }}>◂</button> {fx.page + 1}/{Math.ceil(fx.entries.length / PAGE)} <button type="button" class="ghost" disabled={(fx.page + 1) * PAGE >= fx.entries.length} onClick={() => { const n = { ...fx, page: fx.page + 1 }; setFx(n); showTiles(n); }}>▸</button></p>
            )}
          </nav>
        )}
        <span class="small muted holo-help">{camOn ? "Apuntá y quedate quieto ~1 s para abrir · pellizcá para mover · dos manos pellizcando: zoom y giro" : "Clic en una tarjeta para abrirla · arrastrar para moverla · rueda: zoom"}</span>
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
        <button type="button" class="ghost" onClick={arrange}>Ordenar</button>
        <button type="button" class="ghost" onClick={() => it.current.resetView()}>Vista 1:1</button>
        <button type="button" class="ghost" disabled={list.length === 0} onClick={clearAll}>Limpiar</button>
        {camOn && <label class="small holo-sens" title="Más a la derecha = pellizca con más facilidad">Pellizco <input type="range" min="0.25" max="0.6" step="0.01" value={sens} aria-label="Sensibilidad del pellizco" onInput={(e) => setSens(parseFloat((e.target as HTMLInputElement).value))} /></label>}
      </form>
      {p.vis.error && <p class="error small holo-err" role="alert">{p.vis.error}</p>}
    </div>
  );
}
