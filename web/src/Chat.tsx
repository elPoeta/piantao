import { DockSlots, SendIcon, StopIcon, NewIcon, ClipIcon } from "./Dock";
import type { Attachment } from "./api";
import { useEffect, useRef, useState } from "preact/hooks";
import { Markdown } from "./markdown";

export type Part =
  | { k: "text"; t: string }
  | { k: "reasoning"; t: string }
  | { k: "tool"; name: string; args: string; done: boolean; ok?: boolean; denied?: boolean; out?: string };
export interface Msg { id: number; role: "user" | "assistant"; parts: Part[]; streaming?: boolean; error?: string; outcome?: string }

export function applyChat(msgs: Msg[], m: Record<string, any>): Msg[] {
  const id = Number(m.turn);
  if (m.ev === "start") return [...msgs, { id: id * 2 - 1, role: "user", parts: [{ k: "text", t: String(m.text) }] },
    { id: id * 2, role: "assistant", parts: [], streaming: true }];
  return msgs.map((x) => {
    if (x.id !== id * 2) return x;
    const parts = x.parts.slice();
    const last = parts[parts.length - 1];
    if (m.ev === "text" || m.ev === "reasoning") {
      const k = m.ev as "text" | "reasoning";
      if (last && last.k === k) parts[parts.length - 1] = { ...last, t: last.t + String(m.text) } as Part;
      else parts.push({ k, t: String(m.text) });
      return { ...x, parts };
    }
    if (m.ev === "tool_start") { parts.push({ k: "tool", name: String(m.name), args: String(m.args ?? ""), done: false }); return { ...x, parts }; }
    if (m.ev === "tool_result") {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (p.k === "tool" && !p.done && p.name === m.name) { parts[i] = { ...p, done: true, ok: !!m.ok, denied: !!m.denied, out: String(m.text ?? "") }; break; }
      }
      return { ...x, parts };
    }
    if (m.ev === "error") return { ...x, error: String(m.error) };
    if (m.ev === "done") return { ...x, streaming: false, outcome: String(m.outcome) };
    return x;
  });
}

function ToolCard({ p }: { p: Extract<Part, { k: "tool" }> }) {
  const status = !p.done ? "ejecutando..." : p.denied ? "denegada" : p.ok ? "ok" : "error";
  return (
    <details class={`tool tool-${!p.done ? "run" : p.denied ? "denied" : p.ok ? "ok" : "err"}`}>
      <summary>{p.name.startsWith("skill_") ? "Skill" : "Herramienta"} <b>{p.name}</b> · {status}</summary>
      {p.args && <pre>{p.args}</pre>}
      {p.out && <pre class="out">{p.out}</pre>}
    </details>
  );
}

function Bubble({ m, onPin }: { m: Msg; onPin?: (text: string) => void }) {
  const full = m.role === "assistant" && !m.streaming ? m.parts.filter((p) => p.k === "text").map((p) => (p as { t: string }).t).join("\n").trim() : "";
  return (
    <article class={`bubble bubble-${m.role}`}>
      {m.parts.map((p) => p.k === "text" ? (m.role === "assistant" ? <Markdown text={p.t} /> : <p class="plain">{p.t}</p>)
        : p.k === "reasoning" ? <details class="reasoning"><summary>Razonamiento</summary><p class="plain">{p.t}</p></details>
        : <ToolCard p={p} />)}
      {m.streaming && m.parts.length === 0 && <span class="muted">Pensando...</span>}
      {m.error && <p class="error" role="alert">{m.error}</p>}
      {full && onPin && <button type="button" class="linklike small" onClick={() => onPin(full)}>Sacar a tarjeta</button>}
      {m.outcome === "interrupted" && <p class="muted small">(interrumpido)</p>}
    </article>
  );
}

const fmtSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export function Chat({ msgs, busy, connected, onSend, onStop, onNew, onPin, dock, attachments = [], uploading = [], onAttach, onUnattach }:
  { attachments?: Attachment[]; uploading?: string[]; onAttach?: (files: File[]) => void; onUnattach?: (id: string) => void; msgs: Msg[]; busy: boolean; connected: boolean; onSend: (t: string) => void; onStop: () => void; onNew: () => void; onPin?: (text: string) => void; dock?: DockSlots }) {
  const [text, setText] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const picker = useRef<HTMLInputElement>(null);
  const [dropping, setDropping] = useState(false);
  const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes("Files");

  useEffect(() => { const el = list.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);

  function send() {
    const t = text.trim();
    if (!t || busy || !connected) return;
    onSend(t); setText(""); stick.current = true;
  }

  return (
    <section class={dropping ? "chat dropping" : "chat"}
      onDragOver={(e) => { if (onAttach && hasFiles(e)) { e.preventDefault(); setDropping(true); } }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDropping(false); }}
      onDrop={(e) => { if (onAttach && hasFiles(e)) { e.preventDefault(); setDropping(false); onAttach([...e.dataTransfer!.files]); } }}>
      <div class="messages" ref={list} aria-live="polite"
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
        {msgs.length === 0 && <p class="muted center">Escribile algo a Piantao.</p>}
        {msgs.map((m) => <Bubble key={m.id} m={m} onPin={onPin} />)}
      </div>
      {(attachments.length > 0 || uploading.length > 0) && (
        <ul class="chips" aria-label="Archivos adjuntos">
          {attachments.map((a) => (
            <li key={a.id} class="chip" title={`${a.name} · ${a.kind === "image" ? "imagen (Piantao solo ve el nombre)" : a.chars + " caracteres de texto"}`}>
              <span class="chip-name">{a.name}</span><span class="chip-size">{fmtSize(a.size)}</span>
              <button type="button" class="chip-x" aria-label={`Quitar ${a.name}`} onClick={() => onUnattach?.(a.id)}>×</button>
            </li>))}
          {uploading.map((n, i) => <li key={`up${i}`} class="chip chip-up"><span class="chip-name">{n}</span><span class="chip-size">subiendo...</span></li>)}
        </ul>
      )}
      {dock?.status}
      <form class="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea value={text} rows={3} maxLength={8000} placeholder={connected ? "Mensaje (Enter envia, Shift+Enter salto de linea)" : "Sin conexion..."}
          aria-label="Mensaje" onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          onPaste={(e) => { const f = [...(e.clipboardData?.files ?? [])]; if (f.length && onAttach) { e.preventDefault(); onAttach(f); } }}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } }} />
        <div class="composer-actions">
          {busy ? <button type="button" class="icon-btn stop" aria-label="Detener" title="Detener" onClick={onStop}><StopIcon /></button>
            : <button type="submit" class="icon-btn send" aria-label="Enviar" title="Enviar (Enter)" disabled={!text.trim() || !connected}><SendIcon /></button>}
          <button type="button" class="icon-btn" aria-label="Nueva conversación" title="Nueva conversación" disabled={busy || msgs.length === 0} onClick={onNew}><NewIcon /></button>
          {onAttach && <>
            <input ref={picker} type="file" multiple hidden aria-hidden="true" tabIndex={-1} data-testid="file-input" onChange={(e) => { const el = e.currentTarget; onAttach([...(el.files ?? [])]); el.value = ""; }} />
            <button type="button" class="icon-btn" aria-label="Adjuntar archivos" title="Adjuntar archivos (también podés arrastrarlos o pegarlos)" onClick={() => picker.current?.click()}><ClipIcon /></button>
          </>}
          {dock?.buttons}
        </div>
        {dock?.panel}
      </form>
    </section>
  );
}
