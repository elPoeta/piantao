import { useEffect, useRef, useState } from "preact/hooks";
import { Link, sessionPaired } from "./api";
import { ConfirmReq, PHRASE } from "./Confirm";

// Vista HUD (/hud): orbe de estado y tarjeta de permisos, pensada para una ventana chica y sin marcos (o "siempre encima" con KWin).
// Comparte sesion con la pagina principal; si no hay sesion, avisa y no ofrece emparejar aca.
const LABEL: Record<string, string> = { idle: "En reposo", listening: "Escuchando", thinking: "Pensando", speaking: "Hablando", acting: "Actuando", confirming: "Esperando tu permiso", offline: "Sin conexion" };

export function Hud() {
  const [state, setState] = useState("offline");
  const [paired, setPaired] = useState<boolean | null>(null);
  const [confirms, setConfirms] = useState<ConfirmReq[]>([]);
  const [phrase, setPhrase] = useState("");
  const [err, setErr] = useState("");
  const link = useRef<Link>();

  useEffect(() => {
    document.documentElement.classList.add("hud-page");
    void sessionPaired().then(setPaired);
    const l = new Link();
    link.current = l;
    l.onSnapshot = (s) => setState(String(s.state ?? "idle"));
    l.onEvent = (e) => { if (e.kind === "state") setState(String(e.data.state ?? "idle")); };
    l.onConfirm = (m) => {
      if (m.t === "confirm") setConfirms((c) => (c.some((x) => x.id === m.id) ? c : [...c, m as ConfirmReq]));
      else setConfirms((c) => c.filter((x) => x.id !== m.id));
    };
    l.onStatus = (s) => {
      if (s === "open") l.command("chat_history").then((h) => setConfirms(h.pending as ConfirmReq[])).catch(() => {});
      else setState("offline");
      if (s === "unauthorized") setPaired(false);
    };
    l.connect();
    return () => l.close();
  }, []);

  const req = confirms[0];
  useEffect(() => setPhrase(""), [req?.id]);
  const answer = (allow: boolean) => {
    if (!req) return;
    link.current?.command("permission_answer", { id: req.id, allow, phrase: req.explicit ? phrase : undefined })
      .then(() => { setConfirms((c) => c.filter((x) => x.id !== req.id)); setErr(""); }).catch((e: Error) => setErr(e.message));
  };

  if (paired === false) return <div class="hud"><p class="small muted">Abri Piantao en esta misma app o navegador para emparejar, y recarga.</p></div>;
  const shown = req ? "confirming" : state;
  return (
    <div class="hud" data-state={shown}>
      <div class={`orb orb-${shown}`} role="img" aria-label={LABEL[shown] ?? shown} />
      <span class="hud-label small" aria-live="polite">{LABEL[shown] ?? shown}</span>
      {req && (
        <div class="hud-card" role="alertdialog" aria-labelledby="hud-t">
          <b id="hud-t">{req.explicit ? "AUTORIZAR (accion sensible)" : "AUTORIZAR"}</b>
          <p>{req.description}</p>
          {req.tainted && <p class="warn small">Pedida tras leer contenido externo</p>}
          {req.explicit && <input class="code" placeholder={PHRASE} value={phrase} autocomplete="off" spellcheck={false} onInput={(e) => setPhrase((e.target as HTMLInputElement).value)} />}
          <div class="actions"><button class="ghost" onClick={() => answer(false)}>Denegar</button>
            <button disabled={req.explicit && phrase !== PHRASE} onClick={() => answer(true)}>Autorizar</button></div>
          {confirms.length > 1 && <p class="muted small">+{confirms.length - 1} pendientes</p>}
          {err && <p class="error small" role="alert">{err}</p>}
        </div>
      )}
    </div>
  );
}
