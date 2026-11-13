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

export const TILE_W = 150, TILE_H = 104;
export type TileKind = "dir" | "image" | "text" | "pdf" | "other" | "up" | "more" | "root";

/** Mosaico del explorador: icono dibujado + nombre (2 lineas). Sin boton de cerrar. */
export function renderTile(name: string, kind: TileKind): CardArt {
  const canvas = document.createElement("canvas");
  canvas.width = TILE_W * RES; canvas.height = TILE_H * RES;
  const g = canvas.getContext("2d")!;
  g.scale(RES, RES);
  const col = kind === "dir" || kind === "root" || kind === "up" || kind === "more" ? "rgba(244,162,97,0.95)" : "rgba(76,201,240,0.95)";
  roundRect(g, 1, 1, TILE_W - 2, TILE_H - 2, 12);
  g.fillStyle = "rgba(12,24,38,0.82)"; g.fill(); g.lineWidth = 1.5; g.strokeStyle = col; g.stroke();
  g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2.5; g.lineJoin = "round";
  const cx = TILE_W / 2, top = 12;
  if (kind === "dir" || kind === "root") { roundRect(g, cx - 22, top + 8, 44, 30, 4); g.stroke(); g.beginPath(); g.moveTo(cx - 22, top + 8); g.lineTo(cx - 10, top + 2); g.lineTo(cx - 2, top + 8); g.stroke(); }
  else if (kind === "image") { g.strokeRect(cx - 22, top + 2, 44, 34); g.beginPath(); g.moveTo(cx - 20, top + 34); g.lineTo(cx - 6, top + 16); g.lineTo(cx + 4, top + 28); g.lineTo(cx + 12, top + 20); g.lineTo(cx + 20, top + 34); g.stroke(); g.beginPath(); g.arc(cx + 12, top + 10, 3.5, 0, 7); g.fill(); }
  else if (kind === "up") { g.beginPath(); g.moveTo(cx - 14, top + 24); g.lineTo(cx, top + 8); g.lineTo(cx + 14, top + 24); g.moveTo(cx, top + 8); g.lineTo(cx, top + 36); g.stroke(); }
  else if (kind === "more") { for (const d of [-14, 0, 14]) { g.beginPath(); g.arc(cx + d, top + 22, 3.5, 0, 7); g.fill(); } }
  else { g.strokeRect(cx - 16, top + 1, 32, 38); for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(cx - 9, top + 10 + i * 7); g.lineTo(cx + 9, top + 10 + i * 7); g.stroke(); } if (kind === "pdf") { g.font = "700 10px system-ui, sans-serif"; g.textAlign = "center"; g.fillText("PDF", cx, top + 46); g.textAlign = "left"; } }
  g.fillStyle = "#e6edf5"; g.font = "12px system-ui, sans-serif"; g.textBaseline = "top"; g.textAlign = "center";
  const m = (t: string) => g.measureText(t).width;
  const lines = wrapText(m, name, TILE_W - 14).slice(0, 2);
  if (lines.length === 2 && wrapText(m, name, TILE_W - 14).length > 2) lines[1] = lines[1].replace(/.{0,1}$/, "") + "…";
  lines.forEach((l, i) => g.fillText(l, TILE_W / 2, 62 + i * 15));
  return { canvas, w: TILE_W, h: TILE_H };
}
