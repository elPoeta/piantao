// Voz en el navegador: captura el microfono (con cancelacion de eco del navegador), lo envia al servidor como PCM 16 kHz
// y reproduce el audio que llega. El reconocimiento y la sintesis ocurren en el servidor.
import workletUrl from "./mic-worklet.js?url";
import { Link } from "./api";

export type VoiceMode = "ptt" | "wake" | "always";
export type VoiceState = "off" | "loading" | "ready" | "listening" | "transcribing" | "speaking";
const BIN_MIC = 1, BIN_TTS = 2;

export class Player {
  private ctx: AudioContext;
  private next = 0;
  private sources = new Set<AudioBufferSourceNode>();
  onIdle: () => void = () => {};
  constructor(ctx: AudioContext) { this.ctx = ctx; }

  /** Trama binaria del servidor: [2][u32 frecuencia][u32 id][PCM int16]. Devuelve false si no es valida. */
  push(data: ArrayBuffer): boolean {
    if (data.byteLength < 11) return false;
    const v = new DataView(data);
    if (v.getUint8(0) !== BIN_TTS) return false;
    const rate = v.getUint32(1, true);
    if (rate < 8000 || rate > 96000) return false;
    const n = (data.byteLength - 9) >> 1;
    const buf = this.ctx.createBuffer(1, n, rate);
    const ch = buf.getChannelData(0);
    const pcm = new Int16Array(data.slice(9, 9 + n * 2)); // copia alineada: el encabezado mide 9 bytes (desplazamiento impar)
    for (let i = 0; i < n; i++) ch[i] = pcm[i] / 32768;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    const t = Math.max(this.ctx.currentTime + 0.03, this.next);
    src.start(t);
    this.next = t + buf.duration;
    this.sources.add(src);
    src.onended = () => { this.sources.delete(src); if (this.sources.size === 0) this.onIdle(); };
    return true;
  }

  flush(): void {
    for (const s of this.sources) { s.onended = null; try { s.stop(); } catch { /* ya termino */ } }
    this.sources.clear();
    this.next = 0;
    this.onIdle();
  }
  get playing(): boolean { return this.sources.size > 0; }
}

export interface VoiceHandlers {
  onState: (s: VoiceState, detail?: string) => void;
  onLevel: (rms: number) => void;
  onTranscript: (text: string) => void;
  onError: (msg: string) => void;
}

export class VoiceClient {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioWorkletNode | null = null;
  private player: Player | null = null;
  private sending = false;
  mode: VoiceMode | null = null;
  constructor(private link: Link, private h: VoiceHandlers) {}

  get active(): boolean { return this.mode !== null; }

  async start(mode: VoiceMode): Promise<void> {
    if (this.active) await this.stop();
    this.h.onState("loading");
    // El gesto del usuario es el clic que llega aqui: se crea el contexto de audio ya, antes de cualquier espera.
    const ctx = new AudioContext({ latencyHint: "interactive" });
    await ctx.resume();
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      await ctx.audioWorklet.addModule(workletUrl);
      await this.link.command("voice_start", { mode }, 130000);
    } catch (e) {
      this.release(ctx);
      this.h.onState("off");
      const name = (e as DOMException).name;
      const why = name === "NotAllowedError" ? "Permiso de micrófono denegado: habilitalo en el candado de la barra de direcciones."
        : name === "NotFoundError" ? "No se encontró ningún micrófono." : (e as Error).message;
      throw new Error(why);
    }
    this.ctx = ctx;
    this.mode = mode;
    this.player = new Player(ctx);
    this.player.onIdle = () => this.h.onState("ready");
    const src = ctx.createMediaStreamSource(this.stream!);
    this.node = new AudioWorkletNode(ctx, "mic-processor", { numberOfInputs: 1, numberOfOutputs: 0, channelCount: 1 });
    this.node.port.onmessage = (ev: MessageEvent<{ pcm: ArrayBuffer; level: number }>) => {
      this.h.onLevel(this.sending ? ev.data.level : 0);
      if (!this.sending) return;
      const frame = new Uint8Array(1 + ev.data.pcm.byteLength);
      frame[0] = BIN_MIC;
      frame.set(new Uint8Array(ev.data.pcm), 1);
      this.link.sendBinary(frame);
    };
    src.connect(this.node);
    this.sending = mode !== "ptt"; // en pulsar-para-hablar solo sale audio mientras mantenes la tecla
    this.h.onState("ready");
  }

  private release(ctx: AudioContext | null): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    void ctx?.close();
  }

  async stop(): Promise<void> {
    const ctx = this.ctx;
    this.mode = null;
    this.sending = false;
    this.node?.disconnect();
    this.node = null;
    this.player?.flush();
    this.player = null;
    this.ctx = null;
    this.release(ctx);
    try { await this.link.command("voice_stop"); } catch { /* sin conexion */ }
    this.h.onState("off");
    this.h.onLevel(0);
  }

  async ptt(down: boolean): Promise<void> {
    if (this.mode !== "ptt") return;
    if (down) { this.player?.flush(); this.sending = true; } // el servidor tambien corta lo que estuviera diciendo
    try {
      await this.link.command("voice_ptt", { down });
    } catch (e) { this.sending = false; this.h.onError((e as Error).message); return; }
    if (!down) window.setTimeout(() => { this.sending = false; }, 120); // deja salir la cola del ultimo bloque
  }

  async interrupt(): Promise<void> {
    this.player?.flush();
    try { await this.link.command("voice_interrupt"); } catch { /* nada que cortar */ }
  }

  /** Mensajes `voice` del servidor. */
  handle(m: Record<string, any>): void {
    switch (m.ev) {
      case "loading": this.h.onState("loading", "cargando Whisper y Kokoro (la primera vez tarda)"); break;
      case "ready": this.h.onState("ready"); break;
      case "listening": this.h.onState("listening"); break;
      case "transcribing": this.h.onState("transcribing"); break;
      case "transcript": this.h.onTranscript(String(m.text ?? "")); this.h.onState("speaking"); break;
      case "flush": this.player?.flush(); break;
      case "barge_in": this.player?.flush(); this.h.onState("listening"); break;
      case "followup": this.h.onState("listening", "Te escucho..."); break;
      case "followup_timeout": case "too_short": case "ignored": this.h.onState("ready"); break;
      case "off": if (this.active) void this.stop(); break;
      case "error": this.h.onError(String(m.error ?? "error de voz")); this.h.onState("ready"); break;
    }
  }

  handleBinary(d: ArrayBuffer): void {
    if (this.player?.push(d)) this.h.onState("speaking");
  }
}
