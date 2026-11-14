// Escena three.js del tablero: anillo de estado, tarjetas de vidrio, cursores de las manos y orbitas. Solo dibuja: la logica
// (agarrar, soltar, zoom) vive en holo-logic.ts. Camara ortografica en pixeles de pantalla.
import * as THREE from "three";
import type { Interaction } from "./holo-logic";

const STATE_COLOR: Record<string, number> = { idle: 0x5b7794, listening: 0x5ee6a8, thinking: 0x4cc9f0, speaking: 0xb388ff, acting: 0xf4a261, confirming: 0xf4a261 };

const over = (m: THREE.Mesh | THREE.Line, order: number): void => { m.renderOrder = order; (m.material as THREE.Material).depthTest = false; };

export class HoloScene {
  ok = false;
  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.PerspectiveCamera(40, 800 / 600, 10, 8000);
  private board = new THREE.Group();
  private meshes = new Map<string, THREE.Mesh>();
  private ringOuter!: THREE.Mesh; private ringCore!: THREE.Mesh; private ringHalo!: THREE.Mesh;
  private cursors: THREE.Mesh[] = [];
  private link!: THREE.Line;
  private dwell: THREE.Mesh[] = [];
  private hold: THREE.Mesh[] = [];
  private arcs: THREE.RingGeometry[] = [];
  private orbitMeshes: THREE.Mesh[] = [];
  private disposables: { dispose(): void }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      this.renderer.setClearColor(0x000000, 0);
      this.ok = true;
    } catch { return; }
    this.scene.add(this.board);
    const ring = (inner: number, outer: number, color: number, opacity: number) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(inner, outer, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
      over(m, 80000); this.scene.add(m); this.disposables.push(m.geometry, m.material as THREE.Material);
      return m;
    };
    this.ringOuter = ring(0.92, 1, 0x4cc9f0, 0.95);
    this.ringHalo = ring(0.55, 0.9, 0x4cc9f0, 0.18);
    this.ringCore = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    over(this.ringCore, 80000); this.scene.add(this.ringCore); this.disposables.push(this.ringCore.geometry, this.ringCore.material as THREE.Material);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
      m.visible = false; over(m, 100000); this.scene.add(m); this.cursors.push(m); this.disposables.push(m.geometry, m.material as THREE.Material);
    }
    for (let k = 1; k <= 24; k++) { const g = new THREE.RingGeometry(1.25, 1.55, 40, 1, Math.PI / 2, (-2 * Math.PI * k) / 24); this.arcs.push(g); this.disposables.push(g); }
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(this.arcs[0], new THREE.MeshBasicMaterial({ color: 0x5ee6a8, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false; over(m, 100001); this.scene.add(m); this.dwell.push(m); const hm = new THREE.Mesh(this.arcs[0], new THREE.MeshBasicMaterial({ color: 0xf4a261, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide })); hm.visible = false; over(hm, 100002); this.scene.add(hm); this.hold.push(hm); this.disposables.push(hm.material as THREE.Material); this.disposables.push(m.material as THREE.Material);
    }
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.link = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x5ee6a8, transparent: true, opacity: 0.8 }));
    this.link.visible = false; over(this.link, 99999); this.scene.add(this.link);
    this.disposables.push(lg, this.link.material as THREE.Material);
  }

  resize(cw: number, ch: number): void {
    if (!this.ok) return;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(cw, ch, false);
    // perspectiva calibrada para que el plano z=0 se vea 1:1 en pixeles de pantalla: las tarjetas inclinadas ganan profundidad real
    const fov = 40, d = (ch / 2) / Math.tan((fov * Math.PI) / 360);
    this.cam.fov = fov; this.cam.aspect = cw / ch; this.cam.near = 10; this.cam.far = d * 6;
    this.cam.position.set(cw / 2, -ch / 2, d); this.cam.lookAt(cw / 2, -ch / 2, 0); this.cam.updateProjectionMatrix();
  }

  setCard(id: string, canvas: HTMLCanvasElement, w: number, h: number): void {
    if (!this.ok) return;
    this.removeCard(id);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    this.meshes.set(id, mesh); this.board.add(mesh);
  }

  removeCard(id: string): void {
    const m = this.meshes.get(id);
    if (!m) return;
    this.board.remove(m);
    (m.material as THREE.MeshBasicMaterial).map?.dispose();
    (m.material as THREE.Material).dispose(); m.geometry.dispose();
    this.meshes.delete(id);
  }

  /** El canvas de una tarjeta cambio (p. ej. se desplazo el documento): vuelve a subir la textura. */
  touchCard(id: string): void { const m = this.meshes.get(id); const mat = m?.material as THREE.MeshBasicMaterial | undefined; if (mat?.map) mat.map.needsUpdate = true; }

  clearCards(): void { for (const id of [...this.meshes.keys()]) this.removeCard(id); }

  setOrbits(items: { label: string }[]): void {
    if (!this.ok) return;
    for (const m of this.orbitMeshes) { this.scene.remove(m); (m.material as THREE.MeshBasicMaterial).map?.dispose(); (m.material as THREE.Material).dispose(); m.geometry.dispose(); }
    this.orbitMeshes = items.map((it) => {
      const c = document.createElement("canvas"); c.width = c.height = 128;
      const g = c.getContext("2d")!;
      g.beginPath(); g.arc(64, 64, 60, 0, Math.PI * 2); g.fillStyle = "rgba(76,201,240,0.16)"; g.fill();
      g.lineWidth = 3; g.strokeStyle = "rgba(76,201,240,0.9)"; g.stroke();
      g.fillStyle = "#e6edf5"; g.font = "600 22px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle";
      const words = it.label.split(" ");
      words.forEach((w, i) => g.fillText(w, 64, 64 + (i - (words.length - 1) / 2) * 24));
      const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
      over(m, 90000); this.scene.add(m);
      return m;
    });
  }

  render(it: Interaction, state: string, level: number, now: number): void {
    if (!this.ok) return;
    // tablero
    this.board.position.set(it.board.tx, -it.board.ty, 0);
    this.board.scale.setScalar(it.board.scale);
    for (const [id, mesh] of this.meshes) {
      const c = it.cards.get(id);
      if (!c) { mesh.visible = false; continue; }
      mesh.visible = true;
      mesh.position.set(c.x, -c.y, 0);
      mesh.renderOrder = c.z + (c.held !== null ? 1000 : 0);
      mesh.scale.setScalar(c.scale * (c.hover || c.held !== null ? 1.03 : 1));
      mesh.rotation.set(-c.rx, c.ry, -c.rot, "ZXY");
      (mesh.material as THREE.MeshBasicMaterial).opacity = c.held !== null ? 1 : c.hover ? 0.98 : 0.9;
    }
    // nucleo: reacciona al estado y al nivel de voz; abierto = gira mas rapido y brilla
    const col = STATE_COLOR[state] ?? STATE_COLOR.idle;
    const pulse = 1 + 0.05 * Math.sin(now * 3) + Math.min(0.5, level * 3);
    const r = it.ring.r, open = it.ring.bloom;
    for (const m of [this.ringOuter, this.ringHalo, this.ringCore]) {
      (m.material as THREE.MeshBasicMaterial).color.setHex(col);
      m.position.set(it.ring.x, -it.ring.y, 0);
    }
    this.ringOuter.scale.setScalar(r); this.ringOuter.rotation.z = now * (0.4 + 1.6 * open);
    this.ringHalo.scale.setScalar(r * pulse * (1 + 0.15 * open)); this.ringCore.scale.setScalar(r * (0.8 + 0.2 * pulse));
    (this.ringCore.material as THREE.MeshBasicMaterial).opacity = 0.35 + 0.3 * open;
    this.orbitMeshes.forEach((m, i) => {
      const o = it.orbits[i];
      if (!o || o.r < 2) { m.visible = false; return; }
      m.visible = true; m.position.set(o.x, -o.y, 0); m.scale.setScalar(o.r);
    });
    // cursores
    this.cursors.forEach((m, i) => {
      const s = it.slots[i];
      m.visible = s.visible;
      if (!s.visible) return;
      m.position.set(s.cursor.x, -s.cursor.y, 0);
      m.scale.setScalar(s.pinching ? 10 : 16);
      (m.material as THREE.MeshBasicMaterial).color.setHex(s.mode === "rotate" ? 0xf4a261 : s.pinching ? 0x5ee6a8 : i === 2 ? 0xe6edf5 : 0x4cc9f0);
    });
    this.dwell.forEach((m, i) => {
      const s = it.slots[i];
      m.visible = s.visible && s.dwell > 0.03;
      if (!m.visible) return;
      m.geometry = this.arcs[Math.min(23, Math.floor(s.dwell * 24))];
      m.position.set(s.cursor.x, -s.cursor.y, 0); m.scale.setScalar(20);
    });
    this.hold.forEach((m, i) => {
      const s = it.slots[i];
      m.visible = s.visible && s.pinching && s.hold > 0.05;
      if (!m.visible) return;
      m.geometry = this.arcs[Math.min(23, Math.floor(s.hold * 24))];
      m.position.set(s.cursor.x, -s.cursor.y, 0); m.scale.setScalar(26);
    });
    const a = it.slots[0], b = it.slots[1];
    this.link.visible = !!it.zoom;
    if (it.zoom) {
      const p = this.link.geometry.attributes.position as THREE.BufferAttribute;
      p.setXYZ(0, a.cursor.x, -a.cursor.y, 0); p.setXYZ(1, b.cursor.x, -b.cursor.y, 0); p.needsUpdate = true;
    }
    this.renderer.render(this.scene, this.cam);
  }

  dispose(): void {
    if (!this.ok) return;
    this.clearCards(); this.setOrbits([]);
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}
