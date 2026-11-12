import { useEffect } from "preact/hooks";
import { VoiceMode, VoiceState } from "./voice";

const STATE_TEXT: Record<VoiceState, string> = {
  off: "Micrófono apagado", loading: "Cargando voz...", ready: "Listo", listening: "Escuchando...", transcribing: "Transcribiendo...", speaking: "Piantao habla",
};
const MODE_HELP: Record<VoiceMode, string> = {
  ptt: "Mantené el botón (o la barra espaciadora) para hablar.",
  wake: "Decí «piantao» y tu orden.",
  always: "Escucha todo el tiempo: lo que digas se transcribe en este equipo.",
};

export interface VoiceUi {
  available: boolean; state: VoiceState; detail: string; level: number; mode: VoiceMode; error: string; last: string; readAloud: boolean; bargeIn: boolean;
}

export function VoiceBar({ ui, onMode, onToggle, onPtt, onStop, onReadAloud }: {
  ui: VoiceUi; onMode: (m: VoiceMode) => void; onToggle: () => void; onPtt: (down: boolean) => void; onStop: () => void; onReadAloud: (v: boolean) => void;
}) {
  const on = ui.state !== "off";

  useEffect(() => {
    if (!on || ui.mode !== "ptt") return;
    const typing = (t: EventTarget | null) => t instanceof HTMLElement && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.isContentEditable);
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat && !typing(e.target)) { e.preventDefault(); onPtt(true); } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space" && !typing(e.target)) { e.preventDefault(); onPtt(false); } };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [on, ui.mode]);

  if (!ui.available) return null;
  return (
    <section class="voicebar" aria-label="Voz">
      <div class="voice-row">
        <label class="small">Modo{" "}
          <select value={ui.mode} disabled={on} onChange={(e) => onMode((e.target as HTMLSelectElement).value as VoiceMode)}>
            <option value="ptt">Pulsar para hablar</option>
            <option value="wake">Palabra «piantao»</option>
            <option value="always">Siempre escuchando</option>
          </select>
        </label>
        <button type="button" class={on ? "mic mic-on" : "mic"} aria-pressed={on} disabled={ui.state === "loading"} onClick={onToggle}>
          {on ? "Apagar micrófono" : "Activar micrófono"}
        </button>
        {on && ui.mode === "ptt" && (
          <button type="button" class="ptt" onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onPtt(true); }}
            onPointerUp={() => onPtt(false)} onPointerCancel={() => onPtt(false)}>Mantener para hablar</button>
        )}
        {on && ui.state === "speaking" && <button type="button" class="ghost" onClick={onStop}>Callar</button>}
        <label class="small check"><input type="checkbox" checked={ui.readAloud} onChange={(e) => onReadAloud((e.target as HTMLInputElement).checked)} /> Leer en voz alta lo que escribo</label>
      </div>
      <div class="voice-row small">
        <span class={`vstate vstate-${ui.state}`} role="status" aria-live="polite">{ui.detail || STATE_TEXT[ui.state]}</span>
        {on && <meter class="level" min={0} max={0.4} value={ui.level} aria-label="Nivel del micrófono" />}
        {on && <span class="muted">{MODE_HELP[ui.mode]}{ui.bargeIn ? " Podés interrumpirme hablando." : ""}</span>}
      </div>
      {ui.last && <p class="muted small">Entendí: «{ui.last}»</p>}
      {ui.error && <p class="error small" role="alert">{ui.error}</p>}
    </section>
  );
}
