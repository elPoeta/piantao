// Cliente del servicio: emparejamiento por HTTP y un unico WebSocket multiplexado (mismo protocolo que el socket del panel).
export type Snapshot = Record<string, any>;
export interface PiantaoEvent { kind: string; data: Record<string, any>; ts: number }
type Pending = { resolve: (v: any) => void; reject: (e: Error) => void; timer: number };

const HDR = { "Content-Type": "application/json", "X-Piantao": "1" };

export async function sessionPaired(): Promise<boolean> {
  try {
    const r = await fetch("/api/session", { credentials: "same-origin" });
    return r.ok && (await r.json()).paired === true;
  } catch { return false; }
}

export async function pair(code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const r = await fetch("/api/pair", { method: "POST", headers: HDR, body: JSON.stringify({ code }), credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    return r.ok && j.ok ? { ok: true } : { ok: false, error: j.error ?? `error ${r.status}` };
  } catch { return { ok: false, error: "no se pudo conectar con Piantao" }; }
}

export async function logout(): Promise<void> {
  try { await fetch("/api/logout", { method: "POST", headers: HDR, credentials: "same-origin" }); } catch { /* sin conexion */ }
}

export class Link {
  private ws: WebSocket | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private retry = 0;
  private closed = false;
  onSnapshot: (s: Snapshot) => void = () => {};
  onEvent: (e: PiantaoEvent) => void = () => {};
  onChat: (m: Record<string, any>) => void = () => {};
  onConfirm: (m: Record<string, any>) => void = () => {};
  onStatus: (s: "connecting" | "open" | "closed" | "unauthorized") => void = () => {};

  connect(): void {
    this.closed = false;
    this.onStatus("connecting");
    const ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
    this.ws = ws;
    ws.onopen = () => { this.retry = 0; this.onStatus("open"); };
    ws.onmessage = (m) => {
      if (typeof m.data !== "string") return;
      let msg: any;
      try { msg = JSON.parse(m.data); } catch { return; }
      if (msg.t === "snapshot") this.onSnapshot(msg.data);
      else if (msg.t === "event") this.onEvent({ kind: msg.kind, data: msg.data, ts: msg.ts });
      else if (msg.t === "chat") this.onChat(msg);
      else if (msg.t === "confirm" || msg.t === "confirm_done") this.onConfirm(msg);
      else if (msg.t === "reply") this.settle(msg);
    };
    ws.onclose = async () => {
      this.failAll("conexion cerrada");
      if (this.closed) return;
      if (!(await sessionPaired())) { this.onStatus("unauthorized"); return; }
      this.onStatus("closed");
      const wait = Math.min(10000, 500 * 2 ** this.retry++);
      window.setTimeout(() => { if (!this.closed) this.connect(); }, wait);
    };
  }

  close(): void { this.closed = true; this.ws?.close(); }

  command<T = any>(name: string, args: Record<string, unknown> = {}, timeoutMs = 12000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return reject(new Error("sin conexion"));
      const id = this.nextId++;
      const timer = window.setTimeout(() => { this.pending.delete(id); reject(new Error("tiempo agotado")); }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.ws.send(JSON.stringify({ t: "cmd", id, name, args }));
    });
  }

  private settle(msg: any): void {
    const p = this.pending.get(msg.id);
    if (!p) return;
    this.pending.delete(msg.id);
    clearTimeout(p.timer);
    msg.ok ? p.resolve(msg.data) : p.reject(new Error(msg.error ?? "error"));
  }

  private failAll(why: string): void {
    for (const [, p] of this.pending) { clearTimeout(p.timer); p.reject(new Error(why)); }
    this.pending.clear();
  }
}
