// Copia el WASM de MediaPipe (de node_modules) a public/mediapipe para servirlo desde el propio servicio (sin CDN).
import { cpSync, mkdirSync } from "node:fs";
const from = "node_modules/@mediapipe/tasks-vision/wasm";
mkdirSync("public/mediapipe", { recursive: true });
for (const f of ["vision_wasm_internal.js", "vision_wasm_internal.wasm"]) cpSync(`${from}/${f}`, `public/mediapipe/${f}`);
