import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Link, PiantaoEvent, Snapshot, logout, sessionPaired } from "./api";
import { Chat, Msg, applyChat } from "./Chat";
import { ConfirmModal, ConfirmReq } from "./Confirm";
import { Pair } from "./Pair";

type Status = "connecting" | "open" | "closed" | "unauthorized";
type Tab = "chat" | "estado";
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
  const link = useRef<Link>();

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
    l.onSnapshot = setSnap;
    l.onStatus = (s) => { setStatus(s); if (s === "open") void loadHistory(l); if (s === "unauthorized") onLost(); };
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
    return () => l.close();
  }, []);

  function run(p: Promise<unknown> | undefined) { p?.catch((e: Error) => { setNotice(e.message); window.setTimeout(() => setNotice(""), 5000); }); }
  const send = (t: string) => run(link.current?.command("chat_send", { text: t }));
  const stop = () => run(link.current?.command("chat_interrupt"));
  const fresh = () => run(link.current?.command("chat_new").then(() => setMsgs([])));
  const answer = (id: string, allow: boolean, phrase?: string) =>
    run(link.current?.command("permission_answer", { id, allow, phrase }).then(() => setConfirms((c) => c.filter((x) => x.id !== id))));

  const state = String(snap.state ?? "idle");
  const res = (snap.resources ?? {}) as Record<string, any>;
  const rows = useMemo(() => [
    ["Proveedor", snap.provider], ["Modelo", snap.model], ["Razonamiento", snap.reasoning], ["Modo", snap.mode],
    ["Memoria", snap.memory === undefined ? undefined : snap.memory ? "activa" : "apagada"],
    ["Incognito", snap.incognito === undefined ? undefined : snap.incognito ? "si" : "no"],
  ].filter(([, v]) => v !== undefined && v !== null), [snap]);

  return (
    <div class="shell">
      <header>
        <div class={`orb orb-${state}`} aria-hidden="true" />
        <div class="title"><h1>Piantao</h1><span class="state" aria-live="polite">{STATE_LABEL[state] ?? state}</span></div>
        <nav class="tabs" role="tablist">
          {(["chat", "estado"] as Tab[]).map((t) => <button role="tab" aria-selected={tab === t} class={tab === t ? "tab on" : "tab"} onClick={() => setTab(t)}>{t === "chat" ? "Chat" : "Estado"}</button>)}
        </nav>
        <span class={`pill pill-${status}`}>{status === "open" ? "conectado" : status === "connecting" ? "conectando" : "reconectando"}</span>
        <button class="ghost" onClick={onLogout}>Cerrar sesion</button>
      </header>
      {notice && <p class="notice" role="alert">{notice}</p>}
      {tab === "chat" ? <Chat msgs={msgs} busy={busy} connected={status === "open"} onSend={send} onStop={stop} onNew={fresh} /> : (
        <main class="grid">
          <section class="card"><h2>Sesion</h2>
            <dl>{rows.map(([k, v]) => <><dt>{String(k)}</dt><dd>{String(v)}</dd></>)}</dl>
          </section>
          <section class="card"><h2>Recursos</h2>
            {Object.keys(res).length === 0 ? <p class="muted">Sin datos todavia.</p> :
              <dl>{Object.entries(res).map(([k, v]) => <><dt>{k}</dt><dd>{typeof v === "number" ? Math.round(v * 10) / 10 : String(v)}</dd></>)}</dl>}
          </section>
          <section class="card wide"><h2>Eventos en vivo</h2>
            {log.length === 0 ? <p class="muted">Esperando actividad...</p> :
              <ul class="log">{log.map((e, i) => <li key={`${e.ts}-${i}`}><time>{new Date(e.ts * 1000).toLocaleTimeString()}</time> <b>{e.kind}</b> <span>{JSON.stringify(e.data)}</span></li>)}</ul>}
          </section>
        </main>
      )}
      {confirms.length > 0 && <ConfirmModal key={confirms[0].id} req={confirms[0]} onAnswer={(allow, phrase) => answer(confirms[0].id, allow, phrase)} />}
    </div>
  );
}
