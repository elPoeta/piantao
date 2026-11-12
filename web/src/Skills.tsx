import { useEffect, useState } from "preact/hooks";
import { Link } from "./api";

interface SkillFile { path: string; bytes: number }
interface SkillItem { name: string; status: string; description: string; fingerprint: string; files: SkillFile[]; error: string }
const LABEL: Record<string, string> = { approved: "aprobada", pending: "pendiente", changed: "cambio desde la aprobacion", invalid: "invalida", duplicate: "duplicada" };

export function Skills({ link, connected }: { link: Link | undefined; connected: boolean }) {
  const [data, setData] = useState<{ dirs: string[]; skills: SkillItem[]; enabled: boolean } | null>(null);
  const [error, setError] = useState("");
  const [sel, setSel] = useState<{ name: string; path: string; text: string } | null>(null);

  async function load() {
    if (!link) return;
    try { setData(await link.command("skills_list")); setError(""); } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { if (connected) void load(); }, [connected]);

  async function open(name: string, path?: string) {
    try {
      const v = await link!.command("skill_view", path ? { name, path } : { name });
      setSel({ name, path: v.path ?? "SKILL.md", text: v.text });
    } catch (e) { setError((e as Error).message); }
  }

  if (error && !data) return <main class="card"><p class="error">{error}</p><p class="muted">Las skills no estan disponibles en este servicio.</p></main>;
  if (!data) return <main class="card"><p class="muted">Cargando...</p></main>;
  const cur = sel && data.skills.find((s) => s.name === sel.name);
  return (
    <main class="skills">
      <section class="card">
        <h2>Skills</h2>
        <p class="muted small">Carpetas autorizadas: {data.dirs.join(", ")}. Aprobar o retirar una skill se hace solo desde la terminal.</p>
        {data.skills.length === 0 && <p class="muted">No hay skills. Crea una carpeta con un SKILL.md en esa ubicacion.</p>}
        <ul class="skill-list">
          {data.skills.map((s) => (
            <li key={s.name}>
              <button class={`skill-row${sel?.name === s.name ? " on" : ""}`} onClick={() => void open(s.name)}>
                <span class="skill-name">{s.name}</span>
                <span class={`badge badge-${s.status}`}>{LABEL[s.status] ?? s.status}</span>
                <span class="muted small skill-desc">{s.error || s.description}</span>
              </button>
            </li>
          ))}
        </ul>
        <button class="ghost" onClick={() => void load()}>Actualizar</button>
        {error && <p class="error" role="alert">{error}</p>}
      </section>
      {sel && cur && (
        <section class="card">
          <h2>{cur.name} · {sel.path}</h2>
          {cur.status !== "approved" && cur.status !== "invalid" && (
            <p class="warn">El modelo no puede usar esta skill hasta que la apruebes. Revisa el contenido y los scripts, y despues ejecuta: <code>python main.py skills approve {cur.name}</code></p>
          )}
          <p class="muted small">Huella {cur.fingerprint}... · archivos:{" "}
            {cur.files.map((f) => <button key={f.path} class="linklike" onClick={() => void open(cur.name, f.path)}>{f.path}</button>)}</p>
          <pre class="payload" tabIndex={0}>{sel.text}</pre>
        </section>
      )}
    </main>
  );
}
