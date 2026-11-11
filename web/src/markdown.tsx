// Markdown minimo y SEGURO: el texto del modelo es no confiable, asi que se convierte a nodos de Preact (nunca innerHTML)
// y los enlaces solo se aceptan si son http(s).
import { ComponentChildren, h } from "preact";

const SAFE_URL = /^https?:\/\/[^\s<>"']+$/i;

function inline(text: string): ComponentChildren[] {
  const out: ComponentChildren[] = [];
  const re = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\n]+\*)|(\[[^\]\n]+\]\([^)\s]+\))/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(<code>{t.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong>{t.slice(2, -2)}</strong>);
    else if (m[3]) out.push(<em>{t.slice(1, -1)}</em>);
    else {
      const mm = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!;
      out.push(SAFE_URL.test(mm[2]) ? <a href={mm[2]} target="_blank" rel="noopener noreferrer nofollow">{mm[1]}</a> : t);
    }
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const blocks: ComponentChildren[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      i++; // cierre (o fin del texto si el bloque aun se esta generando)
      blocks.push(<pre class="codeblock"><code>{code.join("\n")}</code></pre>);
      continue;
    }
    const head = /^(#{1,4})\s+(.*)$/.exec(line);
    if (head) { blocks.push(h(`h${Math.min(head[1].length + 2, 6)}`, null, inline(head[2]))); i++; continue; }
    if (/^\s*[-*]\s+/.test(line)) {
      const items: ComponentChildren[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(<li>{inline(lines[i++].replace(/^\s*[-*]\s+/, ""))}</li>);
      blocks.push(<ul>{items}</ul>);
      continue;
    }
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: ComponentChildren[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(<li>{inline(lines[i++].replace(/^\s*\d+[.)]\s+/, ""))}</li>);
      blocks.push(<ol>{items}</ol>);
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,4}\s|\s*[-*]\s|\s*\d+[.)]\s)/.test(lines[i])) para.push(lines[i++]);
    const kids: ComponentChildren[] = [];
    para.forEach((p, k) => { if (k) kids.push(<br />); kids.push(...inline(p)); });
    blocks.push(<p>{kids}</p>);
  }
  return <div class="md">{blocks}</div>;
}
