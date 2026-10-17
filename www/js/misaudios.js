/* «Mis audios» (común a los juegos de Iker) · el jugador importa SUS PROPIOS audios o vídeos del móvil (la app no trae
   audio de terceros), se copian dentro de la app (IndexedDB, almacenamiento privado) y se asignan a los momentos de cada
   personaje (saludo, acierto, fallo, …) con recorte «desde el segundo X hasta el Y», Probar y Quitar. Si un momento no
   tiene audio, el juego sigue con su voz de siempre. Ligero: se reproduce con un <audio> (sin decodificar el archivo
   entero), vale también para vídeos largos en un Redmi A2.
   Configuración: window.MIS_AUDIOS_CFG = { juego, titulo, personajes:[{id,nombre,momentos:[[id,nombre],…]}], sfx:[[/regex/,'momento']],
   texto:[[/regex/,'momento']], anclar(): elemento donde poner el botón o null, flotante(): true si mostrar botón flotante } */
(function () {
  'use strict';
  var C = window.MIS_AUDIOS_CFG || {}; var J = C.juego || 'juego'; var P = 'ma_' + J + '_';
  var S = { db: null, urls: {}, el: null, ult: {}, ocupadoHasta: 0 };
  function toast(t, ms) { try { var d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:fixed;left:50%;bottom:12%;transform:translateX(-50%);z-index:2147483647;background:#000d;color:#fff;padding:10px 16px;border-radius:14px;font:600 15px system-ui;max-width:86vw;text-align:center;pointer-events:none'; document.body.appendChild(d); setTimeout(function () { d.remove(); }, ms || 2200); } catch (e) { } }
  function db() { return S.db || (S.db = new Promise(function (res, rej) { var r = indexedDB.open('misaudios_' + J, 1); r.onupgradeneeded = function () { r.result.createObjectStore('f', { keyPath: 'id' }); }; r.onsuccess = function () { res(r.result); }; r.onerror = function () { S.db = null; rej(r.error); }; })); }
  function tx(modo, fn) { return db().then(function (d) { return new Promise(function (res, rej) { var t = d.transaction('f', modo), q = fn(t.objectStore('f')); t.oncomplete = function () { res(q && q.result); }; t.onerror = function () { rej(t.error); }; t.onabort = function () { rej(t.error); }; }); }); }
  function lee(k, d) { try { return JSON.parse(localStorage.getItem(P + k) || d); } catch (e) { return JSON.parse(d); } }
  function lista() { return lee('lista', '[]'); } function listaPon(L) { localStorage.setItem(P + 'lista', JSON.stringify(L)); }
  function slots() { return lee('slots', '{}'); } function slotsPon(X) { localStorage.setItem(P + 'slots', JSON.stringify(X)); }
  function activo() { return localStorage.getItem(P + 'on') !== '0'; }
  function dur(blob) { return new Promise(function (res) { var a = new Audio(), u = URL.createObjectURL(blob), ok = false; function fin(v) { if (ok) return; ok = true; URL.revokeObjectURL(u); res(v); } a.preload = 'metadata'; a.onloadedmetadata = function () { fin(isFinite(a.duration) ? Math.round(a.duration * 10) / 10 : 0); }; a.onerror = function () { fin(0); }; setTimeout(function () { fin(0); }, 6000); a.src = u; }); }
  async function importa(files) { var L = lista(), n = 0;
    for (var i = 0; i < files.length; i++) { var f = files[i];
      if (!/^(audio|video)\//.test(f.type) && !/\.(mp3|m4a|aac|ogg|opus|wav|flac|mp4|webm|3gp|mkv|mov|amr)$/i.test(f.name)) continue;
      if (f.size > 120e6) { toast('«' + f.name + '» es muy grande (máx. 120 MB)', 2600); continue; }
      var id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), blob = f.slice(0, f.size, f.type || 'audio/mpeg');
      try { await tx('readwrite', function (s) { return s.put({ id: id, nombre: f.name, tipo: f.type, blob: blob }); }); } catch (e) { toast('No hay espacio para «' + f.name + '»', 2600); continue; }
      L.push({ id: id, nombre: f.name, video: /^video\//.test(f.type), dur: await dur(blob), kb: Math.round(f.size / 1024) }); n++; }
    listaPon(L); return n; }
  async function borra(id) { await tx('readwrite', function (s) { return s.delete(id); }).catch(function () { }); listaPon(lista().filter(function (x) { return x.id !== id; }));
    if (S.urls[id]) { URL.revokeObjectURL(S.urls[id]); delete S.urls[id]; } var X = slots(); for (var k in X) X[k].f = (X[k].f || []).filter(function (x) { return x !== id; }); slotsPon(X); }
  async function url(id) { if (S.urls[id]) return S.urls[id]; var r = await tx('readonly', function (s) { return s.get(id); }).catch(function () { return null; }); if (!r || !r.blob) return null; return S.urls[id] = URL.createObjectURL(r.blob); }
  function elige(k) { var s = slots()[k]; if (!s || !s.f || !s.f.length) return null; var L = lista(); if (!L.length) return null; var ops = [];
    s.f.forEach(function (x) { if (x === 'rnd') L.forEach(function (y) { ops.push(y.id); }); else if (L.some(function (y) { return y.id === x; })) ops.push(x); });
    return ops.length ? { id: ops[Math.floor(Math.random() * ops.length)], ini: +s.ini || 0, fin: +s.fin || 0 } : null; }
  function tiene(pid, mom) { return activo() && !!elige(pid + '.' + mom); }
  function para() { if (S.el) { var a = S.el; S.el = null; try { a.pause(); a.onended && a.onended(); } catch (e) { } } S.ocupadoHasta = 0; }
  // reproduce el audio de un hueco «personaje.momento»; devuelve {done, stop} o null
  async function toca(k, vol, prueba) { if (!prueba && !activo()) return null; var e = elige(k); if (!e) return null; var u = await url(e.id); if (!u) return null;
    para(); var a = new Audio(); S.el = a; a.preload = 'auto'; a.volume = Math.max(0, Math.min(1, vol == null ? 1 : vol));
    var finR, done = new Promise(function (r) { finR = r; }), iv, tope;
    function acaba() { clearInterval(iv); clearTimeout(tope); try { a.pause(); } catch (x) { } if (S.el === a) { S.el = null; S.ocupadoHasta = 0; } finR(); }
    a.onended = acaba; a.onerror = acaba; iv = setInterval(function () { if (e.fin > e.ini && a.currentTime >= e.fin) acaba(); }, 100);
    var it = lista().find(function (x) { return x.id === e.id; }), largo = e.fin > e.ini ? e.fin - e.ini : (it && it.dur ? it.dur - e.ini : 30);
    tope = setTimeout(acaba, Math.min(90, Math.max(2, largo + 1.5)) * 1000); S.ocupadoHasta = Date.now() + Math.min(90, largo) * 1000;
    a.src = u; function arranca() { try { if (e.ini > 0) a.currentTime = e.ini; } catch (x) { } var p = a.play(); p && p.catch && p.catch(acaba); }
    if (e.ini > 0) { a.onloadedmetadata = arranca; setTimeout(function () { a.paused && S.el === a && arranca(); }, 1500); } else arranca();
    return { done: done, stop: acaba }; }
  // un momento del juego: suena el primer personaje que tenga audio para ese momento (en el orden de la configuración)
  function estDur(k) { var s = slots()[k] || {}, ini = +s.ini || 0, fin = +s.fin || 0; if (fin > ini) return fin - ini; var L = lista(), ds = (s.f || []).map(function (id) { var x = L.find(function (y) { return y.id === id; }); return x && x.dur ? x.dur - ini : 0; }).filter(Boolean); return ds.length ? Math.min(30, Math.max.apply(null, ds)) : 3; }
  // un momento del juego: suena el primer personaje que tenga audio para ese momento (en el orden de la configuración).
  // Devuelve (sin esperar) {ms, done} si suena un audio mío (el juego puede callar su voz y esperar a done) o null.
  function evento(mom, pid) { try { if (!activo()) return null; var t = Date.now(); if (S.ult[mom] && t - S.ult[mom] < 1200) return null;
      var Ps = (C.personajes || []).filter(function (p) { return !pid || p.id === pid; });
      for (var i = 0; i < Ps.length; i++) { var k = Ps[i].id + '.' + mom; if (elige(k)) { S.ult[mom] = t; (window.__misAudiosLog = window.__misAudiosLog || []).push(k); var ms = Math.round(estDur(k) * 1000);
          var done = toca(k).then(function (r) { return r ? r.done : null; }).catch(function () { return null; }); return { ms: ms, done: done, mom: mom, k: k }; } } } catch (e) { } return null; }
  function busca(R, n) { for (var i = 0; i < R.length; i++) if (R[i][0].test(n)) return R[i]; return null; }
  function sfx(nombre) { try { var r = busca(C.sfx || [], String(nombre || '')); return r ? evento(r[1], r[2]) : null; } catch (e) { return null; } }
  function texto(t) { try { var r = busca(C.texto || [], String(t || '')); return r ? evento(r[1], r[2]) : null; } catch (e) { return null; } }
  function ocupado() { return !!S.el && Date.now() < S.ocupadoHasta; }
  function cuantos() { var X = slots(), n = 0; for (var k in X) if (X[k].f && X[k].f.length) n++; return n; }
  // ---------- panel ----------
  function panel() {
    var v = document.getElementById('maPanel'); v && v.remove(); var w = document.createElement('div'); w.id = 'maPanel';
    w.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#050b2ef5;color:#fff;overflow:auto;font:15px system-ui,sans-serif;-webkit-overflow-scrolling:touch;text-align:left';
    var st = document.createElement('style'); st.textContent = '#maPanel .in{max-width:900px;margin:0 auto;padding:14px 14px 40px}#maPanel h2{margin:4px 0 6px;color:#ffc21a;font:900 22px system-ui}#maPanel h4{margin:16px 0 2px;font:900 19px system-ui;color:#8fd0ff;border-bottom:2px solid #8fd0ff55;padding-bottom:3px}'
      + '#maPanel .b{border:2px solid #ffc21a;background:#0b2fa8;color:#fff;border-radius:12px;padding:8px 14px;font:700 15px system-ui;margin:3px;cursor:pointer}#maPanel .b.gr{display:block;width:100%;padding:16px;font-size:20px;background:linear-gradient(#ffd23a,#e89a00);color:#1a1000;margin:10px 0}'
      + '#maPanel .sl{border:1px solid #fff3;border-radius:12px;padding:8px 10px;margin:8px 0;background:#0b1a5a}#maPanel .sl h3{margin:0 0 6px;font:800 16px system-ui;color:#ffe07a}'
      + '#maPanel select,#maPanel input[type=number]{background:#111a;color:#fff;border:1px solid #888;border-radius:8px;padding:6px;font:15px system-ui;max-width:100%}#maPanel input[type=number]{width:5.5em}'
      + '#maPanel .chip{display:inline-flex;align-items:center;gap:6px;background:#1e3c9a;border:1px solid #6a8cff;border-radius:16px;padding:3px 4px 3px 10px;margin:2px;font-size:14px}#maPanel .chip button{border:0;background:#0006;color:#fff;border-radius:50%;width:24px;height:24px;padding:0;margin:0}'
      + '#maPanel .fila{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:6px}#maPanel .mis{font-size:14px;opacity:.9}#maPanel .mis div{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #fff2;padding:3px 0}#maPanel label.sw{display:flex;gap:8px;align-items:center;margin:6px 0;font-weight:700}';
    w.appendChild(st); var c = document.createElement('div'); c.className = 'in'; w.appendChild(c); document.body.appendChild(w);
    function el(t, txt, css) { var e = document.createElement(t); if (txt != null) e.textContent = txt; if (css) e.style.cssText = css; return e; }
    function B(t, fn, cls) { var b = el('button', t); b.className = 'b ' + (cls || ''); b.onclick = function (ev) { ev.stopPropagation(); ev.preventDefault(); fn(b); }; return b; }
    function fmt(s) { return s ? (s >= 60 ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : s.toFixed(1) + ' s') : ''; }
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
    function pinta() { para(); c.innerHTML = ''; var L = lista(), X = slots();
      c.appendChild(el('h2', '🎤 Mis audios' + (C.titulo ? ' · ' + C.titulo : '')));
      c.appendChild(el('p', 'Elige audios o vídeos de tu móvil (se usa su sonido). Se copian dentro de la app para que no se pierdan. Asígnalos a los momentos de cada personaje; si un momento no tiene audio, el juego suena como siempre.', 'opacity:.85;margin:0 0 4px'));
      var sw = el('label'); sw.className = 'sw'; var cb = el('input'); cb.type = 'checkbox'; cb.checked = activo(); cb.onchange = function () { localStorage.setItem(P + 'on', cb.checked ? '1' : '0'); }; sw.append(cb, el('span', 'Usar mis audios durante el juego')); c.appendChild(sw);
      var fi = el('input'); fi.type = 'file'; fi.accept = 'audio/*,video/*'; fi.multiple = true; fi.style.display = 'none'; c.appendChild(fi);
      var ad = B('➕ Añadir audios', function () { fi.click(); }, 'gr'); c.appendChild(ad);
      fi.onchange = async function () { var fs = [].slice.call(fi.files || []); if (!fs.length) return; ad.textContent = '⏳ Copiando ' + fs.length + ' archivo(s)…'; var n = await importa(fs); toast(n + ' audio(s) añadidos', 2000); pinta(); };
      if (L.length) { var m = el('div'); m.className = 'mis'; m.innerHTML = '<b style="color:#ffc21a">Mis audios (' + L.length + ')</b>'; L.forEach(function (x) { var r = el('div'); r.append(el('span', (x.video ? '🎞️ ' : '🎵 ') + x.nombre + (x.dur ? ' · ' + fmt(x.dur) : '')), B('🗑', async function () { await borra(x.id); pinta(); })); m.appendChild(r); }); c.appendChild(m); }
      (C.personajes || []).forEach(function (pj) { c.appendChild(el('h4', pj.nombre));
        pj.momentos.forEach(function (mo) { var k = pj.id + '.' + mo[0], s = X[k] || { f: [], ini: '', fin: '' }; var d = el('div'); d.className = 'sl'; d.dataset.k = k; d.appendChild(el('h3', mo[1]));
          var ch = el('div'); if (!s.f.length) ch.innerHTML = '<span style="opacity:.7">🗣️ Sonido del juego (sin audio mío)</span>';
          s.f.forEach(function (id) { var x = L.find(function (y) { return y.id === id; }); var cp = el('span', id === 'rnd' ? '🎲 Aleatorio (todos mis audios)' : x ? x.nombre : '?'); cp.className = 'chip'; cp.appendChild(B('×', function () { s.f = s.f.filter(function (y) { return y !== id; }); X[k] = s; slotsPon(X); pinta(); })); ch.appendChild(cp); });
          d.appendChild(ch);
          var f1 = el('div'); f1.className = 'fila'; var se = el('select'); se.innerHTML = '<option value="">' + (L.length ? '➕ Elegir audio para este momento…' : '(primero pulsa «Añadir audios»)') + '</option>' + (L.length ? '<option value="rnd">🎲 Aleatorio (todos mis audios)</option>' : '') + L.map(function (x) { return '<option value="' + x.id + '">' + esc(x.nombre) + '</option>'; }).join('');
          se.onchange = function () { if (!se.value) return; if (s.f.indexOf(se.value) < 0) s.f.push(se.value); X[k] = s; slotsPon(X); pinta(); }; f1.appendChild(se); d.appendChild(f1);
          var f2 = el('div'); f2.className = 'fila'; function num(v, ph) { var i = el('input'); i.type = 'number'; i.min = '0'; i.step = '0.5'; i.placeholder = ph; i.value = v || ''; i.onclick = function (ev) { ev.stopPropagation(); }; return i; }
          var a1 = num(s.ini, 'inicio'), a2 = num(s.fin, 'final'); function guarda() { s.ini = a1.value; s.fin = a2.value; X[k] = s; slotsPon(X); } a1.onchange = a2.onchange = guarda;
          f2.append(el('span', 'Usar desde el segundo'), a1, el('span', 'hasta el'), a2);
          f2.append(B('▶ Probar', async function (b) { guarda(); var r = await toca(k, 1, true); if (!r) { toast('Este momento usa el sonido del juego (elige un audio)', 2200); return; } b.textContent = '⏹ Parar'; b.onclick = function (ev) { ev.stopPropagation(); r.stop(); }; r.done.then(function () { b.textContent = '▶ Probar'; b.onclick = function (ev) { ev.stopPropagation(); pinta(); }; }); }),
            B('✖ Quitar', function () { delete X[k]; slotsPon(X); pinta(); }));
          d.appendChild(f2); c.appendChild(d); }); });
      c.appendChild(B('✔ Listo', function () { para(); w.remove(); try { C.alCerrar && C.alCerrar(); } catch (e) { } refresca(); }, 'gr')); }
    pinta(); return w; }
  // ---------- botón de entrada ----------
  function etiqueta() { var n = cuantos(); if (C.etiqueta) return C.etiqueta(n); return '🎤 Mis audios' + (n ? ' (' + n + ')' : ''); }
  function refresca() { [].forEach.call(document.querySelectorAll('.maBoton'), function (b) { var n = cuantos(); b.textContent = b.classList.contains('maFlot') ? '🎤 Mis audios' + (n ? ' (' + n + ')' : '') : etiqueta(); }); }
  function pon() { try {
      var a = C.anclar && C.anclar();
      if (a && !a.querySelector('.maFila')) { var b = C.crearBoton ? C.crearBoton(etiqueta(), panel) : null;
        if (!b) { b = document.createElement('button'); b.textContent = etiqueta(); b.style.cssText = C.estiloBoton || 'display:block;margin:8px auto;padding:10px 18px;border-radius:14px;border:2px solid #ffc21a;background:#0b2fa8;color:#fff;font:800 16px system-ui;cursor:pointer'; b.onclick = function (ev) { ev.stopPropagation(); ev.preventDefault(); panel(); }; }
        b.classList.add('maFila'); if (!b.querySelector('.maBoton')) b.classList.add('maBoton'); if (C.insertar) C.insertar(a, b); else a.appendChild(b); }
      var fl = document.getElementById('maFlot'), ver = !!(C.flotante && C.flotante()) && !document.getElementById('maPanel');
      if (ver && !fl) { fl = document.createElement('button'); fl.id = 'maFlot'; fl.className = 'maBoton maFlot'; fl.textContent = '🎤 Mis audios' + (cuantos() ? ' (' + cuantos() + ')' : ''); fl.style.cssText = C.estiloFlotante || 'position:fixed;left:10px;bottom:10px;z-index:2147483000;padding:8px 14px;border-radius:18px;border:2px solid #ffc21a;background:#0b2fa8e6;color:#fff;font:800 14px system-ui;cursor:pointer'; fl.onclick = function (ev) { ev.stopPropagation(); ev.preventDefault(); panel(); }; document.body.appendChild(fl); }
      else if (!ver && fl) fl.remove();
    } catch (e) { } }
  function arranca() { pon(); setInterval(pon, 700); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranca); else arranca();
  window.MisAudios = { panel: panel, toca: function (pid, mom) { return toca(pid + '.' + mom); }, tiene: tiene, evento: evento, sfx: sfx, texto: texto, para: para, ocupado: ocupado, lista: lista, slots: slots, importa: importa, cfg: C };
})();
