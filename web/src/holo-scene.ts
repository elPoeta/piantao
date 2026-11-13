// Escena three.js del tablero: anillo de estado, tarjetas de vidrio, cursores de las manos y orbitas. Solo dibuja: la logica
// (agarrar, soltar, zoom) vive en holo-logic.ts. Camara ortografica en pixeles de pantalla.
import * as THREE from "three";
import type { Interaction } from "./holo-logic";

const STATE_COLOR: Record<string, number> = { idle: 0x5b7794, listening: 0x5ee6a8, thinking: 0x4cc9f0, speaking: 0xb388ff, acting: 0xf4a261, confirming: 0xf4a261 };

export class HoloScene {
  ok = false;
  private renderer!: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(0, 800, 0, -600, -1000, 1000);
  private board = new THREE.Group();
  private meshes = new Map<string, THREE.Mesh>();
  private ringOuter!: THREE.Mesh; private ringCore!: THREE.Mesh; private ringHalo!: THREE.Mesh;
  private cursors: THREE.Mesh[] = [];
  private link!: THREE.Line;
  private dwell: THREE.Mesh[] = [];
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
      this.scene.add(m); this.disposables.push(m.geometry, m.material as THREE.Material);
      return m;
    };
    this.ringOuter = ring(0.92, 1, 0x4cc9f0, 0.95);
    this.ringHalo = ring(0.55, 0.9, 0x4cc9f0, 0.18);
    this.ringCore = new THREE.Mesh(new THREE.CircleGeometry(0.4, 40), new THREE.MeshBasicMaterial({ color: 0x4cc9f0, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.scene.add(this.ringCore); this.disposables.push(this.ringCore.geometry, this.ringCore.material as THREE.Material);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false }));
      m.visible = false; m.position.z = 50; this.scene.add(m); this.cursors.push(m); this.disposables.push(m.geometry, m.material as THREE.Material);
    }
    for (let k = 1; k <= 24; k++) { const g = new THREE.RingGeometry(1.25, 1.55, 40, 1, Math.PI / 2, (-2 * Math.PI * k) / 24); this.arcs.push(g); this.disposables.push(g); }
    for (let i = 0; i < 2; i++) {
      const m = new THREE.Mesh(this.arcs[0], new THREE.MeshBasicMaterial({ color: 0x5ee6a8, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
      m.visible = false; m.position.z = 60; this.scene.add(m); this.dwell.push(m); this.disposables.push(m.material as THREE.Material);
    }
    const lg = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
    this.link = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0x5ee6a8, transparent: true, opacity: 0.8 }));
    this.link.visible = false; this.link.position.z = 49; this.scene.add(this.link);
    this.disposables.push(lg, this.link.material as THREE.Material);
  }

  resize(cw: number, ch: number): void {
    if (!this.ok) return;
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.setSize(cw, ch, false);
    this.cam.left = 0; this.cam.right = cw; this.cam.top = 0; this.cam.bottom = -ch; this.cam.updateProjectionMatrix();
  }

  setCard(id: string, canvas: HTMLCanvasElement, w: number, h: number): void {
    if (!this.ok) return;
    this.removeCard(id);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
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
      this.scene.add(m);
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
      mesh.position.set(c.x, -c.y, c.z + (c.held !== null ? 20 : 0));
      mesh.scale.setScalar(c.scale * (c.hover || c.held !== null ? 1.03 : 1));
      mesh.rotation.z = -c.rot;
      (mesh.material as THREE.MeshBasicMaterial).opacity = c.held !== null ? 1 : c.hover ? 0.98 : 0.9;
    }
    // anillo
    const col = STATE_COLOR[state] ?? STATE_COLOR.idle;
    const pulse = 1 + 0.05 * Math.sin(now * 3) + Math.min(0.5, level * 3);
    const r = it.ring.r;
    for (const m of [this.ringOuter, this.ringHalo, this.ringCore]) {
      (m.material as THREE.MeshBasicMaterial).color.setHex(col);
      m.position.set(it.ring.x, -it.ring.y, 0);
    }
    this.ringOuter.scale.setScalar(r); this.ringOuter.rotation.z = now * 0.4;
    this.ringHalo.scale.setScalar(r * pulse); this.ringCore.scale.setScalar(r * (0.8 + 0.2 * pulse));
    // orbitas
    this.orbitMeshes.forEach((m, i) => {
      const o = it.orbits[i];
      if (!o) { m.visible = false; return; }
      m.visible = true; m.position.set(o.x, -o.y, 0); m.scale.setScalar(o.r);
    });
    // cursores
    this.cursors.forEach((m, i) => {
      const s = it.slots[i];
      m.visible = s.visible;
      if (!s.visible) return;
      m.position.set(s.cursor.x, -s.cursor.y, 50);
      m.scale.setScalar(s.pinching ? 10 : 16);
      (m.material as THREE.MeshBasicMaterial).color.setHex(s.pinching ? 0x5ee6a8 : i === 2 ? 0xe6edf5 : 0x4cc9f0);
    });
    this.dwell.forEach((m, i) => {
      const s = it.slots[i];
      m.visible = s.visible && s.dwell > 0.03;
      if (!m.visible) return;
      m.geometry = this.arcs[Math.min(23, Math.floor(s.dwell * 24))];
      m.position.set(s.cursor.x, -s.cursor.y, 60); m.scale.setScalar(20);
    });
    const a = it.slots[0], b = it.slots[1];
    this.link.visible = !!it.zoom;
    if (it.zoom) {
      const p = this.link.geometry.attributes.position as THREE.BufferAttribute;
      p.setXYZ(0, a.cursor.x, -a.cursor.y, 49); p.setXYZ(1, b.cursor.x, -b.cursor.y, 49); p.needsUpdate = true;
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
