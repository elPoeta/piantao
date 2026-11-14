// Dibujo de tarjetas holograficas en un canvas 2D (se usa como textura). Todo el contenido es TEXTO PLANO: nunca HTML.
export interface CardSpec { id: string; title: string; text: string; origin: string; image?: HTMLImageElement | null }
export interface CardArt { canvas: HTMLCanvasElement; w: number; h: number }

export const CARD_W = 300;
const PAD = 16, LINE = 19, HEAD = 46, MAX_H = 420, RES = 2;
const ORIGIN: Record<string, string> = { model: "Piantao", user: "vos", system: "sistema", file: "archivo" };

export function wrapText(measure: (s: string) => number, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para.trim() === "") { out.push(""); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      let w = word;
      while (measure(w) > maxW && w.length > 1) {          // palabras largas: se parten
        let k = w.length - 1;
        while (k > 1 && measure(w.slice(0, k)) > maxW) k--;
        if (line) { out.push(line); line = ""; }
        out.push(w.slice(0, k)); w = w.slice(k);
      }
      const cand = line ? `${line} ${w}` : w;
      if (measure(cand) <= maxW) line = cand;
      else { out.push(line); line = w; }
    }
    out.push(line);
  }
  return out;
}

export function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

export function renderCard(spec: CardSpec): CardArt {
  const probe = document.createElement("canvas").getContext("2d")!;
  probe.font = "14px system-ui, sans-serif";
  const maxW = CARD_W - PAD * 2;
  let lines = spec.text ? wrapText((s) => probe.measureText(s).width, spec.text, maxW) : [];
  const img = spec.image && spec.image.naturalWidth > 0 ? spec.image : null;
  const imgH = img ? Math.min(300, Math.round(maxW * img.naturalHeight / img.naturalWidth)) : 0;
  const room = Math.floor((MAX_H - HEAD - PAD - (img ? imgH + 8 : 0)) / LINE);
  let cut = false;
  if (lines.length > room) { lines = lines.slice(0, Math.max(1, room)); cut = true; lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,2}$/, "") + "…"; }
  const h = Math.min(MAX_H, Math.max(110, HEAD + PAD + (img ? imgH + 8 : 0) + lines.length * LINE));

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W * RES; canvas.height = h * RES;
  const g = canvas.getContext("2d")!;
  g.scale(RES, RES);
  roundRect(g, 1, 1, CARD_W - 2, h - 2, 14);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(76,201,240,0.22)"); grad.addColorStop(1, "rgba(12,24,38,0.78)");
  g.fillStyle = grad; g.fill();
  g.lineWidth = 1.5; g.strokeStyle = spec.origin === "model" ? "rgba(76,201,240,0.9)" : "rgba(244,162,97,0.9)"; g.stroke();

  g.textBaseline = "top";
  g.fillStyle = "#e6edf5"; g.font = "600 16px system-ui, sans-serif";
  let title = spec.title;
  while (title.length > 1 && g.measureText(title).width > CARD_W - 78) title = title.slice(0, -1);
  g.fillText(title === spec.title ? title : title + "…", PAD, 14);
  g.fillStyle = "#8a9bb0"; g.font = "11px system-ui, sans-serif";
  g.fillText(ORIGIN[spec.origin] ?? spec.origin, PAD, 32);

  // boton cerrar: misma geometria que Interaction.onClose (centro a 20 px de la esquina, radio 17)
  g.beginPath(); g.arc(CARD_W - 20, 20, 14, 0, Math.PI * 2); g.fillStyle = "rgba(239,71,111,0.25)"; g.fill();
  g.strokeStyle = "#ef476f"; g.lineWidth = 2; g.beginPath();
  g.moveTo(CARD_W - 25, 15); g.lineTo(CARD_W - 15, 25); g.moveTo(CARD_W - 15, 15); g.lineTo(CARD_W - 25, 25); g.stroke();

  let y = HEAD;
  if (img) { g.drawImage(img, PAD, y, maxW, imgH); y += imgH + 8; }
  g.fillStyle = "#dbe7f3"; g.font = "14px system-ui, sans-serif";
  for (const l of lines) { g.fillText(l, PAD, y); y += LINE; }
  if (cut) { g.fillStyle = "#8a9bb0"; g.font = "11px system-ui, sans-serif"; g.fillText("(recortado)", CARD_W - 78, h - 18); }
  return { canvas, w: CARD_W, h };
}

/** Texto plano de filas heterogeneas (auditoria, memoria, historial de herramientas, permisos) para una tarjeta. */
export function formatRows(rows: unknown, max = 14): string {
  if (!Array.isArray(rows)) return rows && typeof rows === "object" ? formatRow(rows) : String(rows ?? "");
  if (rows.length === 0) return "(sin datos)";
  return rows.slice(-max).map((r) => "• " + formatRow(r)).join("\n");
}
const PREFERRED = ["ts", "time", "tool", "name", "kind", "action", "decision", "level", "ok", "content", "text", "summary", "description"];
function formatRow(r: unknown): string {
  if (r === null || r === undefined) return "";
  if (typeof r !== "object") return clip(String(r), 120);
  const o = r as Record<string, unknown>;
  const keys = PREFERRED.filter((k) => k in o);
  const use = keys.length ? keys : Object.keys(o).slice(0, 4);
  return clip(use.map((k) => `${k === "content" || k === "text" || k === "summary" || k === "description" ? "" : k + "="}${scalar(o[k])}`).join(" "), 160);
}
function scalar(v: unknown): string {
  if (typeof v === "number" && v > 1e9 && v < 4e9) return new Date(v * 1000).toLocaleTimeString();
  if (typeof v === "object" && v !== null) return clip(JSON.stringify(v), 60);
  return String(v);
}
const clip = (s: string, n: number): string => (s.length > n ? s.slice(0, n - 1) + "…" : s);

export type IconKind = "dir" | "image" | "text" | "pdf" | "other" | "up" | "more" | "root";

/** Icono de 24x24 px dibujado con trazos (sin fuentes de emojis) con su esquina superior izquierda en (x, y). */
export function drawIcon(g: CanvasRenderingContext2D, kind: IconKind, x: number, y: number, color: string): void {
  g.save(); g.translate(x, y); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 2; g.lineJoin = "round"; g.lineCap = "round";
  if (kind === "dir" || kind === "root") { roundRect(g, 1, 6, 22, 15, 3); g.stroke(); g.beginPath(); g.moveTo(1, 6); g.lineTo(8, 2); g.lineTo(12, 6); g.stroke(); }
  else if (kind === "image") { g.strokeRect(2, 4, 20, 16); g.beginPath(); g.moveTo(3, 19); g.lineTo(9, 11); g.lineTo(14, 16); g.lineTo(17, 12); g.lineTo(21, 19); g.stroke(); g.beginPath(); g.arc(16, 8, 1.8, 0, 7); g.fill(); }
  else if (kind === "up") { g.beginPath(); g.moveTo(5, 14); g.lineTo(12, 6); g.lineTo(19, 14); g.moveTo(12, 6); g.lineTo(12, 20); g.stroke(); }
  else if (kind === "more") { for (const d of [5, 12, 19]) { g.beginPath(); g.arc(d, 12, 2, 0, 7); g.fill(); } }
  else { g.strokeRect(4, 2, 16, 20); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(8, 8 + i * 5); g.lineTo(16, 8 + i * 5); g.stroke(); } }
  g.restore();
}

export interface ListRowSpec { id: string; label: string; kind: IconKind; hint?: string }
export interface ListArt extends CardArt { rows: { id: string; y0: number; y1: number }[] }
export const LIST_W = 340, ROW_H = 42, LIST_HEAD = 50;

/** Tarjeta-lista (explorador): filas de 42 px, comodas para tocar con la mano. */
export function renderList(title: string, subtitle: string, rows: ListRowSpec[]): ListArt {
  const h = LIST_HEAD + Math.max(1, rows.length) * ROW_H + 10;
  const canvas = document.createElement("canvas");
  canvas.width = LIST_W * RES; canvas.height = h * RES;
  const g = canvas.getContext("2d")!;
  g.scale(RES, RES);
  roundRect(g, 1, 1, LIST_W - 2, h - 2, 14);
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgba(244,162,97,0.20)"); grad.addColorStop(1, "rgba(12,24,38,0.82)");
  g.fillStyle = grad; g.fill(); g.lineWidth = 1.5; g.strokeStyle = "rgba(244,162,97,0.9)"; g.stroke();
  g.textBaseline = "middle";
  g.fillStyle = "#e6edf5"; g.font = "600 16px system-ui, sans-serif";
  let t = title;
  while (t.length > 1 && g.measureText(t).width > LIST_W - 80) t = t.slice(0, -1);
  g.fillText(t === title ? t : t + "…", 16, 20);
  g.fillStyle = "#8a9bb0"; g.font = "11px system-ui, sans-serif"; g.fillText(subtitle, 16, 38);
  g.beginPath(); g.arc(LIST_W - 20, 20, 14, 0, Math.PI * 2); g.fillStyle = "rgba(239,71,111,0.25)"; g.fill();
  g.strokeStyle = "#ef476f"; g.lineWidth = 2; g.beginPath(); g.moveTo(LIST_W - 25, 15); g.lineTo(LIST_W - 15, 25); g.moveTo(LIST_W - 15, 15); g.lineTo(LIST_W - 25, 25); g.stroke();
  const out: ListArt["rows"] = [];
  rows.forEach((r, i) => {
    const y0 = LIST_HEAD + i * ROW_H;
    out.push({ id: r.id, y0, y1: y0 + ROW_H });
    roundRect(g, 8, y0 + 3, LIST_W - 16, ROW_H - 6, 8);
    g.fillStyle = i % 2 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.07)"; g.fill();
    const accent = r.kind === "dir" || r.kind === "root" || r.kind === "up" || r.kind === "more" ? "#f4a261" : "#4cc9f0";
    drawIcon(g, r.kind, 16, y0 + 9, accent);
    g.fillStyle = "#e6edf5"; g.font = "14px system-ui, sans-serif"; g.textAlign = "left";
    let label = r.label;
    const room = LIST_W - 56 - (r.hint ? 62 : 16);
    while (label.length > 1 && g.measureText(label).width > room) label = label.slice(0, -1);
    g.fillText(label === r.label ? label : label + "…", 48, y0 + ROW_H / 2);
    if (r.hint) { g.fillStyle = "#8a9bb0"; g.font = "11px system-ui, sans-serif"; g.textAlign = "right"; g.fillText(r.hint, LIST_W - 16, y0 + ROW_H / 2); g.textAlign = "left"; }
  });
  if (rows.length === 0) { g.fillStyle = "#8a9bb0"; g.font = "13px system-ui, sans-serif"; g.fillText("(vacío)", 20, LIST_HEAD + ROW_H / 2); }
  return { canvas, w: LIST_W, h, rows: out };
}
