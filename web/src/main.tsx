import { render } from "preact";
import { App } from "./App";
import { Hud } from "./Hud";
import "./styles.css";

// /hud es la misma aplicacion con otra vista (orbe + permisos), sin enrutador ni dependencias extra.
const isHud = location.pathname.replace(/\/+$/, "") === "/hud";
render(isHud ? <Hud /> : <App />, document.getElementById("app")!);

if ("serviceWorker" in navigator && !isHud) {
  // PWA: el service worker solo cachea la carcasa estatica; nunca datos de la API ni del WebSocket.
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* sin SW la app funciona igual */ });
}
