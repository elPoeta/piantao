import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Se compila dentro del paquete Python (piantao/web/static) para que el servicio lo sirva sin Node en tiempo de ejecucion.
export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: "../piantao/web/static",
    emptyOutDir: true,
    assetsInlineLimit: 0, // nada de data: URIs ni scripts/estilos en linea (CSP estricta)
    cssCodeSplit: false,
    modulePreload: { polyfill: false },
    sourcemap: false,
  },
  server: { proxy: { "/api": "http://localhost:8765", "/ws": { target: "ws://localhost:8765", ws: true } } },
});
