// Ventana de documento: el texto o la imagen se dibujan en un canvas 2D (textura) con desplazamiento. Todo es TEXTO PLANO.
import { roundRect, wrapText } from "./holo-cards";

export const WIN_W = 560, WIN_H = 680, WIN_TITLE = 48;
const RES = 1.5, PAD = 22;

export interface DocContent { title: string; text: string; image: HTMLImageElement | null; md: boolean; origin: string }
interface Line { text: string; font: string; color: string; h: number; x: number }

const ORIGIN: Record<string, string> = { model: "Piantao", user: "vos", system: "sistema", file: "archivo" };

export class DocView {
  readonly canvas = document.createElement("canvas");
  private lines: Line[] = [];
  private imgH = 0;
  contentH = 0;
  scroll = 0;
  get title(): string { return this.doc.title; }
  constructor(private doc: DocContent) {
    this.canvas.width = Math.round(WIN_W * RES); this.canvas.height = Math.round(WIN_H * RES);
    const g = this.canvas.getContext("2d")!;
    const maxW = WIN_W - PAD * 2 - 10;
    const img = doc.image && doc.image.naturalWidth > 0 ? doc.image : null;
    if (img) this.imgH = Math.round(maxW * img.naturalHeight / img.naturalWidth);
    let inCode = false;
    for (const raw of doc.text.split("\n")) {
      if (doc.md && raw.trim().startsWith("```")) { inCode = !inCode; continue; }
      let font = "14.5px system-ui, sans-serif", color = "#dbe7f3", h = 21, x = 0, text = raw;
      if (inCode) { font = "13px ui-monospace, monospace"; color = "#b8d8ff"; h = 19; x = 8; }
      else if (doc.md) {
        const m = /^(#{1,4})\s+(.*)$/.exec(raw);
        if (m) { const lvl = m[1].length; font = `700 ${[24, 20, 17, 15.5][lvl - 1]}px system-ui, sans-serif`; color = "#ffffff"; h = [34, 29, 26, 24][lvl - 1]; text = m[2]; }
        else if (/^\s*[-*]\s+/.test(raw)) { text = "•  " + raw.replace(/^\s*[-*]\s+/, ""); x = 6; }
        text = text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
      } else { font = "13px ui-monospace, monospace"; h = 19; }
      g.font = font;
      const wrapped = text === "" ? [""] : wrapText((s) => g.measureText(s).width, text, maxW - x);
      for (const w of wrapped) this.lines.push({ text: w, font, color, h, x });
      if (doc.md && !inCode && /^#{1,4}\s/.test(raw)) this.lines.push({ text: "", font, color, h: 4, x: 0 });
    }
    this.contentH = (img ? this.imgH + 14 : 0) + this.lines.reduce((a, l) => a + l.h, 0) + PAD;
  }

  get viewH(): number { return WIN_H - WIN_TITLE; }
  get maxScroll(): number { return Math.max(0, this.contentH - this.viewH + PAD); }
  scrollBy(dy: number): boolean { const n = Math.min(this.maxScroll, Math.max(0, this.scroll + dy)); const ch = n !== this.scroll; this.scroll = n; return ch; }

  render(): HTMLCanvasElement {
    const g = this.canvas.getContext("2d")!;
    g.setTransform(RES, 0, 0, RES, 0, 0);
    g.clearRect(0, 0, WIN_W, WIN_H);
    roundRect(g, 1, 1, WIN_W - 2, WIN_H - 2, 16);
    const grad = g.createLinearGradient(0, 0, 0, WIN_H);
    grad.addColorStop(0, "rgba(14,30,48,0.96)"); grad.addColorStop(1, "rgba(8,16,28,0.96)");
    g.fillStyle = grad; g.fill();
    g.save();
    roundRect(g, 1, 1, WIN_W - 2, WIN_H - 2, 16); g.clip();
    // cuerpo
    g.save(); g.beginPath(); g.rect(0, WIN_TITLE, WIN_W, WIN_H - WIN_TITLE); g.clip();
    let y = WIN_TITLE + 10 - this.scroll;
    const img = this.doc.image && this.doc.image.naturalWidth > 0 ? this.doc.image : null;
    if (img) { g.drawImage(img, PAD, y, WIN_W - PAD * 2 - 10, this.imgH); y += this.imgH + 14; }
    g.textBaseline = "top";
    for (const l of this.lines) {
      if (y + l.h >= WIN_TITLE && y <= WIN_H) { g.font = l.font; g.fillStyle = l.color; g.fillText(l.text, PAD + l.x, y + 1); }
      y += l.h;
    }
    g.restore();
    // desvanecido arriba/abajo (indica que hay mas) y barra de desplazamiento
    if (this.maxScroll > 0) {
      const top = g.createLinearGradient(0, WIN_TITLE, 0, WIN_TITLE + 26); top.addColorStop(0, "rgba(8,16,28,0.9)"); top.addColorStop(1, "rgba(8,16,28,0)");
      if (this.scroll > 0) { g.fillStyle = top; g.fillRect(0, WIN_TITLE, WIN_W, 26); }
      const bot = g.createLinearGradient(0, WIN_H - 34, 0, WIN_H); bot.addColorStop(0, "rgba(8,16,28,0)"); bot.addColorStop(1, "rgba(8,16,28,0.95)");
      if (this.scroll < this.maxScroll) { g.fillStyle = bot; g.fillRect(0, WIN_H - 34, WIN_W, 34); }
      const track = this.viewH - 16, th = Math.max(36, track * this.viewH / (this.contentH + PAD));
      const ty = WIN_TITLE + 8 + (track - th) * (this.scroll / this.maxScroll);
      g.fillStyle = "rgba(76,201,240,0.15)"; roundRect(g, WIN_W - 11, WIN_TITLE + 8, 5, track, 2.5); g.fill();
      g.fillStyle = "rgba(76,201,240,0.85)"; roundRect(g, WIN_W - 11, ty, 5, th, 2.5); g.fill();
    }
    // barra de titulo: tocar = cerrar, arrastrar = mover
    g.fillStyle = "rgba(76,201,240,0.16)"; g.fillRect(0, 0, WIN_W, WIN_TITLE);
    g.fillStyle = "rgba(76,201,240,0.7)"; g.fillRect(0, WIN_TITLE - 1.5, WIN_W, 1.5);
    g.textBaseline = "middle"; g.fillStyle = "#ffffff"; g.font = "600 16px system-ui, sans-serif";
    let t = this.doc.title;
    while (t.length > 1 && g.measureText(t).width > WIN_W - 190) t = t.slice(0, -1);
    g.fillText(t === this.doc.title ? t : t + "…", PAD, 18);
    g.fillStyle = "#8fb4cf"; g.font = "11px system-ui, sans-serif"; g.fillText(`${ORIGIN[this.doc.origin] ?? this.doc.origin} · arrastrá la barra para mover`, PAD, 36);
    g.textAlign = "right"; g.fillStyle = "#ff8fa8"; g.font = "600 13px system-ui, sans-serif"; g.fillText("tocar = cerrar  ✕", WIN_W - 18, WIN_TITLE / 2); g.textAlign = "left";
    g.restore();
    g.lineWidth = 2; g.strokeStyle = "rgba(76,201,240,0.9)"; roundRect(g, 1, 1, WIN_W - 2, WIN_H - 2, 16); g.stroke();
    return this.canvas;
  }
}
