import { useEffect, useState } from "preact/hooks";
import { Link, PiantaoEvent, Snapshot } from "./api";

// Pagina de panel: paridad con el panel Qt (estado, voz y vision, historial, memoria, herramientas/MCP, permisos, seguridad).
// Todo lo que cambia algo pasa por los mismos comandos del servicio; endurecer un permiso es de un solo sentido.
type Sub = "estado" | "historial" | "memoria" | "herramientas" | "permisos" | "seguridad";
const SUBS: [Sub, string][] = [["estado", "Estado"], ["historial", "Historial"], ["memoria", "Memoria"], ["herramientas", "Herramientas"], ["permisos", "Permisos"], ["seguridad", "Seguridad"]];
export const REASONING = ["auto", "on", "off", "server"];
const POLICY: Record<string, string> = { auto: "automatico", confirm: "confirmacion", confirm_explicit: "confirmacion explicita", never: "bloqueado" };
const ORDER: Record<string, number> = { auto: 0, confirm: 1, confirm_explicit: 2, never: 3 };

export const fmtTs = (ts: unknown): string => {
  const n = Number(ts);
  if (Number.isFinite(n) && n > 0) return new Date(n * 1000).toLocaleString();
  const d = typeof ts === "string" ? new Date(ts) : null;   // la auditoria guarda ISO 8601
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : String(ts ?? "");
};
export const yn = (b: unknown) => (b ? "si" : "no");

interface Props { link: Link | undefined; connected: boolean; snap: Snapshot; log: PiantaoEvent[] }

export function Panel({ link, connected, snap, log }: Props) {
  const [sub, setSub] = useState<Sub>("estado");
  return (
    <main class="panel">
      <nav class="subtabs" role="tablist" aria-label="Secciones del panel">
        {SUBS.map(([k, label]) => <button key={k} role="tab" aria-selected={sub === k} class={sub === k ? "tab on" : "tab"} onClick={() => setSub(k)}>{label}</button>)}
      </nav>
      {sub === "estado" && <Estado link={link} snap={snap} log={log} />}
      {sub === "historial" && <Historial link={link} connected={connected} />}
      {sub === "memoria" && <Memoria link={link} connected={connected} />}
      {sub === "herramientas" && <Herramientas link={link} connected={connected} snap={snap} />}
      {sub === "permisos" && <Permisos link={link} connected={connected} />}
      {sub === "seguridad" && <Seguridad link={link} connected={connected} />}
    </main>
  );
}

/** Carga con un comando del servicio y expone datos/error/recarga. */
function useQuery<T>(link: Link | undefined, connected: boolean, name: string, args: Record<string, unknown>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const load = () => {
    if (!link || !connected) return;
    link.command<T>(name, args).then((d) => { setData(d); setError(""); }).catch((e: Error) => setError(e.message));
  };
  useEffect(load, [link, connected, name, JSON.stringify(args), ...deps]);
  return { data, error, reload: load };
}

function Bar({ label, value, text }: { label: string; value: number; text: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div class="bar-row"><span class="bar-label">{label}</span>
      <div class="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}><i style={`width:${pct}%`} /></div>
      <span class="bar-text small muted">{text}</span></div>
  );
}

function Estado({ link, snap, log }: { link: Link | undefined; snap: Snapshot; log: PiantaoEvent[] }) {
  const [msg, setMsg] = useState("");
  const run = (p: Promise<unknown> | undefined) => p?.then(() => setMsg("")).catch((e: Error) => setMsg(e.message));
  const provs: string[] = snap.providers ?? [];
  const res = (snap.resources ?? {}) as Record<string, number>;
  const v = (snap.voice ?? {}) as Record<string, any>;
  const vis = (snap.vision ?? {}) as Record<string, any>;
  const conf = (v.confirm ?? {}) as Record<string, any>;
  const lastTurn = log.find((e) => e.kind === "turn");
  const gestures = log.filter((e) => e.kind === "gesture").slice(0, 8);
  const MODE: Record<string, string> = { ptt: "pulsar para hablar", always: "siempre escuchando" };
  return (
    <div class="grid">
      <section class="card"><h2>Modelo</h2>
        <div class="row">
          <label>Proveedor <select value={snap.provider ?? ""} onChange={(e) => run(link?.command("select_model", { provider: (e.target as HTMLSelectElement).value }))}>
            {provs.map((p) => <option key={p} value={p}>{p}</option>)}</select></label>
          <span class="muted small">modelo: {String(snap.model ?? "-")}</span>
        </div>
        <div class="row">
          <label>Razonamiento <select disabled={snap.reasoning == null} value={snap.reasoning ?? "auto"} onChange={(e) => run(link?.command("set_reasoning", { mode: (e.target as HTMLSelectElement).value }))}>
            {REASONING.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
        </div>
        <p class={snap.cloud ? "warn" : "ok"} role="status">{snap.cloud ? "NUBE: cada envio pide tu autorizacion" : "Local: nada sale de tu equipo"}</p>
        <p class="muted small">Gestos: {snap.gestures_active ? "activos" : "inactivos"} · Memoria: {snap.memory ? "si" : "deshabilitada"} · Incognito: {yn(snap.incognito)} · modo {String(snap.mode ?? "?")} · activo hace {Math.round(Number(snap.uptime_s ?? 0))} s</p>
        {msg && <p class="error" role="alert">{msg}</p>}
      </section>
      <section class="card"><h2>Recursos</h2>
        {!res.ram_total_mb && !res.gpu_total_mib ? <p class="muted">Sin datos todavia.</p> : <>
          {res.ram_total_mb ? <Bar label="RAM" value={100 * (res.ram_used_mb ?? 0) / res.ram_total_mb} text={`${res.ram_used_mb ?? 0} / ${res.ram_total_mb} MB`} /> : null}
          {res.gpu_total_mib ? <>
            <Bar label="VRAM" value={100 * (res.gpu_used_mib ?? 0) / res.gpu_total_mib} text={`${Math.round(res.gpu_used_mib ?? 0)} / ${Math.round(res.gpu_total_mib)} MiB · ${Math.round(res.gpu_temp_c ?? 0)} °C`} />
            <Bar label="GPU %" value={res.gpu_util_pct ?? 0} text={`${Math.round(res.gpu_util_pct ?? 0)} %`} /></> : null}
        </>}
        <p class="muted small">{lastTurn ? "Ultimo turno: " + ["total_s", "first_text_s", "first_audio_s", "stt_s"].filter((k) => k in lastTurn.data).map((k) => `${k}=${lastTurn.data[k]}`).join(" · ") : "Sin turnos todavia"}</p>
      </section>
      <section class="card"><h2>Voz</h2>
        {Object.keys(v).length === 0 ? <p class="muted">Sin datos de voz (¿Piantao corre en modo chat?).</p> : <dl>
          <dt>Modo</dt><dd>{v.mode === "wake" ? `palabra de activacion «${v.wake_phrase}»` : MODE[v.mode] ?? String(v.mode)}{v.headless ? " (servicio)" : ""}</dd>
          <dt>Reconocimiento</dt><dd>{String(v.stt)}</dd><dt>Voz</dt><dd>{String(v.tts)}</dd>
          <dt>Confirmar por voz</dt><dd>{conf.active ? "activado" : "desactivado"}{conf.enabled ? ` · sensibles: ${yn(conf.allow_explicit)} · tras contenido externo: ${yn(conf.allow_tainted)}` : ""}</dd></dl>}
      </section>
      <section class="card"><h2>Vision y gestos</h2>
        {Object.keys(vis).length === 0 ? <p class="muted">Sin datos de vision.</p> : <dl>
          <dt>Gestos</dt><dd>{vis.active ? "activos" : "inactivos"}{vis.device ? ` · camara ${vis.device}` : ""}{vis.fps ? ` a ${vis.fps} fps` : ""}</dd>
          <dt>Confirmar con gestos</dt><dd>{yn(vis.confirm_with_gestures)}</dd><dt>Palma abierta interrumpe</dt><dd>{yn(vis.interrupt_with_palm)}</dd></dl>}
        {gestures.length > 0 && <ul class="log">{gestures.map((g, i) => <li key={i}><time>{new Date(g.ts * 1000).toLocaleTimeString()}</time> <b>{String(g.data.name)}</b></li>)}</ul>}
      </section>
      <section class="card wide"><h2>Eventos en vivo</h2>
        {log.length === 0 ? <p class="muted">Esperando actividad...</p> :
          <ul class="log">{log.map((e, i) => <li key={`${e.ts}-${i}`}><time>{new Date(e.ts * 1000).toLocaleTimeString()}</time> <b>{e.kind}</b> <span>{JSON.stringify(e.data)}</span></li>)}</ul>}
      </section>
    </div>
  );
}

function Table({ cols, rows, onPick, picked }: { cols: string[]; rows: (string | number | null | undefined)[][]; onPick?: (i: number) => void; picked?: number }) {
  if (rows.length === 0) return <p class="muted">Sin datos.</p>;
  return (
    <div class="table-wrap"><table>
      <thead><tr>{cols.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => (
        <tr key={i} class={picked === i ? "sel" : ""} tabIndex={onPick ? 0 : undefined} aria-selected={onPick ? picked === i : undefined}
          onClick={onPick && (() => onPick(i))} onKeyDown={onPick && ((e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(i); } })}>
          {r.map((c, j) => <td key={j}>{c == null ? "" : String(c)}</td>)}</tr>))}</tbody>
    </table></div>
  );
}

function Historial({ link, connected }: { link: Link | undefined; connected: boolean }) {
  const { data, error } = useQuery<any[]>(link, connected, "query", { kind: "conversations" });
  const [sel, setSel] = useState<number | null>(null);
  const msgs = useQuery<any[]>(link, connected && sel !== null, "query", { kind: "messages", conversation_id: sel ?? 1 }, [sel]);
  if (error) return <section class="card"><p class="error">{error}</p></section>;
  return (
    <div class="skills">
      <section class="card"><h2>Conversaciones</h2>
        {data === null ? <p class="muted">Cargando...</p> : data.length === 0 ? <p class="muted">Todavia no hay conversaciones guardadas.</p> :
          <ul class="skill-list">{data.map((c) => (
            <li key={c.id}><button class={`skill-row${sel === c.id ? " on" : ""}`} onClick={() => setSel(Number(c.id))}>
              <span class="skill-name">{c.title || "sin titulo"}</span><span class="muted small">{fmtTs(c.started_at)} · {c.messages ?? 0} mensajes</span></button></li>))}</ul>}
      </section>
      <section class="card"><h2>Mensajes</h2>
        {sel === null ? <p class="muted">Elegi una conversacion.</p> : msgs.error ? <p class="error">{msgs.error}</p> : msgs.data === null ? <p class="muted">Cargando...</p> :
          <div class="transcript">{msgs.data.map((m, i) => <p key={i} class={`tr tr-${m.role}`}><b>{m.role}</b> <span class="plain">{m.content ?? ""}</span></p>)}</div>}
      </section>
    </div>
  );
}

function Memoria({ link, connected }: { link: Link | undefined; connected: boolean }) {
  const mem = useQuery<any[]>(link, connected, "query", { kind: "memories" });
  const prefs = useQuery<Record<string, unknown>>(link, connected, "query", { kind: "preferences" });
  const stats = useQuery<Record<string, unknown>>(link, connected, "query", { kind: "stats" });
  if (mem.error) return <section class="card"><p class="error">{mem.error}</p></section>;
  return (
    <div class="stack">
      <section class="card"><h2>Notas y recuerdos</h2>
        <p class="muted small">Solo lectura. Para guardar u olvidar algo usa la terminal (/remember, /forget) o pedile al agente.</p>
        {mem.data === null ? <p class="muted">Cargando...</p> :
          <Table cols={["Tipo", "Contenido", "Origen", "Creada", "Vence"]} rows={mem.data.map((m) => [m.kind, m.content, m.source, fmtTs(m.created_at), m.expires_at ? fmtTs(m.expires_at) : ""])} />}</section>
      <section class="card"><h2>Preferencias</h2>
        {prefs.data === null ? <p class="muted">{prefs.error || "Cargando..."}</p> : Object.keys(prefs.data).length === 0 ? <p class="muted">Sin preferencias.</p> :
          <dl>{Object.entries(prefs.data).map(([k, v]) => <><dt>{k}</dt><dd>{String(v)}</dd></>)}</dl>}</section>
      {stats.data && <section class="card"><h2>Resumen</h2><dl>{Object.entries(stats.data).filter(([k]) => k !== "path").map(([k, v]) => <><dt>{k}</dt><dd>{typeof v === "object" ? JSON.stringify(v) : String(v)}</dd></>)}</dl></section>}
    </div>
  );
}

function Herramientas({ link, connected, snap }: { link: Link | undefined; connected: boolean; snap: Snapshot }) {
  const [sel, setSel] = useState<number | undefined>();
  const [msg, setMsg] = useState("");
  const hist = useQuery<any[]>(link, connected, "query", { kind: "tool_history" });
  const mcp: any[] = snap.mcp ?? [];
  const tools: any[] = snap.tools ?? [];
  const server = sel !== undefined ? mcp[sel]?.name : undefined;
  const act = (name: "mcp_restart" | "mcp_pause") => {
    if (!server) return;
    link?.command(name, { server }).then((d: any) => { setMsg(`MCP: ${d.name} → ${d.state}`); return link.command("get_snapshot"); })
      .then((s) => link?.onSnapshot(s)).catch((e: Error) => setMsg(`Error MCP: ${e.message}`));
  };
  const cols = hist.data && hist.data.length ? Object.keys(hist.data[0]).slice(0, 6) : [];
  return (
    <div class="stack">
      <section class="card"><h2>Servidores MCP</h2>
        <Table cols={["Servidor", "Estado", "Herramientas", "Detalle"]} rows={mcp.map((m) => [m.name, m.state, m.tools, m.detail])} onPick={setSel} picked={sel} />
        <div class="row"><button class="ghost" disabled={!server || !connected} onClick={() => act("mcp_restart")}>Reiniciar</button>
          <button class="ghost" disabled={!server || !connected} onClick={() => act("mcp_pause")}>Pausar</button>
          <span class="muted small">Aprobar un servidor nuevo o con herramientas cambiadas se hace solo desde la terminal: <code>python main.py mcp approve &lt;nombre&gt;</code></span></div>
        {msg && <p class="small" role="status">{msg}</p>}</section>
      <section class="card"><h2>Herramientas registradas</h2>
        <Table cols={["Herramienta", "Origen", "Permiso", "Salida no confiable"]} rows={tools.map((t) => [t.name, t.source, t.action, t.untrusted ? "si" : "no"])} /></section>
      <section class="card"><h2>Ultimas ejecuciones</h2>
        {hist.error ? <p class="error">{hist.error}</p> : hist.data === null ? <p class="muted">Cargando...</p> :
          <Table cols={cols} rows={hist.data.map((r) => cols.map((c) => (typeof r[c] === "object" ? JSON.stringify(r[c]) : r[c])))} />}</section>
    </div>
  );
}

function Permisos({ link, connected }: { link: Link | undefined; connected: boolean }) {
  const [rows, setRows] = useState<any[] | null>(null);
  const [sel, setSel] = useState<string | undefined>();
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!link || !connected) return;
    link.command<any[]>("get_permissions").then(setRows).catch((e: Error) => setMsg(e.message));
  }, [link, connected]);
  const cur = rows?.find((r) => r.action === sel);
  const tighten = (level: number | string) => {
    if (!cur) return;
    link?.command<any[]>("tighten_permission", { action: cur.action, level }).then((d) => { setRows(d); setMsg("Permiso endurecido (solo en esta sesion)."); })
      .catch((e: Error) => setMsg(`No se pudo endurecer: ${e.message}`));
  };
  const can = (need: number) => !!cur && connected && (ORDER[cur.policy] ?? 99) < need;
  return (
    <section class="card"><h2>Permisos</h2>
      <p class="muted small">Desde aqui solo se puede ENDURECER un permiso, y solo hasta que se cierre Piantao. Para aflojar uno, edita config/permissions.yaml.</p>
      {rows === null ? <p class={msg ? "error" : "muted"}>{msg || "Cargando..."}</p> :
        <Table cols={["Accion", "Politica", "Nivel", "Esta sesion"]} rows={rows.map((r) => [r.action, POLICY[r.policy] ?? r.policy, r.level, r.tightened ? "endurecido" : ""])}
          onPick={(i) => setSel(rows[i].action)} picked={rows.findIndex((r) => r.action === sel)} />}
      <div class="row">
        <button class="ghost" disabled={!can(1)} onClick={() => tighten(3)}>Pedir confirmacion</button>
        <button class="ghost" disabled={!can(2)} onClick={() => tighten(4)}>Confirmacion explicita</button>
        <button class="ghost" disabled={!can(3)} onClick={() => tighten("never")}>Bloquear</button>
      </div>
      {msg && rows !== null && <p class="small" role="status">{msg}</p>}
    </section>
  );
}

function Seguridad({ link, connected }: { link: Link | undefined; connected: boolean }) {
  const { data, error, reload } = useQuery<any[]>(link, connected, "query", { kind: "audit", n: 60 });
  const rows = (data ?? []).slice().reverse().map((e) => {
    const { seq, ts, event, prev, hash, ...extra } = e;
    void prev; void hash;
    return [seq, fmtTs(ts), event, JSON.stringify(extra).slice(0, 200)];
  });
  return (
    <section class="card"><h2>Auditoria</h2>
      <div class="row"><button class="ghost" onClick={reload}>Actualizar</button><span class="muted small">Ultimos 60 eventos. Verificar la cadena de hashes: <code>python main.py audit --verify</code></span></div>
      {error ? <p class="error">{error}</p> : data === null ? <p class="muted">Cargando...</p> : <Table cols={["#", "Hora", "Evento", "Datos"]} rows={rows} />}
    </section>
  );
}
