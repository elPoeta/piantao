import { ComponentChildren } from "preact";
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

export function Chat({ msgs, busy, connected, onSend, onStop, onNew, onPin, extra }:
  { msgs: Msg[]; busy: boolean; connected: boolean; onSend: (t: string) => void; onStop: () => void; onNew: () => void; onPin?: (text: string) => void; extra?: ComponentChildren }) {
  const [text, setText] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useEffect(() => { const el = list.current; if (el && stick.current) el.scrollTop = el.scrollHeight; }, [msgs]);

  function send() {
    const t = text.trim();
    if (!t || busy || !connected) return;
    onSend(t); setText(""); stick.current = true;
  }

  return (
    <section class="chat">
      <div class="messages" ref={list} aria-live="polite"
        onScroll={(e) => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
        {msgs.length === 0 && <p class="muted center">Escribile algo a Piantao.</p>}
        {msgs.map((m) => <Bubble key={m.id} m={m} onPin={onPin} />)}
      </div>
      {extra}
      <form class="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea value={text} rows={2} maxLength={8000} placeholder={connected ? "Mensaje (Enter envia, Shift+Enter salto de linea)" : "Sin conexion..."}
          aria-label="Mensaje" onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } }} />
        <div class="composer-actions">
          {busy ? <button type="button" class="stop" onClick={onStop}>Detener</button>
            : <button type="submit" disabled={!text.trim() || !connected}>Enviar</button>}
          <button type="button" class="ghost" disabled={busy || msgs.length === 0} onClick={onNew}>Nueva conversacion</button>
        </div>
      </form>
    </section>
  );
}
