import { useEffect, useRef, useState } from "preact/hooks";
import { VisionState, VisionStatus } from "./vision";

const POSE: Record<string, string> = { open_palm: "mano abierta", fist: "puño", point: "índice", thumb_up: "pulgar arriba", thumb_down: "pulgar abajo", none: "—" };
const GESTURE: Record<string, string> = {
  palm: "Palma: detener", activate: "Interacción activada", deactivate: "Interacción desactivada", thumb_up: "Pulgar arriba", thumb_down: "Pulgar abajo",
  point: "Índice", swipe_left: "Deslizar a la izquierda", swipe_right: "Deslizar a la derecha",
};

export interface VisionUi { available: boolean; state: VisionState; detail: string; status: VisionStatus | null; lastGesture: string; error: string; calibrated: boolean }

export function VisionBar({ ui, onToggle, onVideo, onCalibrate, onApply }: {
  ui: VisionUi; onToggle: () => void; onVideo: (v: HTMLVideoElement | null, c: HTMLCanvasElement | null) => void;
  onCalibrate: (pose: "open" | "closed") => Promise<string>; onApply: () => Promise<string>;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [preview, setPreview] = useState(true);
  const [calMsg, setCalMsg] = useState("");
  const [calBusy, setCalBusy] = useState(false);
  // los elementos solo existen cuando la barra esta disponible: se (re)enlazan al aparecer
  useEffect(() => { onVideo(video.current, canvas.current); return () => onVideo(null, null); }, [ui.available]);
  const on = ui.state === "on";

  async function cal(fn: () => Promise<string>) {
    setCalBusy(true); setCalMsg("");
    try { setCalMsg(await fn()); } catch (e) { setCalMsg((e as Error).message); }
    setCalBusy(false);
  }

  if (!ui.available) return null;
  return (
    <section class="visionbar" aria-label="Cámara y gestos">
      <div class="voice-row">
        <button type="button" class={on ? "mic mic-on" : "mic"} aria-pressed={on} disabled={ui.state === "loading"} onClick={onToggle}>
          {on ? "Apagar cámara" : "Activar cámara y gestos"}
        </button>
        {on && <label class="small check"><input type="checkbox" checked={preview} onChange={(e) => setPreview((e.target as HTMLInputElement).checked)} /> Ver vista previa</label>}
        <span class="small muted">{ui.state === "loading" ? ui.detail : on ? "Solo viajan los 21 puntos de tu mano; ninguna imagen sale de esta página." : "La cámara solo se abre cuando la activás."}</span>
      </div>
      {on && ui.status && (
        <div class="voice-row small">
          <span>Pose: <b>{POSE[ui.status.pose] ?? ui.status.pose}</b>{ui.status.hand ? "" : " (sin mano a la vista)"}</span>
          <span class={ui.status.armed ? "armed" : "muted"}>{ui.status.armed ? "Interacción activada" : "Mano abierta 1,5 s para activar"}</span>
          {ui.lastGesture && <span class="gesture-toast" role="status">{GESTURE[ui.lastGesture] ?? ui.lastGesture}</span>}
        </div>
      )}
      <div class={on && preview ? "camview" : "camview camview-hidden"}>
        <video ref={video} class="camvideo" playsInline muted aria-label="Vista previa de la cámara" />
        <canvas ref={canvas} class="camcanvas" aria-hidden="true" />
      </div>
      {on && (
        <details class="calib">
          <summary class="small">Calibrar a tu mano{ui.calibrated ? " (ya calibrado)" : ""}</summary>
          <p class="small muted">Mostrá la mano bien abierta y medí; después cerrá el puño y medí otra vez; por último aplicá. Cada medición dura 3 s.</p>
          <div class="voice-row">
            <button type="button" class="ghost" disabled={calBusy} onClick={() => cal(() => onCalibrate("open"))}>Medir mano abierta</button>
            <button type="button" class="ghost" disabled={calBusy} onClick={() => cal(() => onCalibrate("closed"))}>Medir puño</button>
            <button type="button" disabled={calBusy} onClick={() => cal(onApply)}>Aplicar</button>
          </div>
          {calMsg && <p class="small" role="status">{calMsg}</p>}
        </details>
      )}
      {ui.error && <p class="error small" role="alert">{ui.error}</p>}
    </section>
  );
}
