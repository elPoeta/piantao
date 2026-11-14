import { useEffect, useRef, useState } from "preact/hooks";
import { Link, PiantaoEvent, Snapshot, logout, sessionPaired } from "./api";
import { Chat, Msg, applyChat } from "./Chat";
import { ConfirmModal, ConfirmReq } from "./Confirm";
import { Pair } from "./Pair";
import { VoiceBar, VoiceUi } from "./VoiceBar";
import { VoiceClient, VoiceMode } from "./voice";
import { VisionClient } from "./vision";
import { VisionBar, VisionUi } from "./VisionBar";
import { Skills } from "./Skills";
import { Panel } from "./Panel";
import type { BoardCard, Holo as HoloT } from "./Holo";

type Status = "connecting" | "open" | "closed" | "unauthorized";
type Tab = "chat" | "holo" | "skills" | "panel";
const STATE_LABEL: Record<string, string> = { idle: "En reposo", listening: "Escuchando", thinking: "Pensando", speaking: "Hablando", acting: "Actuando", confirming: "Esperando tu permiso" };

export function App() {
  const [paired, setPaired] = useState<boolean | null>(null);
  useEffect(() => { void sessionPaired().then(setPaired); }, []);
  if (paired === null) return <main class="pair"><p class="muted">Cargando...</p></main>;
  if (!paired) return <Pair onPaired={() => setPaired(true)} />;
  return <Shell onLogout={() => { void logout().then(() => setPaired(false)); }} onLost={() => setPaired(false)} />;
}

function Shell({ onLogout, onLost }: { onLogout: () => void; onLost: () => void }) {
  const [snap, setSnap] = useState<Snapshot>({});
  const [status, setStatus] = useState<Status>("connecting");
  const [log, setLog] = useState<PiantaoEvent[]>([]);
  const [tab, setTab] = useState<Tab>("chat");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [confirms, setConfirms] = useState<ConfirmReq[]>([]);
  const [notice, setNotice] = useState("");
  const [board, setBoard] = useState<BoardCard[]>([]);
  const [HoloView, setHoloView] = useState<typeof HoloT | null>(null);
  // three.js pesa: se descarga solo al abrir la pestaña Holo
  useEffect(() => { if (tab === "holo" && !HoloView) void import("./Holo").then((m) => setHoloView(() => m.Holo)); }, [tab]);
  const link = useRef<Link>();
  const voice = useRef<VoiceClient>();
  const [vui, setVui] = useState<VoiceUi>({ available: false, state: "off", detail: "", level: 0, mode: "ptt", error: "", last: "", readAloud: false, bargeIn: false });
  const vision = useRef<VisionClient>();
  const [vis, setVis] = useState<VisionUi>({ available: false, state: "off", detail: "", status: null, lastGesture: "", error: "", calibrated: false });
  const patchVis = (p: Partial<VisionUi>) => setVis((v) => ({ ...v, ...p }));
  const patchVoice = (p: Partial<VoiceUi>) => setVui((v) => ({ ...v, ...p }));

  async function loadHistory(l: Link) {
    try {
      const h = await l.command("chat_history");
      setMsgs((h.messages as { role: "user" | "assistant"; text: string }[]).map((m, i) => ({ id: -(i + 1), role: m.role, parts: [{ k: "text", t: m.text }] })));
      setBusy(!!h.busy);
      setConfirms(h.pending as ConfirmReq[]);
    } catch { /* el chat puede no estar habilitado en este servicio */ }
  }

  useEffect(() => {
    const l = new Link();
    link.current = l;
    const vc = new VoiceClient(l, {
      onState: (state, detail) => patchVoice({ state, detail: detail ?? "", ...(state === "off" ? { level: 0 } : {}) }),
      onLevel: (level) => patchVoice({ level }),
      onTranscript: (last) => patchVoice({ last }),
      onError: (error) => { patchVoice({ error }); window.setTimeout(() => patchVoice({ error: "" }), 6000); },
    });
    voice.current = vc;
    const vs = new VisionClient(l, {
      onState: (state, detail) => patchVis({ state, detail: detail ?? "", ...(state === "off" ? { status: null } : {}) }),
      onStatus: (status) => patchVis({ status }),
      onGesture: (name) => { patchVis({ lastGesture: name }); window.setTimeout(() => setVis((v) => (v.lastGesture === name ? { ...v, lastGesture: "" } : v)), 2500); },
      onError: (error) => patchVis({ error }),
    });
    vision.current = vs;
    l.onVision = (m) => vs.handle(m);
    l.onVoice = (m) => vc.handle(m);
    l.onBinary = (d) => vc.handleBinary(d);
    l.onSnapshot = setSnap;
    l.onBoard = (m) => {
      if (m.ev === "add") setBoard((b) => (b.some((c) => c.id === m.card.id) ? b : [...b, m.card as BoardCard]));
      else if (m.ev === "remove") setBoard((b) => b.filter((c) => c.id !== m.id));
      else if (m.ev === "clear") setBoard([]);
    };
    l.onStatus = (s) => {
      setStatus(s);
      if (s === "open") {
        void loadHistory(l);
        l.command("board_state").then((c) => setBoard(c as BoardCard[])).catch(() => setBoard([]));
        l.command("vision_info").then((i) => patchVis({ available: true, calibrated: !!i.calibrated })).catch(() => patchVis({ available: false }));
        l.command("voice_info").then((i) => patchVoice({ available: true, bargeIn: !!i.barge_in })).catch(() => patchVoice({ available: false }));
      } else {
        if (vc.active) void vc.stop();
        if (vs.state !== "off") void vs.stop();
      } // sin conexion el servidor ya apago la voz: se libera el microfono
      if (s === "unauthorized") onLost();
    };
    l.onEvent = (e) => {
      setLog((prev) => [e, ...prev].slice(0, 200));
      if (e.kind === "state") setSnap((s) => ({ ...s, state: e.data.state ?? s.state }));
      if (e.kind === "resources") setSnap((s) => ({ ...s, resources: e.data }));
      if (e.kind === "settings") setSnap((s) => ({ ...s, ...e.data }));
    };
    l.onChat = (m) => {
      setMsgs((prev) => applyChat(prev, m));
      if (m.ev === "start") setBusy(true);
      if (m.ev === "done") setBusy(false);
    };
    l.onConfirm = (m) => {
      if (m.t === "confirm") setConfirms((c) => (c.some((x) => x.id === m.id) ? c : [...c, m as ConfirmReq]));
      else setConfirms((c) => c.filter((x) => x.id !== m.id));
    };
    l.connect();
    return () => { void voice.current?.stop(); void vision.current?.stop(); l.close(); };
  }, []);

  function run(p: Promise<unknown> | undefined) { p?.catch((e: Error) => { setNotice(e.message); window.setTimeout(() => setNotice(""), 5000); }); }
  const toggleCam = () => run(vis.state === "off" ? vision.current?.start() : vision.current?.stop());
  const calibrate = async (pose: "open" | "closed") => { const r = await vision.current!.calibrate(pose); return `Medido: ${r.samples} muestras (valor ${r.median}).`; };
  const applyCal = async () => { const r = await vision.current!.applyCalibration(); patchVis({ calibrated: true }); return `Calibración aplicada y guardada (${r.finger_curled} / ${r.finger_extended}).`; };
  const send = (t: string) => run(link.current?.command("chat_send", { text: t, speak: vui.readAloud && vui.state !== "off" }));
  const toggleMic = () => run(vui.state === "off" ? voice.current?.start(vui.mode) : voice.current?.stop());
  const closeCard = (id: string) => { setBoard((b) => b.filter((c) => c.id !== id)); run(link.current?.command("board_close", { id })); };
  const clearBoard = () => { setBoard([]); run(link.current?.command("board_clear")); };
  const pin = (text: string) => run(link.current?.command("board_add", { title: (text.split("\n").find((x) => x.trim()) ?? "Respuesta").replace(/[#*_`>]/g, "").trim().slice(0, 60) || "Respuesta", text: text.slice(0, 4000) }));
  const stop = () => run(link.current?.command("chat_interrupt"));
  const fresh = () => run(link.current?.command("chat_new").then(() => setMsgs([])));
  const answer = (id: string, allow: boolean, phrase?: string) =>
    run(link.current?.command("permission_answer", { id, allow, phrase }).then(() => setConfirms((c) => c.filter((x) => x.id !== id))));

  const state = String(snap.state ?? "idle");
  return (
    <div class="shell">
      <header>
        <div class={`orb orb-${state}`} aria-hidden="true" />
        <div class="title"><h1>Piantao</h1><span class="state" aria-live="polite">{STATE_LABEL[state] ?? state}</span></div>
        <nav class="tabs" role="tablist">
          {(["chat", "holo", "skills", "panel"] as Tab[]).map((t) => <button role="tab" aria-selected={tab === t} class={tab === t ? "tab on" : "tab"} onClick={() => setTab(t)}>{t === "chat" ? "Chat" : t === "holo" ? "Holo" : t === "skills" ? "Skills" : "Panel"}</button>)}
        </nav>
        <span class={`pill pill-${status}`}>{status === "open" ? "conectado" : status === "connecting" ? "conectando" : "reconectando"}</span>
        <button class="ghost" onClick={onLogout}>Cerrar sesion</button>
      </header>
      {notice && <p class="notice" role="alert">{notice}</p>}
      {tab === "skills" ? <Skills link={link.current} connected={status === "open"} /> : tab === "chat" ? <Chat msgs={msgs} busy={busy} connected={status === "open"} onSend={send} onStop={stop} onNew={fresh} onPin={pin}
        extra={<><VisionBar ui={vis} onToggle={toggleCam} onVideo={(v, c) => vision.current?.attach(v, c)} onCalibrate={calibrate} onApply={applyCal} /><VoiceBar ui={vui} onMode={(mode: VoiceMode) => patchVoice({ mode })} onToggle={toggleMic} onPtt={(d) => run(voice.current?.ptt(d))}
          onStop={() => run(voice.current?.interrupt())} onReadAloud={(readAloud) => patchVoice({ readAloud })} /></>} /> : (
        <Panel link={link.current} connected={status === "open"} snap={snap} log={log} />
      )}
      {tab === "holo" && link.current && vision.current && (HoloView ? (
        <HoloView link={link.current} vision={vision.current} vis={vis} vui={vui} state={state} connected={status === "open"} cards={board} msgs={msgs} busy={busy}
          onCloseCard={closeCard} onClearBoard={clearBoard} onSend={send} onStop={stop} onToggleMic={toggleMic} onToggleCam={toggleCam} onExit={() => setTab("chat")} />
      ) : <p class="muted">Cargando el holograma...</p>)}
      {confirms.length > 0 && <ConfirmModal key={confirms[0].id} req={confirms[0]} onAnswer={(allow, phrase) => answer(confirms[0].id, allow, phrase)} />}
    </div>
  );
}
