import { useEffect, useRef, useState } from "preact/hooks";
import { Link } from "./api";
import { Msg } from "./Chat";
import { HandSample, HandsInput, Interaction, Lm, Viewport, setPinchSensitivity } from "./holo-logic";
import { IconKind, ListRowSpec, renderCard, renderList } from "./holo-cards";
import { DocView, WIN_H, WIN_TITLE, WIN_W } from "./holo-doc";
import { HoloScene } from "./holo-scene";
import { VisionClient } from "./vision";
import type { VisionUi } from "./VisionBar";
import type { VoiceUi } from "./VoiceBar";

export interface BoardCard { id: string; title: string; text: string; image: string | null; origin: string; ts: number }
export interface Doc { title: string; text: string; image: string | null; origin: string; md: boolean }

const ORBITS = [{ id: "files", label: "Archivos" }, { id: "mic", label: "Mic" }, { id: "arrange", label: "Ordenar" }, { id: "clear", label: "Limpiar" }];
const LIST_ID = "files-list";
const PAGE = 7;
const STALE_HANDS_MS = 600;

interface Entry { name: string; kind: IconKind; size: number }
interface Fx { root: number | null; path: string; parent: string | null; entries: Entry[]; page: number; roots: { root: number; name: string }[] }
const KIND_LABEL: Record<string, string> = { dir: "carpeta", image: "imagen", text: "texto", pdf: "PDF", other: "otro" };
const sizeText = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MiB` : n > 1024 ? `${Math.round(n / 1024)} KiB` : `${n} B`);
const loadSens = (): number => { try { const v = parseFloat(localStorage.getItem("piantao.pinch") ?? ""); return v >= 0.25 && v <= 0.6 ? v : 0.34; } catch { return 0.34; } };
const join = (a: string, b: string) => (a ? `${a}/${b}` : b);

interface Props {
  link: Link; vision: VisionClient; vis: VisionUi; vui: VoiceUi; state: string; connected: boolean;
  cards: BoardCard[]; msgs: Msg[]; busy: boolean;
  onCloseCard: (id: string) => void; onClearBoard: () => void;
  onSend: (t: string) => void; onStop: () => void; onToggleMic: () => void; onToggleCam: () => void; onExit: () => void;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
const mediaUrl = (image: string) => (image.startsWith("/") ? image : `/media/${encodeURIComponent(image)}`);

export function Holo(p: Props) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const it = useRef(new Interaction());
  const scene = useRef<HoloScene>();
  const live = useRef(p); live.current = p;
  const known = useRef(new Set<string>());
  const meta = useRef(new Map<string, { title: string }>());
  const docs = useRef(new Map<string, Doc>());
  const wins = useRef(new Map<string, DocView>());
  const rowAct = useRef(new Map<string, () => void>());
  const fxRef = useRef<Fx | null>(null);
  const ev = useRef({ ring: () => {}, orbit: (_id: string) => {}, row: (_id: string, _row: string) => {}, tap: (_id: string) => {}, close: (_id: string) => {}, scroll: (_id: string, _dy: number) => {} });
  const [list, setList] = useState<{ id: string; title: string }[]>([]);
  const [wlist, setWlist] = useState<{ id: string; title: string }[]>([]);
  const [fx, setFx] = useState<Fx | null>(null);
  const [webgl, setWebgl] = useState(true);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [sens, setSens] = useState(loadSens);
  const flash = (t: string) => { setMsg(t); window.setTimeout(() => setMsg(""), 4000); };
  const refreshList = () => {
    setList([...known.current].map((id) => ({ id, title: meta.current.get(id)?.title ?? id })));
    setWlist([...wins.current.entries()].map(([id, v]) => ({ id, title: v.title })));
  };
  const setFxBoth = (f: Fx | null) => { fxRef.current = f; setFx(f); };

  // -- tarjetas -------------------------------------------------------------------------------------------------------
  async function addCard(c: { id: string; title: string; text: string; origin: string; image?: string | null; full?: string; md?: boolean }) {
    if (known.current.has(c.id)) return;
    known.current.add(c.id);
    meta.current.set(c.id, { title: c.title });
    docs.current.set(c.id, { title: c.title, text: c.full ?? c.text, image: c.image ? mediaUrl(c.image) : null, origin: c.origin, md: c.md ?? (c.origin === "model" || c.origin === "user") });
    const image = c.image ? await loadImage(mediaUrl(c.image)) : null;
    if (!known.current.has(c.id)) return; // se cerro mientras cargaba la imagen
    const text = c.image && !image ? (c.text ? c.text + "\n" : "") + "(no se pudo cargar la imagen)" : c.text;
    const art = renderCard({ id: c.id, title: c.title, text, origin: c.origin, image });
    it.current.addCard(c.id, art.w, art.h);
    scene.current?.setCard(c.id, art.canvas, art.w, art.h);
    refreshList();
  }

  function dropCard(id: string, notify = true) {
    if (!known.current.has(id)) return;
    known.current.delete(id); meta.current.delete(id); docs.current.delete(id);
    it.current.removeCard(id); scene.current?.removeCard(id);
    if (notify) live.current.onCloseCard(id);
    refreshList();
  }

  // -- ventanas de documento (3D, moviles, con zoom y desplazamiento) ---------------------------------------------------
  async function openWindow(key: string, d: Doc) {
    const id = `win-${key}`;
    if (it.current.cards.has(id)) { it.current.raise(id); return; }
    const image = d.image ? await loadImage(mediaUrl(d.image)) : null;
    if (it.current.cards.has(id)) return;
    const text = d.image && !image ? (d.text ? d.text + "\n" : "") + "(no se pudo cargar la imagen)" : d.text;
    const view = new DocView({ title: d.title, text, image, md: d.md, origin: d.origin });
    view.render();
    wins.current.set(id, view);
    it.current.addCard(id, WIN_W, WIN_H, { kind: "window", titleH: WIN_TITLE });
    scene.current?.setCard(id, view.canvas, WIN_W, WIN_H);
    refreshList();
  }
  function closeWindow(id: string) {
    wins.current.delete(id); it.current.removeCard(id); scene.current?.removeCard(id); refreshList();
  }
  function scrollWindow(id: string, dy: number) {
    const v = wins.current.get(id);
    if (v && v.scrollBy(dy)) { v.render(); scene.current?.touchCard(id); }
  }

  // -- explorador: una tarjeta-lista con filas grandes ---------------------------------------------------------------
  function showList(f: Fx) {
    setFxBoth(f);
    rowAct.current.clear();
    const specs: ListRowSpec[] = [];
    const add = (id: string, label: string, kind: IconKind, hint: string | undefined, act: () => void) => { specs.push({ id, label, kind, hint }); rowAct.current.set(id, act); };
    const pages = Math.max(1, Math.ceil(f.entries.length / PAGE));
    if (f.root === null) f.roots.forEach((r) => add(`r${r.root}`, r.name, "root", "carpeta", () => void browse(r.root, "")));
    else {
      if (f.parent !== null) add("up", "Subir", "up", undefined, () => void browse(f.root!, f.parent!));
      else if (f.roots.length > 1) add("up", "Carpetas", "up", undefined, () => void showRoots());
      f.entries.slice(f.page * PAGE, f.page * PAGE + PAGE).forEach((e, i) =>
        add(`e${i}`, e.name, e.kind, e.kind === "dir" ? undefined : sizeText(e.size), () => (e.kind === "dir" ? void browse(f.root!, join(f.path, e.name)) : void openFile(f.root!, join(f.path, e.name)))));
      if (f.page > 0) add("prev", "Anteriores", "more", `${f.page}/${pages}`, () => showList({ ...f, page: f.page - 1 }));
      if (f.page + 1 < pages) add("next", "Más", "more", `${f.page + 2}/${pages}`, () => showList({ ...f, page: f.page + 1 }));
    }
    const name = f.root === null ? "Carpetas autorizadas" : `/${f.roots.find((r) => r.root === f.root)?.name ?? ""}${f.path ? "/" + f.path : ""}`;
    const art = renderList(name, f.root === null ? `${f.roots.length} carpetas` : `${f.entries.length} elementos`, specs);
    if (it.current.cards.has(LIST_ID)) it.current.resize(LIST_ID, art.w, art.h, art.rows);
    else it.current.addCard(LIST_ID, art.w, art.h, { kind: "list", rows: art.rows });
    scene.current?.setCard(LIST_ID, art.canvas, art.w, art.h);
  }
  function closeFiles() { setFxBoth(null); rowAct.current.clear(); it.current.removeCard(LIST_ID); scene.current?.removeCard(LIST_ID); }
  async function rootsOf() {
    try { return ((await live.current.link.command("files_roots")) as { root: number; name: string; exists: boolean }[]).filter((r) => r.exists); } catch { return []; }
  }
  async function showRoots() {
    try {
      const ok = await rootsOf();
      if (ok.length === 0) { flash("No hay carpetas autorizadas para mostrar (permissions.yaml → file_access.allowed_dirs)."); return; }
      if (ok.length === 1) { await browse(ok[0].root, "", ok); return; }
      showList({ root: null, path: "", parent: null, entries: [], page: 0, roots: ok });
    } catch (e) { flash((e as Error).message); }
  }
  async function browse(root: number, path: string, roots?: { root: number; name: string }[]) {
    try {
      const r = (await live.current.link.command("files_list", { root, path })) as { entries: Entry[]; path: string; parent: string | null; total: number };
      showList({ root, path: r.path, parent: r.parent, entries: r.entries, page: 0, roots: roots ?? (await rootsOf()) });
      if (r.entries.length === 0) flash("Carpeta vacía");
      else if (r.total > r.entries.length) flash(`Se muestran ${r.entries.length} de ${r.total} elementos`);
    } catch (e) { flash((e as Error).message); }
  }
  async function openFile(root: number, path: string) {
    try {
      const r = (await live.current.link.command("files_read", { root, path })) as { name: string; kind: string; size: number; text?: string; url?: string; truncated?: boolean };
      let text = r.text ?? "";
      if (r.kind === "other") text = `Sin vista previa para este tipo de archivo (${sizeText(r.size)}).`;
      else if (r.kind === "pdf" && !text) text = "PDF sin texto extraíble (puede ser un escaneo).";
      else if (r.truncated) text += "\n…";
      await openWindow(`file-${root}-${path}`, { title: r.name, text: r.kind === "image" ? "" : text, image: r.kind === "image" ? r.url ?? null : null, origin: "file", md: /\.(md|markdown)$/i.test(r.name) });
    } catch (e) { flash((e as Error).message); }
  }
  function toggleFiles() { if (fxRef.current) closeFiles(); else void showRoots(); }
  function arrange() { it.current.arrange(); }
  function clearAll() { for (const c of [...list]) dropCard(c.id); live.current.onClearBoard(); }

  /** El nucleo: un toque lo abre (activa el microfono y despliega las burbujas) o lo cierra (apaga ambos). */
  function toggleCore() {
    const open = !it.current.ring.open;
    it.current.setOpen(open);
    const c = live.current;
    if (c.vui.available && ((open && c.vui.state === "off") || (!open && c.vui.state !== "off"))) c.onToggleMic();
  }

  ev.current = {
    ring: toggleCore,
    orbit: (id) => { if (id === "files") toggleFiles(); else if (id === "mic") live.current.onToggleMic(); else if (id === "arrange") arrange(); else if (id === "clear") clearAll(); },
    row: (id, row) => { if (id === LIST_ID) rowAct.current.get(row)?.(); },
    tap: (id) => { const d = docs.current.get(id); if (d) void openWindow(id, d); },
    close: (id) => {
      if (id === LIST_ID) { setFxBoth(null); rowAct.current.clear(); scene.current?.removeCard(id); }
      else if (wins.current.has(id)) { wins.current.delete(id); scene.current?.removeCard(id); refreshList(); }
      else dropCard(id);
    },
    scroll: scrollWindow,
  };

  useEffect(() => { setPinchSensitivity(sens); try { localStorage.setItem("piantao.pinch", String(sens)); } catch { /* sin almacenamiento */ } }, [sens]);

  // -- escena + bucle ------------------------------------------------------------------------------------------------
  useEffect(() => {
    const el = root.current!, cv = canvas.current!;
    const sc = new HoloScene(cv);
    scene.current = sc; setWebgl(sc.ok);
    const inter = it.current;
    if (location.hash === "#holo-debug") (window as unknown as { __holo?: Interaction }).__holo = inter;
    inter.setOrbits(ORBITS.map((o) => o.id));
    sc.setOrbits(ORBITS);
    const layout = () => { const r = el.getBoundingClientRect(); inter.setSize(r.width, r.height); sc.resize(r.width, r.height); };
    layout();
    const ro = new ResizeObserver(layout); ro.observe(el);

    const hands = new HandsInput();
    let samples: (HandSample | null)[] = [null, null];
    let lastHands = 0;
    const v = live.current.vision;
    v.attach(video.current, null); // sin esqueleto: solo se ve el cursor
    v.hands = (hs: Lm[][], aspect: number) => {
      const r = el.getBoundingClientRect(), vv = video.current;
      const vp: Viewport = { vw: vv?.videoWidth || 640, vh: vv?.videoHeight || 480, cw: r.width, ch: r.height, mirror: true };
      samples = hands.process(hs, aspect, vp); lastHands = performance.now();
    };
    v.owner = () => inter.ownsHands();

    let mouse: HandSample | null = null;
    const pt = (x: number, y: number) => { const r = cv.getBoundingClientRect(); return { x: x - r.left, y: y - r.top }; };
    const onMove = (e: PointerEvent) => { mouse = { cursor: pt(e.clientX, e.clientY), pinching: !!(e.buttons & 1), rotate: e.shiftKey }; };
    const onDown = (e: PointerEvent) => { if (e.button !== 0) return; cv.setPointerCapture(e.pointerId); cv.focus(); mouse = { cursor: pt(e.clientX, e.clientY), pinching: true, rotate: e.shiftKey }; };
    const onUp = (e: PointerEvent) => { mouse = { cursor: pt(e.clientX, e.clientY), pinching: false }; if (e.pointerType !== "mouse") mouse = null; };
    const onLeave = () => { mouse = null; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const at = pt(e.clientX, e.clientY), w = inter.windowAt(at);
      if (w && !e.ctrlKey) scrollWindow(w.id, e.deltaY / (w.scale * inter.board.scale));
      else inter.wheel(at, Math.exp(-e.deltaY * 0.0015));
    };
    const topWindow = () => [...wins.current.keys()].map((id) => inter.cards.get(id)).filter((c) => !!c).sort((a, b) => b!.z - a!.z)[0] ?? null;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      const w = topWindow();
      if (!w) return;
      const view = wins.current.get(w.id)!;
      const step: Record<string, number> = { ArrowDown: 60, ArrowUp: -60, PageDown: view.viewH * 0.9, PageUp: -view.viewH * 0.9, " ": view.viewH * 0.9, Home: -1e9, End: 1e9 };
      if (e.key === "Escape") { closeWindow(w.id); e.preventDefault(); }
      else if (e.key in step) { scrollWindow(w.id, step[e.key]); e.preventDefault(); }
    };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onLeave); cv.addEventListener("pointerleave", onLeave); cv.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const hs = now - lastHands > STALE_HANDS_MS ? [null, null] : samples;
      for (const e of inter.update([hs[0] ?? null, hs[1] ?? null, mouse], now / 1000)) {
        const h = ev.current;
        if (e.type === "close") h.close(e.id);
        else if (e.type === "ring") h.ring();
        else if (e.type === "orbit") h.orbit(e.id);
        else if (e.type === "row") h.row(e.id, e.row);
        else if (e.type === "tap") h.tap(e.id);
        else if (e.type === "scroll") h.scroll(e.id, e.dy);
      }
      const cur = live.current;
      sc.render(inter, cur.state, cur.vui.state === "listening" ? cur.vui.level : 0, now / 1000);
    };
    loop();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointerup", onUp);
      cv.removeEventListener("pointercancel", onLeave); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      v.hands = null; v.owner = null; v.attach(null, null);
      sc.dispose(); scene.current = undefined; known.current.clear(); meta.current.clear(); docs.current.clear(); wins.current.clear(); rowAct.current.clear(); inter.clear();
    };
  }, []);

  // sincroniza las tarjetas del servidor con la escena
  useEffect(() => {
    const ids = new Set(p.cards.map((c) => c.id));
    for (const c of p.cards) void addCard({ ...c, full: c.text });
    for (const id of [...known.current]) if (!ids.has(id)) dropCard(id, false);
    refreshList();
  }, [p.cards]);

  const last = [...p.msgs].reverse().find((m) => m.role === "assistant");
  const caption = last ? last.parts.filter((x) => x.k === "text").map((x) => (x as { t: string }).t).join("").slice(-320) : "";
  const camOn = p.vis.state === "on";
  const micOn = p.vui.state !== "off";

  return (
    <div class="holo" ref={root}>
      <video ref={video} class="holo-video" playsInline muted aria-hidden="true" style={{ opacity: camOn ? 0.4 : 0 }} />
      <canvas ref={canvas} class="holo-scene" tabIndex={0} aria-label="Tablero holográfico" />
      <div class="holo-top">
        <button type="button" class="ghost" onClick={p.onExit}>← Volver al chat</button>
        <details class="holo-list">
          <summary>Tarjetas ({list.length})</summary>
          {list.length === 0 ? <p class="muted small">No hay tarjetas. Pedile a Piantao que te muestre algo.</p> :
            <ul>{list.map((c) => <li key={c.id}><span>{c.title}</span> <span><button type="button" class="ghost" onClick={() => { const d = docs.current.get(c.id); if (d) void openWindow(c.id, d); }}>Abrir</button> <button type="button" class="ghost" onClick={() => dropCard(c.id)}>Cerrar</button></span></li>)}</ul>}
          {wlist.length > 0 && <><p class="small muted">Ventanas abiertas</p><ul>{wlist.map((w) => <li key={w.id}><span>{w.title}</span> <button type="button" class="ghost" onClick={() => closeWindow(w.id)}>Cerrar</button></li>)}</ul></>}
        </details>
        <details class="holo-list holo-textfiles" open={!!fx}>
          <summary>Explorador (texto)</summary>
          <nav class="holo-files" aria-label="Explorador de archivos">
            {!fx ? <p><button type="button" class="linklike" onClick={toggleFiles}>Abrir explorador</button></p> : <>
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
                <p class="small"><button type="button" class="ghost" disabled={fx.page === 0} onClick={() => showList({ ...fx, page: fx.page - 1 })}>◂</button> {fx.page + 1}/{Math.ceil(fx.entries.length / PAGE)} <button type="button" class="ghost" disabled={(fx.page + 1) * PAGE >= fx.entries.length} onClick={() => showList({ ...fx, page: fx.page + 1 })}>▸</button></p>
              )}
            </>}
          </nav>
        </details>
        <span class="small muted holo-help">{camOn ? "Tocá el núcleo para desplegar · apuntá y esperá 1 s = clic · pellizco: mover · quieto 1 s: girar en 3D · dos manos: zoom" : "Clic en una tarjeta para abrirla · arrastrar: mover · Shift+arrastrar: girar 3D · rueda: zoom o desplazar"}</span>
        {!webgl && <p class="error small" role="alert">Este navegador no pudo iniciar WebGL: usá las listas de texto.</p>}
        {msg && <p class="error small" role="alert">{msg}</p>}
      </div>
      {caption && <p class="holo-caption" role="status" aria-live="polite">{caption}</p>}
      <form class="holo-bar" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (t && !p.busy && p.connected) { p.onSend(t); setText(""); } }}>
        <input class="holo-input" value={text} maxLength={8000} aria-label="Mensaje" placeholder={p.connected ? "Escribile a Piantao..." : "Sin conexion..."}
          onInput={(e) => setText((e.target as HTMLInputElement).value)} />
        {p.busy ? <button type="button" class="stop" onClick={p.onStop}>Detener</button> : <button type="submit" disabled={!text.trim() || !p.connected}>Enviar</button>}
        {p.vui.available && <button type="button" class={micOn ? "mic mic-on" : "ghost"} aria-pressed={micOn} onClick={p.onToggleMic}>{micOn ? "Apagar mic" : "Micrófono"}</button>}
        {p.vis.available && <button type="button" class={camOn ? "mic mic-on" : "ghost"} aria-pressed={camOn} disabled={p.vis.state === "loading"} onClick={p.onToggleCam}>{camOn ? "Apagar cámara" : p.vis.state === "loading" ? "Cargando..." : "Cámara y manos"}</button>}
        <button type="button" class="ghost" onClick={toggleFiles}>Archivos</button>
        <button type="button" class="ghost" onClick={arrange}>Ordenar</button>
        <button type="button" class="ghost" onClick={() => it.current.resetView()}>Vista 1:1</button>
        <button type="button" class="ghost" disabled={list.length === 0} onClick={clearAll}>Limpiar</button>
        {camOn && <label class="small holo-sens" title="Más a la derecha = pellizca con más facilidad">Pellizco <input type="range" min="0.25" max="0.6" step="0.01" value={sens} aria-label="Sensibilidad del pellizco" onInput={(e) => setSens(parseFloat((e.target as HTMLInputElement).value))} /></label>}
      </form>
      {p.vis.error && <p class="error small holo-err" role="alert">{p.vis.error}</p>}
    </div>
  );
}
