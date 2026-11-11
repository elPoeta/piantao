import { useEffect, useState } from "preact/hooks";
import { pair } from "./api";

export function Pair({ onPaired }: { onPaired: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(c: string) {
    if (busy || !c.trim()) return;
    setBusy(true); setError("");
    const r = await pair(c);
    setBusy(false);
    if (r.ok) onPaired(); else setError(r.error ?? "codigo invalido");
  }

  useEffect(() => {
    const m = /(?:^|[#&])pair=([A-Za-z0-9-]{4,32})/.exec(location.hash);
    if (m) {
      history.replaceState(null, "", location.pathname); // el codigo no queda en la barra ni en el historial
      void submit(m[1]);
    }
  }, []);

  return (
    <main class="pair">
      <div class="orb orb-idle" aria-hidden="true" />
      <h1>Piantao</h1>
      <p class="muted">Para vincular este navegador, pedi un codigo en la terminal:</p>
      <pre class="cmd">python main.py pair</pre>
      <form onSubmit={(e) => { e.preventDefault(); void submit(code); }}>
        <input class="code" value={code} autofocus autocomplete="off" spellcheck={false} maxLength={12} placeholder="ABCD-2345"
          aria-label="Codigo de emparejamiento" onInput={(e) => setCode((e.target as HTMLInputElement).value.toUpperCase())} />
        <button type="submit" disabled={busy || !code.trim()}>{busy ? "Verificando..." : "Emparejar"}</button>
      </form>
      {error && <p class="error" role="alert">{error}</p>}
    </main>
  );
}
