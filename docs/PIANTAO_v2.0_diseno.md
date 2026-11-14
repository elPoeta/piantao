# Piantao v2.0 — Diseño: de la terminal a un servicio web

Estado: **decisiones tomadas (ver §12) — en implementación desde W0** · Base: v1.1 completa (fases 0–9) · Referencia de interfaz: [jaredrhod/barehands](https://github.com/jaredrhod/barehands)

---

## 1. Qué es v2.0

Llevar todo lo que hoy se hace por terminal, panel Qt y HUD a **un servicio web local** con tres modos de uso sobre la misma sesión:

1. **Chat** — conversación escrita con streaming, herramientas visibles, historial, memoria y permisos.
2. **Voz** — hablar y escuchar desde el navegador (también desde otra computadora de tu red).
3. **Holo** — la interfaz holográfica: tu cámara de fondo, un anillo que es la presencia de Piantao y tarjetas de cristal que manipulás con las manos (MediaPipe en el navegador).

Principios que **no cambian** (vienen de v1.1): local primero, nada sale a la nube sin tu autorización explícita, permisos con falla cerrada, auditoría encadenada, el video no sale de tu equipo, el modelo nunca decide por sí solo lo que requiere confirmación.

### Qué gana el web respecto de hoy

| Hoy | En v2.0 |
|---|---|
| Hay que enfocar la terminal para confirmar o teclear | Las confirmaciones son una capa de la propia UI (botón, voz o gesto) |
| Mute del micrófono mientras habla Piantao (evita el eco, impide interrumpir hablando) | El navegador cancela el eco (`echoCancellation`) → se puede **interrumpir hablando** |
| La laptop sin GPU corre su propio STT lento | La laptop es un cliente liviano: micrófono y cámara en su navegador, el P16 hace el trabajo pesado |
| Panel Qt, HUD, `talk.py`, terminal: cuatro frentes | Un frente (más la terminal como cliente fino de compatibilidad) |
| Atajo global roto en KDE | El push-to-talk es una tecla o botón **de la página** (foco en la pestaña) |

---

## 2. Qué dice barehands y qué usamos de él

Resumen de lo que describe su README (no revisé su código fuente):

- Servidor Python de biblioteca estándar en `127.0.0.1:8794`, cliente con **MediaPipe** y **three.js** cargados de CDN, pensado para Chrome.
- Tarjetas de cristal sobre la cámara: tocar (pellizco rápido), arrastrar (pellizco sostenido), rotar modelos 3D, escalar con dos manos, lanzar (flick), aplaudir para limpiar, "garra" para traer un elemento.
- Un anillo cuyo estado (pensando, idle, escuchando, hablando) se lee de un archivo `state/state`; órbitas que abren carpetas de notas Markdown; modelos 3D como wireframes holográficos azules.
- Un **protocolo de acciones JSON** (`present`, `add_card`, `add_img`, `hand`, `explode`, `yank`, `hover`) con lista blanca y restricción a la carpeta `media/`, para que una IA pueda mover el tablero sin riesgo; y una lectura del estado del tablero para que el asistente sepa qué hay.
- Umbrales de gestos como **razones** de la forma de la mano (no tamaños absolutos), igual que nuestro `GestureEngine`.

### ⚠ Licencia (decisión tuya)

barehands es **AGPL-3.0-or-later**. Si copiamos o adaptamos su código, la parte derivada (y, por la cláusula de red, el servicio que la sirva) queda bajo AGPL y habría que ofrecer el código a quien use el servicio. Para uso estrictamente personal no cambia nada en la práctica, pero te ata si algún día publicás o compartís Piantao. Opciones:

| Opción | Consecuencia |
|---|---|
| **A. Reimplementación propia (recomendada)** | Tomamos las *ideas* (tarjetas de cristal, anillo de estado, protocolo de acciones con lista blanca) y escribimos nuestro código desde cero con nuestros umbrales. Sin obligaciones AGPL. |
| B. Adaptar su código | Todo lo derivado pasa a AGPL. Más rápido, pero condiciona el proyecto. |
| C. Licencia comercial | El autor ofrece una; habría que escribirle. |

El resto de dependencias son permisivas: MediaPipe (Apache 2.0), three.js (MIT). **Las vamos a incluir en el repositorio (vendoreadas), no cargarlas de CDN**: es coherente con el principio offline y evita que un tercero inyecte código en tu interfaz.

---

## 3. Arquitectura

```
┌──────────────────────── Navegador (P16 o laptop) ────────────────────────┐
│  UI (Preact+TS)   Chat │ Voz │ Holo (three.js)   Paneles (MCP, permisos…) │
│  AudioWorklet (mic, eco cancelado) · WebAudio (reproducción)              │
│  MediaPipe Tasks Vision (WASM) — la cámara NUNCA sale del navegador       │
└───────────────▲──────────────────────────────────┬────────────────────────┘
        HTTPS/WSS (sesión autenticada)             │ PCM mic · landmarks · comandos
┌───────────────┴──────────────────────────────────▼────────────────────────┐
│ Puerta de enlace web (asyncio, dentro del proceso de Piantao)             │
│  auth/pairing · CSP · origen/host · WS único multiplexado · REST consultas│
├───────────────────────────────────────────────────────────────────────────┤
│ Núcleo existente: AgentCore · ModelRouter · ToolRegistry · MCP · memoria  │
│ PermissionManager · auditoría · EventBus · métricas · GestureEngine       │
│ + Transporte de audio (local | web) · Chat session · Board (tablero holo) │
└───────────────────────────────────────────────────────────────────────────┘
```

**Decisión 1 — el gateway vive dentro del proceso del agente** (como hoy `UiServer`), no como proceso aparte: accede directo al agente, al bus y a los permisos sin otra capa de red. El socket Unix v1 (`ui.sock`) se mantiene para el panel Qt, el HUD y `talk.py` mientras convivan.

**Decisión 2 — un solo WebSocket multiplexado** (mensajes JSON; audio y landmarks en binario) + REST solo para consultas pesadas (historial, auditoría) y para servir la app estática. Es el protocolo v1 (hello / snapshot / event / cmd / reply) ampliado, con versión explícita.

**Tecnología recomendada**
- Backend: Python asyncio. Servidor HTTP/WS: **aiohttp** (una dependencia, WS y estáticos incluidos) o Starlette+uvicorn; ambos válidos. Mantener el código asíncrono ya probado y el límite de 1 MiB por mensaje, colas acotadas y abortar clientes lentos.
- Frontend: **TypeScript + Preact + Vite**, compilado a estáticos que sirve Python (en producción no hace falta Node). three.js y `@mediapipe/tasks-vision` incluidos con versión fijada.
- Pruebas: pytest (servidor), **Playwright/Chromium** (ya está en el sandbox) con cámara/micrófono falsos (`--use-fake-device-for-media-stream`) y capturas de pantalla.

---

## 4. Seguridad (lo que más cambia al pasar a web)

Una terminal solo la toca tu usuario; una página la puede tocar cualquier sitio que abras. Por eso:

| Riesgo | Control |
|---|---|
| Otro sitio o proceso habla con el servicio | Escucha solo en `127.0.0.1` por defecto; **emparejamiento**: código de un solo uso que muestra el HUD/terminal, se canjea por una cookie `HttpOnly; SameSite=Strict`; sin sesión no hay WebSocket |
| Cross-site WebSocket hijacking | Verificar `Origin` y `Host` contra una lista permitida (también frena *DNS rebinding*) |
| Cámara y micrófono exigen contexto seguro | `localhost` sirve en la propia máquina; **desde la laptop hace falta HTTPS** (certificado local con mkcert o el de Tailscale). Se documenta y se verifica al arrancar |
| XSS por contenido del modelo o de una web leída | CSP estricta (`default-src 'self'`, sin scripts inline, sin CDN); Markdown **sanitizado**, sin HTML crudo; imágenes solo desde `media/` (como barehands) |
| Que el contenido del modelo imite un diálogo de permiso | Las confirmaciones se dibujan en una **capa de confianza** fuera del contenido del chat y del tablero, con la acción real (la que calcula el servidor, no el modelo) |
| Un cliente aflojando permisos | Se mantiene la regla actual: desde la UI **solo se endurece**; aprobar MCP sigue siendo por terminal |
| Confirmar con gesto/voz desde la web | Mismas reglas que hoy (nivel 3, nunca tras contenido no confiable, nunca nube). Los gestos de confirmación se evalúan **en el servidor** (§6) |
| Varios clientes a la vez | Un **controlador** activo; los demás solo miran. Cambiar de controlador requiere confirmar en el que manda |
| Acceso remoto | Opcional y apagado por defecto: solo por red privada (Tailscale/WireGuard), nunca puerto abierto a Internet |

Auditoría: se agrega a cada evento el cliente (`via`: panel, web, voz, gesto) y las conexiones/desconexiones.

---

## 5. Voz sobre web

**Hoy:** `AudioManager` (sounddevice) → VAD → STT → agente → TTS → altavoz, con el micrófono silenciado mientras Piantao habla.

**v2.0:** se separa el *transporte de audio* del *bucle de voz*:

```
VoiceLoop ──usa──▶ AudioTransport (interfaz)
                     ├─ LocalAudio  (lo de hoy: sounddevice en el P16)
                     └─ WebAudio    (WebSocket binario con el navegador)
```

- **Entrada:** `getUserMedia` con `echoCancellation`, `noiseSuppression`, `autoGainControl`; un `AudioWorklet` entrega PCM 16 kHz mono en bloques de 20–40 ms por el WebSocket. El VAD/endpointing y faster-whisper siguen en el servidor (el STT ya corre a ~0,23 s).
- **Salida:** el servidor envía el TTS (Kokoro, 24 kHz) en bloques; el navegador los reproduce con WebAudio y avisa cuánto lleva reproducido (para cortar exacto al interrumpir).
- **Interrumpir hablando (barge-in):** como el eco está cancelado, el VAD puede seguir activo mientras Piantao habla; si detecta voz sostenida, se corta la respuesta. Va con umbral propio y opción para apagarlo.
- **Wake word y PTT:** la palabra «piantao» sigue evaluándose en el servidor sobre el flujo (mismo detector). El push-to-talk pasa a ser una tecla/botón de la página (mantener `Espacio`) — reemplaza al atajo global que no funcionó.
- **Confirmación por voz:** igual que hoy, pero el prompt hablado y la tarjeta aparecen a la vez en la UI.
- **Modo local se conserva:** `LocalAudio` sigue existiendo para el modo servicio sin navegador.

Latencia a medir (presupuesto): ida del audio ≤ 50 ms en la misma máquina, ≤ 100 ms por LAN; el resto del pipeline ya está medido en v1.1.

---

## 6. Visión y gestos sobre web

**Principio:** la cámara y el video **no salen del navegador**. Solo viajan landmarks (21 puntos × 2 manos × ~15–30 fps ≈ pocos KB/s).

**Dos niveles, para no duplicar lo que no conviene duplicar:**

| Nivel | Dónde corre | Para qué |
|---|---|---|
| *Manipulación continua* (pellizcar, arrastrar, escalar con dos manos, lanzar, cursor) | **Navegador (JS)**, latencia mínima | Mover tarjetas del tablero holográfico |
| *Gestos semánticos* (pulgar arriba/abajo, palma, deslizar, apuntar) | **Servidor**: el `GestureEngine` Python actual, alimentado con los landmarks del navegador | Confirmaciones de permisos, interrumpir, comandos |

Así una sola implementación (la ya probada y calibrada) decide lo que afecta a la seguridad, y el navegador solo hace lo que necesita respuesta de 16 ms. El servidor valida el *armado* y los tiempos de sostén igual que hoy. La calibración (`calibration` JSON) se hace desde una pantalla de la UI.

**MediaPipe en el navegador:** `@mediapipe/tasks-vision` (`HandLandmarker`, WASM) con el modelo `hand_landmarker.task` incluido localmente. Por defecto **delegado CPU/WASM**: el LLM + STT ya ocupan ~5,7 de los 8 GiB de VRAM del P16 y un delegado GPU más WebGL de three.js compite por esa memoria. En la laptop cliente se puede activar el GPU. Medir antes de decidir.

---

## 7. Interfaz holográfica

Inspirada en barehands, implementada de cero (ver licencia).

**Escena (three.js, capa transparente sobre `<video>` espejado):**
- **Anillo de presencia:** estados idle / escuchando / transcribiendo / pensando / herramienta / hablando / confirmando (los mismos del `EventBus` y del HUD actual). En voz, el anillo reacciona al nivel de audio.
- **Tarjetas de cristal:** cada mensaje largo, resultado de herramienta, captura de pantalla, nota de memoria, fila de auditoría o imagen se puede "sacar" al espacio como tarjeta.
- **Órbitas:** tocar el anillo despliega órbitas (Chat, Memoria, Herramientas, Permisos, Auditoría, Rutinas); tocar una abre sus tarjetas.
- **Modelos 3D:** como wireframes holográficos (`media/holo/`), con vista despiezada.
- **Cursores de dedos** y feedback háptico visual (brillo al agarrar).

**Gestos de manipulación (propios, con nuestras razones/umbrales):** tocar, arrastrar, rotar, escalar con dos manos, lanzar, aplaudir para limpiar el tablero. La «garra» de barehands queda fuera del primer corte.

**El modelo también puede mover el tablero** mediante herramientas del `ToolRegistry`, con el mismo enfoque de lista blanca:

| Herramienta | Acción | Permiso |
|---|---|---|
| `board_present` | Mostrar una tarjeta (texto sanitizado / imagen de `media/`) | nivel 1 (solo visual, contenido no confiable) |
| `board_clear` | Limpiar | nivel 1 |
| `board_state` | Leer qué hay en el tablero | nivel 1 |

Rutas restringidas a `media/`, tamaños acotados y sin HTML. Todo lo que muestre el modelo se marca como contenido no confiable.

**Accesibilidad y degradación:** todo lo que se hace con gestos se puede hacer con ratón, teclado y voz; sin cámara o sin permiso, el modo Holo muestra el anillo y las tarjetas sin manos.

---

## 8. Chat web

- Mensajes con **streaming**; bloques de código, Markdown sanitizado, indicador de razonamiento, herramientas desplegables (qué se pidió, permiso, resultado, duración).
- Selector de proveedor/modelo y de razonamiento, indicador "local / nube" siempre visible.
- Historial y búsqueda, memoria (ver, borrar, modo incógnito), adjuntos solo dentro de las carpetas autorizadas.
- **Sesión de chat** (`ChatSession`): hoy el chat de terminal y el bucle de voz tienen cada uno su propia lógica de turno; se unifica en una sesión con cola (un turno a la vez), cancelación y eventos tipados `chat.delta`, `chat.tool`, `chat.done`. Texto y voz comparten conversación.
- Permisos: tarjeta modal (qué, por qué, cómo contestar: botón / voz / gesto / frase tipeada para lo explícito) — evolución directa de la tarjeta del HUD.

---

## 9. Qué se reutiliza de v1.1

| Módulo actual | En v2.0 |
|---|---|
| `AgentCore`, `ModelRouter`, `ReasoningPolicy`, memoria, `ToolRegistry`, MCP, `PermissionManager`, auditoría | Sin cambios de fondo |
| `EventBus`, `MetricsLog`, `ResourceMonitor` | Alimentan el WebSocket |
| `piantao/ipc` (protocolo v1, whitelist de comandos) | Se extiende a protocolo v2; `ui.sock` se mantiene |
| `GestureEngine`, calibración | Reciben landmarks del navegador (fuente remota) |
| `VoiceLoop`, STT, TTS, wake, confirmación por voz | Pasan a usar `AudioTransport` |
| Panel Qt, HUD, `talk.py`, atajo de portal | **Se retiran** cuando la web los cubra (decisión 5): página de panel con paridad + HUD como vista web. `talk.py` se reemplaza por el botón/tecla de la página |
| Confirmaciones (`make_*_confirmer`) | Se agrega el confirmador web como un canal más |

---

## 10. Fases propuestas

Cada fase termina con algo que se usa y se prueba en tu hardware, como hasta ahora.

| Fase | Contenido | Resultado verificable |
|---|---|---|
| **W0** | Decisiones (§12), esqueleto del frontend, emparejamiento, CSP, HTTPS local, pruebas de seguridad base | Abrís `https://localhost:…`, te emparejás y ves el estado en vivo |
| **W1** | Gateway + protocolo v2 + **chat** con streaming, historial, herramientas y **permisos en la UI**; `ChatSession` unificada | Todo lo que hacés hoy por texto, sin terminal |
| **WS** | **Skills** (§13): índice, `skill_load`/`skill_read`, aprobación por huella, página web | El agente usa una skill tuya y la ves en el chat |
| **W2** | **Voz web**: AudioWorklet, transporte web, eco cancelado, barge-in, PTT en la página, wake | Hablarle desde el navegador, incluida la laptop |
| **W3** | **Visión web**: MediaPipe en el navegador, landmarks al servidor, gestos semánticos y confirmaciones, calibración en pantalla | Confirmar con pulgar y interrumpir con palma desde el navegador |
| **W4** | **Holo**: escena three.js, anillo, tarjetas, órbitas, manipulación con manos, herramientas `board_*` | La interfaz holográfica con las manos |
| **W5** | Paridad de paneles (MCP, permisos, auditoría, métricas, ajustes), HTTPS y acceso remoto privado, PWA | Reemplazo completo de panel Qt y HUD |
|  | *W5a (hecha):* pestaña **Panel** (estado, historial, memoria, herramientas/MCP, permisos que solo endurecen, auditoría), vista **`/hud`** (orbe + tarjeta de permisos) y **PWA** (manifest + service worker que solo cachea la carcasa). *W5b:* HTTPS/acceso remoto opcional y retiro de Qt/`talk.py`. | |
| **W6** | Endurecimiento: seguridad web (CSWSH, rebinding, XSS, inyección por tarjetas), carga, estabilidad de horas, presupuesto de VRAM/CPU, accesibilidad | Lista de verificación firmada |

Orden: W0 → W1 → WS → W2 → W3 → W4 → W5 → W6. W1 sola ya reemplaza la terminal; W4 es la más vistosa pero la que más depende de W2/W3.

---

## 11. Riesgos y cómo se mitigan

| Riesgo | Mitigación |
|---|---|
| **VRAM**: LLM + STT + navegador/WebGL + MediaPipe | MediaPipe en CPU por defecto; escena liviana (sin sombras/post-proceso pesado); medir con el `ResourceMonitor` y fijar presupuesto |
| **HTTPS en LAN** | Guiar con mkcert/Tailscale; el servidor detecta contexto inseguro y lo explica en pantalla |
| **Latencia de audio por red** | Bloques chicos, buffer adaptativo, métricas por turno (ya existe `MetricsLog`) |
| **Diferencias entre navegadores** | Objetivo Chromium y Firefox recientes; probar ambos en CI con Playwright |
| **Gestos distintos en JS y Python** | Solo la manipulación continua vive en JS; lo que decide permisos es el motor Python |
| **No poder probar la cámara real en el sandbox** | Pruebas con landmarks sintéticos y video falso; la validación real, como siempre, en tu equipo |
| **Dependencia del frontend (Node)** | Solo en desarrollo; los estáticos compilados van en el repositorio/parche |

---

## 12. Decisiones tomadas

| # | Tema | Decisión |
|---|---|---|
| 1 | Licencia / barehands | **Reimplementación propia.** Solo ideas (tarjetas de cristal, anillo de estado, protocolo de acciones con lista blanca); nada de su código. Umbrales y gestos propios. |
| 2 | Red | **Solo `localhost` primero.** HTTPS y acceso desde la laptop quedan para W5 (diseñado, no activo). |
| 3 | Frontend | **TypeScript + Preact + Vite.** Node 22 disponible. Los estáticos compilados se versionan en `piantao/web/static/` para que ejecutar Piantao no requiera Node. |
| 4 | Micrófono | **Navegador por defecto** (eco cancelado); el modo local queda como respaldo del servicio. |
| 5 | Terminal / panel / HUD | **Terminal como cliente fino.** Panel Qt y HUD se retiran: la web trae una **página de panel con paridad** (estado, voz y visión, historial, memoria, MCP, permisos, auditoría, métricas) y el **HUD pasa a ser una vista de la web** (overlay de estado y tarjeta de permisos, también como ventana independiente `/hud`). |
| 6 | Navegador | **Compatibilidad Firefox y Chromium.** Se usa solo lo que ambos soportan (getUserMedia, AudioWorklet, WebGL2, WASM, MediaPipe Tasks). Si alguna función exige uno solo, se decide en esa fase con evidencia (§11). |
| B | Skills | **El agente admite skills** (§13). |

Pendiente de definir más adelante (no bloquea W0): puerto por defecto (propuesta `127.0.0.1:8765`), si `/hud` se abre como ventana "siempre encima" (en Wayland depende de KWin, igual que hoy).

---

## 13. Skills del agente (bonus)

**Qué es:** una *skill* es una carpeta con un `SKILL.md` (frontmatter YAML `name` y `description`, cuerpo en Markdown) y archivos opcionales (guías, plantillas, scripts). Es el mismo formato que usan las skills de Claude, así que se pueden reutilizar.

**Cómo se usa (carga progresiva, para no gastar contexto del modelo local de 4B):**
1. Al arrancar se indexan las skills autorizadas y al modelo **solo se le muestran nombre + descripción** (una línea cada una, tope de tamaño).
2. Si la tarea coincide, el modelo llama a la herramienta `skill_load(name)`, que devuelve el cuerpo de `SKILL.md`. Recién ahí entra al contexto.
3. Si la skill trae archivos, el modelo los pide con `skill_read(name, path)` (solo dentro de la carpeta de esa skill).
4. Si trae scripts, **no se ejecutan solos**: el modelo debe pedir `run_command` y pasa por `PermissionManager` (lista blanca de comandos, confirmación, auditoría) como cualquier comando.

**Seguridad (una skill es texto que le da instrucciones al modelo, o sea, un vector de inyección):**
- Solo se cargan desde carpetas que **vos autorizás** en `config/skills.yaml` (`~/AI/piantao/skills/` por defecto), nunca desde contenido leído en web o MCP.
- **Huella fijada** como en MCP: una skill nueva o modificada queda *pendiente* hasta `python main.py skills approve <nombre>`; la UI web la muestra pero no puede aprobarla.
- El cuerpo cargado se trata como **contenido de confianza de usuario pero acotado**: no puede subir permisos ni evita confirmaciones (los permisos no dependen del texto del prompt).
- Límites: tamaño por skill, cantidad máxima, rutas sin `..` ni enlaces simbólicos que escapen, nombres validados.
- Auditoría: `skill_loaded`, `skill_file_read`, `skill_approved`.

**Interfaz:** en la web, una página *Skills* (lista, estado aprobada/pendiente, descripción, vista del contenido) y en el chat una marca cuando se usa una. En voz, "¿qué skills tenés?" las enumera.

**Dónde encaja:** nace como fase propia **WS** (después de W1, porque necesita `ChatSession` y la UI de permisos), con un parche pequeño y pruebas de seguridad propias.
