# El Comodín de La 1 · juego de fans (versión 1.1)

Juego de preguntas para Android inspirado en el concurso de La 1 (2022–2023, adaptación del formato turco «Joker»). Juego de fans, no oficial y sin ánimo de lucro.
Hecho como las otras apps de Iker: envoltorio WebView + HTML/JS con un plató 3D ligero en three.js (0.170).

- `www/` – el juego (index.html, app.css, js/main.js, js/set3d.js, js/preguntas.js, voz/). Es también la versión web de GitHub Pages.
- `android/` – envoltorio WebView (Gradle), paquete `com.ikeriano.elcomodin`. `assets/www` apunta a `../../../../../www`.
- `tools/` – preguntas en texto (`p4_*.txt`: 4 opciones, `p2.txt`: 2 opciones) y `preguntas.py` que genera `www/js/preguntas.js`; `voz.py` (voz original, Piper `es_ES-davefx-medium`; desde la 1.2 la voz nueva, Piper `es_ES-sharvard-medium` voz M, la hace `tools/redub/simple.py` con la misma duración de cada frase); `shots.mjs` (capturas con Chrome).

Sin recursos oficiales: no lleva logotipos, fotos ni voces reales. El presentador es un personaje inventado con voz sintética de Piper; todos los gráficos están dibujados por código y los efectos de sonido se sintetizan con WebAudio.

Compilar: `cd android && ./gradlew assembleRelease` (necesita `android/keystore/`, que no se sube al repositorio).
