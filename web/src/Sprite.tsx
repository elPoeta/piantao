import { BLINK_S, STATE_LABEL, cssColor, poseFor } from "./sprites";

/** Figura de Piantao segun el estado: la pose sale de la hoja de sprites y el resplandor parpadea con el color del estado. */
export function Sprite({ state, size = 64, label = true }: { state: string; size?: number; label?: boolean }) {
  const pose = poseFor(state);
  const blink = state === "offline" || state === "stopped" ? "0s" : `${BLINK_S[state] ?? 1.2}s`;
  return (
    <div class={`piantao ${pose} st-${state}`} role={label ? "img" : undefined} aria-label={label ? STATE_LABEL[state] ?? state : undefined} aria-hidden={label ? undefined : "true"}
      data-pose={pose} style={`--c:${cssColor(state)};--blink:${blink};--pw:${size}px`} />
  );
}
