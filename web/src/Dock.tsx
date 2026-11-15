import { ComponentChildren } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import { VoiceMode, VoiceState } from "./voice";
import { VisionState, VisionStatus } from "./vision";

// Dock del chat: botones de icono (microfono, camara, opciones) que se colocan junto a enviar/nueva conversacion, y UNA linea de estado. Todo lo demas (modo de voz, lectura en voz
// alta, vista previa, calibracion) vive dentro del panel de opciones, cerrado por defecto: el chat queda limpio.
const STATE_TEXT: Record<VoiceState, string> = { off: "", loading: "Cargando voz...", ready: "Mic listo", listening: "Escuchando...", transcribing: "Transcribiendo...", speaking: "Piantao habla" };
const MODE_HELP: Record<VoiceMode, string> = {
  ptt: "Mantené la barra espaciadora (o el botón Hablar) para hablar.",
  wake: "Decí «piantao» y tu orden.",
  always: "Escucha todo el tiempo: lo que digas se transcribe en este equipo.",
};
const POSE: Record<string, string> = { open_palm: "mano abierta", fist: "puño", point: "índice", thumb_up: "pulgar arriba", thumb_down: "pulgar abajo", none: "—" };
const GESTURE: Record<string, string> = {
  palm: "Palma: detener", activate: "Interacción activada", deactivate: "Interacción desactivada", thumb_up: "Pulgar arriba", thumb_down: "Pulgar abajo",
  point: "Índice", swipe_left: "Deslizar a la izquierda", swipe_right: "Deslizar a la derecha",
};

export interface VoiceUi {
  available: boolean; state: VoiceState; detail: string; level: number; mode: VoiceMode; error: string; last: string; readAloud: boolean; bargeIn: boolean;
}
export interface VisionUi { available: boolean; state: VisionState; detail: string; status: VisionStatus | null; lastGesture: string; error: string; calibrated: boolean }

const Icon = ({ children }: { children: ComponentChildren }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{children}</svg>
);
const MicIcon = () => <Icon><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Icon>;
const CamIcon = () => <Icon><rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10 5-3v10l-5-3" /></Icon>;
const WaveIcon = () => <Icon><path d="M4 12h2M8 8v8M12 4v16M16 8v8M20 12h-2" /></Icon>;
const MuteIcon = () => <Icon><path d="M11 5 6 9H3v6h3l5 4V5zM16 9l5 6M21 9l-5 6" /></Icon>;
export const SendIcon = () => <Icon><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
export const StopIcon = () => <Icon><rect x="6" y="6" width="12" height="12" rx="2" /></Icon>;
export const ClipIcon = () => <Icon><path d="m20 11.5-8.2 8.2a5 5 0 0 1-7.1-7.1l8.6-8.6a3.4 3.4 0 0 1 4.8 4.8l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" /></Icon>;
export const NewIcon = () => <Icon><path d="M12 5v14M5 12h14" /></Icon>;
const GearIcon = () => <Icon><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></Icon>;

export interface DockSlots { buttons: ComponentChildren; status: ComponentChildren; panel: ComponentChildren }

interface Props {
  children: (slots: DockSlots) => ComponentChildren;
  voice: VoiceUi; vision: VisionUi;
  onMode: (m: VoiceMode) => void; onToggleMic: () => void; onPtt: (down: boolean) => void; onStop: () => void; onReadAloud: (v: boolean) => void;
  onToggleCam: () => void; onVideo: (v: HTMLVideoElement | null, c: HTMLCanvasElement | null) => void;
  onCalibrate: (pose: "open" | "closed") => Promise<string>; onApply: () => Promise<string>;
}

export function Dock({ children, voice: ui, vision: vis, onMode, onToggleMic, onPtt, onStop, onReadAloud, onToggleCam, onVideo, onCalibrate, onApply }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(true);
  const [calMsg, setCalMsg] = useState("");
  const [calBusy, setCalBusy] = useState(false);
  // los elementos de video existen siempre (ocultos si no hay vista previa): se enlazan al aparecer la camara
  useEffect(() => { onVideo(video.current, canvas.current); return () => onVideo(null, null); }, [vis.available]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const micOn = ui.state !== "off", camOn = vis.state === "on";

  async function cal(fn: () => Promise<string>) {
    setCalBusy(true); setCalMsg("");
    try { setCalMsg(await fn()); } catch (e) { setCalMsg((e as Error).message); }
    setCalBusy(false);
  }
  // una sola linea de estado, solo cuando hay algo que decir
  const status = micOn ? (ui.detail || STATE_TEXT[ui.state]) : ui.state === "loading" ? ui.detail || STATE_TEXT.loading : "";
  const camStatus = vis.state === "loading" ? vis.detail : camOn && vis.lastGesture ? GESTURE[vis.lastGesture] ?? vis.lastGesture : "";
  const error = ui.error || vis.error;

  const buttons = (
    <>
      {ui.available && (
        <button type="button" class={micOn ? "icon-btn on" : "icon-btn"} aria-pressed={micOn} aria-label={micOn ? "Apagar micrófono" : "Activar micrófono"} title={micOn ? "Apagar micrófono" : "Activar micrófono"}
          disabled={ui.state === "loading"} onClick={onToggleMic}><MicIcon /></button>
      )}
      {vis.available && (
        <button type="button" class={camOn ? "icon-btn on" : "icon-btn"} aria-pressed={camOn} aria-label={camOn ? "Apagar cámara" : "Activar cámara y gestos"} title={camOn ? "Apagar cámara" : "Activar cámara y gestos"}
          disabled={vis.state === "loading"} onClick={onToggleCam}><CamIcon /></button>
      )}
      {micOn && ui.mode === "ptt" && (
        <button type="button" class="icon-btn ptt" aria-label="Hablar" title="Mantener para hablar (o la barra espaciadora)" onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onPtt(true); }}
          onPointerUp={() => onPtt(false)} onPointerCancel={() => onPtt(false)}><WaveIcon /></button>
      )}
      {micOn && ui.state === "speaking" && <button type="button" class="icon-btn" aria-label="Callar" title="Callar a Piantao" onClick={onStop}><MuteIcon /></button>}
      {(ui.available || vis.available) && (
        <button type="button" class={open ? "icon-btn on-soft" : "icon-btn"} aria-expanded={open} aria-controls="dock-options" aria-label="Opciones de voz y cámara" title="Opciones de voz y cámara" onClick={() => setOpen(!open)}><GearIcon /></button>
      )}
    </>
  );
  const statusText = [status, camStatus].filter(Boolean).join(" · ");
  const statusEl = (statusText || error || micOn) ? (
    <div class="composer-status">
      {micOn && <meter class="level" min={0} max={0.4} value={ui.level} aria-label="Nivel del micrófono" />}
      <span class={`dock-status vstate-${ui.state}`} role="status" aria-live="polite">{statusText}</span>
      {error && <span class="error small" role="alert">{error}</span>}
    </div>
  ) : null;
  const panel = (
    <>
      <div id="dock-options" class="dock-options" hidden={!open}>
        {ui.available && (
          <fieldset>
            <legend>Voz</legend>
            <label class="small">Modo{" "}
              <select value={ui.mode} disabled={micOn} onChange={(e) => onMode((e.target as HTMLSelectElement).value as VoiceMode)}>
                <option value="ptt">Pulsar para hablar</option>
                <option value="wake">Palabra «piantao»</option>
                <option value="always">Siempre escuchando</option>
              </select>
            </label>
            <label class="small check"><input type="checkbox" checked={ui.readAloud} onChange={(e) => onReadAloud((e.target as HTMLInputElement).checked)} /> Leer en voz alta lo que escribo</label>
            <p class="muted small">{MODE_HELP[ui.mode]}{micOn && ui.bargeIn ? " Podés interrumpirme hablando." : ""}</p>
            {ui.last && <p class="muted small">Entendí: «{ui.last}»</p>}
          </fieldset>
        )}
        {vis.available && (
          <fieldset>
            <legend>Cámara y gestos</legend>
            <p class="muted small">{camOn ? "Solo viajan los 21 puntos de tu mano; ninguna imagen sale de esta página." : "La cámara solo se abre cuando la activás."}</p>
            {camOn && <label class="small check"><input type="checkbox" checked={preview} onChange={(e) => setPreview((e.target as HTMLInputElement).checked)} /> Ver vista previa</label>}
            {camOn && vis.status && (
              <p class="small">Pose: <b>{POSE[vis.status.pose] ?? vis.status.pose}</b>{vis.status.hand ? "" : " (sin mano a la vista)"} · <span class={vis.status.armed ? "armed" : "muted"}>{vis.status.armed ? "Interacción activada" : "Mano abierta 1,5 s para activar"}</span></p>
            )}
            {camOn && (
              <details class="calib">
                <summary class="small">Calibrar a tu mano{vis.calibrated ? " (ya calibrado)" : ""}</summary>
                <p class="small muted">Mostrá la mano bien abierta y medí; después cerrá el puño y medí otra vez; por último aplicá. Cada medición dura 3 s.</p>
                <div class="voice-row">
                  <button type="button" class="ghost" disabled={calBusy} onClick={() => cal(() => onCalibrate("open"))}>Medir mano abierta</button>
                  <button type="button" class="ghost" disabled={calBusy} onClick={() => cal(() => onCalibrate("closed"))}>Medir puño</button>
                  <button type="button" disabled={calBusy} onClick={() => cal(onApply)}>Aplicar</button>
                </div>
                {calMsg && <p class="small" role="status">{calMsg}</p>}
              </details>
            )}
          </fieldset>
        )}
      </div>
      <div class={camOn && preview ? "camview" : "camview camview-hidden"}>
        <video ref={video} class="camvideo" playsInline muted aria-label="Vista previa de la cámara" />
        <canvas ref={canvas} class="camcanvas" aria-hidden="true" />
      </div>
    </>
  );
  return <>{children({ buttons, status: statusEl, panel })}</>;
}
