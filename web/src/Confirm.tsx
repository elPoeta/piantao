import { useEffect, useRef, useState } from "preact/hooks";

export interface ConfirmReq {
  id: string; kind: string; description: string; origin: string; explicit: boolean; tainted: boolean;
  details: Record<string, string>; payload: string | null; timeout_s: number;
}
export const PHRASE = "CONFIRMAR";

export function ConfirmModal({ req, onAnswer }: { req: ConfirmReq; onAnswer: (allow: boolean, phrase?: string) => void }) {
  const [phrase, setPhrase] = useState("");
  const [left, setLeft] = useState(req.timeout_s);
  const deny = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    deny.current?.focus(); // el foco inicial esta en "Denegar": Enter no autoriza nada por accidente
    const t = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") onAnswer(false); };
    window.addEventListener("keydown", key);
    return () => { clearInterval(t); window.removeEventListener("keydown", key); };
  }, [req.id]);

  const canAllow = !req.explicit || phrase === PHRASE;
  return (
    <div class="overlay" role="presentation">
      <div class="dialog" role="alertdialog" aria-modal="true" aria-labelledby="cf-title" aria-describedby="cf-desc">
        <h2 id="cf-title">{req.explicit ? "Autorizacion explicita" : "Solicitud de permiso"}</h2>
        <p id="cf-desc" class="cf-desc">{req.description}</p>
        <p class="muted small">Accion: <b>{req.kind}</b> · origen: {req.origin} · vence en {left} s</p>
        {req.tainted && <p class="warn" role="note">Esta accion se origino tras leer contenido no confiable (web o herramientas).</p>}
        {Object.keys(req.details).length > 0 && <dl class="small">{Object.entries(req.details).map(([k, v]) => <><dt>{k}</dt><dd>{v}</dd></>)}</dl>}
        {req.payload !== null && <><h3 class="small muted">Contenido exacto</h3><pre class="payload" tabIndex={0}>{req.payload}</pre></>}
        {req.explicit && (
          <label class="small">Para autorizar escribi <b>{PHRASE}</b>
            <input class="code" value={phrase} autocomplete="off" spellcheck={false} onInput={(e) => setPhrase((e.target as HTMLInputElement).value)} />
          </label>
        )}
        <div class="actions">
          <button ref={deny} class="ghost" onClick={() => onAnswer(false)}>Denegar</button>
          <button disabled={!canAllow} onClick={() => onAnswer(true, req.explicit ? phrase : undefined)}>Autorizar</button>
        </div>
      </div>
    </div>
  );
}
