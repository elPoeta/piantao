// Vision en el navegador: MediaPipe (WASM, CPU, servido por este mismo servicio) detecta la mano y SOLO los 21 puntos
// viajan al servidor. Ninguna imagen sale de esta pagina. Los gestos y los permisos los decide el servidor.
import type { HandLandmarker as HandLandmarkerT, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { Link } from "./api";

const BIN_LANDMARKS = 3;
const HAND_FPS = 15;       // con mano a la vista
const IDLE_FPS = 5;        // sin mano: solo para que el servidor sepa que no hay nadie

export type VisionState = "off" | "loading" | "on";
export interface VisionStatus { pose: string; hand: boolean; armed: boolean; calibrating: string | null }
export interface VisionHandlers {
  onState: (s: VisionState, detail?: string) => void;
  onStatus: (s: VisionStatus) => void;
  onGesture: (name: string) => void;
  onError: (msg: string) => void;
}

export function packLandmarks(hands: { lm: { x: number; y: number; z: number }[]; side: string; score: number }[], mirror: boolean): ArrayBuffer {
  const n = Math.min(hands.length, 2);
  const buf = new ArrayBuffer(6 + n * 254);
  const dv = new DataView(buf);
  dv.setUint8(0, BIN_LANDMARKS);
  dv.setUint32(1, Math.floor(performance.now()) >>> 0, true);
  dv.setUint8(5, n);
  let off = 6;
  for (let h = 0; h < n; h++) {
    const hand = hands[h];
    dv.setUint8(off++, hand.side === "Left" ? 0 : hand.side === "Right" ? 1 : 2);
    dv.setUint8(off++, Math.max(0, Math.min(255, Math.round(hand.score * 255))));
    for (let i = 0; i < 21; i++) {
      const p = hand.lm[i];
      dv.setFloat32(off, mirror ? 1 - p.x : p.x, true); off += 4;
      dv.setFloat32(off, p.y, true); off += 4;
      dv.setFloat32(off, p.z, true); off += 4;
    }
  }
  return buf;
}

export class VisionClient {
  private stream: MediaStream | null = null;
  private landmarker: HandLandmarkerT | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private raf = 0;
  private lastSent = 0;
  private lastTs = -1;
  private connections: { start: number; end: number }[] = [];
  /** La escena holografica se suscribe aqui para recibir las manos (hasta 2) y decide si es dueña de ellas (pellizco en curso). */
  hands: ((hands: { x: number; y: number }[][], aspect: number) => void) | null = null;
  owner: (() => boolean) | null = null;
  state: VisionState = "off";
  constructor(private link: Link, private h: VisionHandlers) {}

  attach(video: HTMLVideoElement | null, canvas: HTMLCanvasElement | null): void {
    this.video = video; this.canvas = canvas;
    if (video && this.stream && video.srcObject !== this.stream) { video.srcObject = this.stream; void video.play().catch(() => {}); }
  }

  async start(): Promise<void> {
    if (this.state !== "off") return;
    const video = this.video;
    if (!video) throw new Error("la vista de la cámara no está lista");
    this.setState("loading", "Abriendo la cámara...");
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 }, facingMode: "user" }, audio: false,
      });
      video.srcObject = this.stream;
      await video.play();
      this.setState("loading", "Cargando el modelo de manos...");
      await this.loadLandmarker();
      const aspect = video.videoWidth / Math.max(1, video.videoHeight);
      await this.link.command("vision_start", { aspect: Math.round(aspect * 1000) / 1000 });
    } catch (e) {
      this.release();
      this.setState("off");
      const name = (e as DOMException).name;
      throw new Error(name === "NotAllowedError" ? "Permiso de cámara denegado: habilitalo en el candado de la barra de direcciones."
        : name === "NotFoundError" ? "No se encontró ninguna cámara." : (e as Error).message);
    }
    this.setState("on");
    this.lastTs = -1;
    this.raf = requestAnimationFrame(this.tick);
  }

  private async loadLandmarker(): Promise<void> {
    if (this.landmarker) return;
    const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
    try {
      const fileset = await FilesetResolver.forVisionTasks("/mediapipe");
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: "/vision/hand_landmarker.task", delegate: "CPU" }, // CPU: la GPU se la queda el modelo de lenguaje
        runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
      });
    } catch (e) {
      throw new Error(`No se pudo cargar el modelo de manos (¿corriste «python scripts/fetch_models.py»?): ${(e as Error).message}`);
    }
    this.connections = HandLandmarker.HAND_CONNECTIONS;
  }

  private tick = (): void => {
    if (this.state !== "on") return;
    this.raf = requestAnimationFrame(this.tick);
    const v = this.video, lm = this.landmarker;
    if (!v || !lm || v.readyState < 2 || v.videoWidth === 0) return;
    const now = performance.now();
    if (now - this.lastSent < 1000 / HAND_FPS) return;
    if (v.currentTime === this.lastTs) return; // cuadro repetido
    this.lastTs = v.currentTime;
    let res;
    try { res = lm.detectForVideo(v, now); } catch { return; }
    const hands = res.landmarks.map((pts: NormalizedLandmark[], i: number) => ({
      lm: pts, side: res.handedness[i]?.[0]?.categoryName ?? "?", score: res.handedness[i]?.[0]?.score ?? 0.5,
    }));
    this.draw(hands.length ? hands[0].lm : null);
    this.hands?.(hands.map((h) => h.lm), v.videoWidth / Math.max(1, v.videoHeight));
    // al servidor viaja UNA mano, y ninguna mientras la escena manipula tarjetas con un pellizco (no es un gesto)
    const send = this.owner?.() ? [] : hands.slice(0, 1);
    if (send.length === 0 && now - this.lastSent < 1000 / IDLE_FPS) return;
    this.lastSent = now;
    this.link.sendBinary(packLandmarks(send, true));
  };

  private draw(pts: NormalizedLandmark[] | null): void {
    const c = this.canvas, v = this.video;
    if (!c || !v) return;
    if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
    const g = c.getContext("2d");
    if (!g) return;
    g.clearRect(0, 0, c.width, c.height);
    if (!pts) return;
    g.lineWidth = 2; g.strokeStyle = "#4cc9f0"; g.fillStyle = "#e6edf5";
    for (const { start, end } of this.connections) {
      g.beginPath(); g.moveTo(pts[start].x * c.width, pts[start].y * c.height); g.lineTo(pts[end].x * c.width, pts[end].y * c.height); g.stroke();
    }
    for (const p of pts) { g.beginPath(); g.arc(p.x * c.width, p.y * c.height, 3, 0, Math.PI * 2); g.fill(); }
  }

  private release(): void {
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.video) this.video.srcObject = null;
    const g = this.canvas?.getContext("2d");
    if (g && this.canvas) g.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private setState(s: VisionState, detail?: string): void { this.state = s; this.h.onState(s, detail); }

  async stop(): Promise<void> {
    const was = this.state;
    this.state = "off";
    this.release();
    if (was === "on") { try { await this.link.command("vision_stop"); } catch { /* sin conexion */ } }
    this.h.onState("off");
  }

  async calibrate(pose: "open" | "closed"): Promise<{ samples: number; median: number }> {
    return this.link.command("vision_calibrate", { pose }, 8000);
  }
  applyCalibration(): Promise<{ finger_extended: number; finger_curled: number }> { return this.link.command("vision_calibrate_apply"); }

  handle(m: Record<string, any>): void {
    if (m.ev === "status") this.h.onStatus({ pose: String(m.pose), hand: !!m.hand, armed: !!m.armed, calibrating: m.calibrating ?? null });
    else if (m.ev === "gesture") this.h.onGesture(String(m.name));
    else if (m.ev === "off" && this.state !== "off") void this.stop();
  }
}
