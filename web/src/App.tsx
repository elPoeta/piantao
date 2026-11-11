import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Link, PiantaoEvent, Snapshot, logout, sessionPaired } from "./api";
import { Pair } from "./Pair";

type Status = "connecting" | "open" | "closed" | "unauthorized";
const STATE_LABEL: Record<string, string> = { idle: "En reposo", listening: "Escuchando", thinking: "Pensando", speaking: "Hablando", acting: "Actuando" };

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
  const link = useRef<Link>();

  useEffect(() => {
    const l = new Link();
    link.current = l;
    l.onSnapshot = setSnap;
    l.onStatus = (s) => { setStatus(s); if (s === "unauthorized") onLost(); };
    l.onEvent = (e) => {
      setLog((prev) => [e, ...prev].slice(0, 200));
      if (e.kind === "state") setSnap((s) => ({ ...s, state: e.data.state ?? s.state }));
      if (e.kind === "resources") setSnap((s) => ({ ...s, resources: e.data }));
      if (e.kind === "settings") setSnap((s) => ({ ...s, ...e.data }));
    };
    l.connect();
    return () => l.close();
  }, []);

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
        <span class={`pill pill-${status}`}>{status === "open" ? "conectado" : status === "connecting" ? "conectando" : "reconectando"}</span>
        <button class="ghost" onClick={onLogout}>Cerrar sesion</button>
      </header>
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
    </div>
  );
}
