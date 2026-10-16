import {P4,P2} from './preguntas.js';
import * as SET from './set3d.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ESC={normal:[0,200,500,1000,3000,10000,30000],aniv:[0,400,1000,2000,6000,20000,60000]};
const TIEMPO=q=>q<5?30:q<8?40:50;
const AJ=Object.assign({mus:40,sfx:70,voz:90,esc:'normal',cal:'baja'},JSON.parse(localStorage.getItem('elcomodin_aj')||'{}'));
const guarda=()=>localStorage.setItem('elcomodin_aj',JSON.stringify(AJ));
const eur=v=>v.toLocaleString('es-ES').replace(/(\d)(?=(\d{3})+$)/,'$1.')+' €';
const fmt=v=>(v>=1000?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,'.'):String(v))+' €';
const S=ms=>new Promise(r=>setTimeout(r,ms));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
// ---------- escala del escenario ----------
function escala(){const k=Math.min(innerWidth/1280,innerHeight/720);const st=$('#stage');st.style.transform=`scale(${k}) translate(-50%,-50%)`;st.style.transformOrigin='0 0';st.style.left='50%';st.style.top='50%';st.style.transform=`translate(-50%,-50%) scale(${k})`;st.style.transformOrigin='center';}
addEventListener('resize',escala);escala();
// ---------- audio: voz Piper pregrabada + efectos sintetizados ----------
let AC=null,musG=null,musOn=false;const voz=new Audio();
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tono(f,d,tipo='sine',v=1,t0=0){const a=ac();if(!a||!AJ.sfx)return;const o=a.createOscillator(),g=a.createGain();o.type=tipo;o.frequency.value=f;const t=a.currentTime+t0;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.25*v*AJ.sfx/100,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.05);}
const SFX={ok(){[523,659,784,1046].forEach((f,i)=>tono(f,.35,'triangle',1,i*.09))},mal(){tono(196,.5,'sawtooth',.6);tono(147,.7,'sawtooth',.6,.18)},
 pulsa(){tono(880,.12,'square',.5);tono(1320,.2,'triangle',.7,.06)},tic(){tono(1200,.05,'square',.25)},sube(){[392,523,659].forEach((f,i)=>tono(f,.25,'triangle',.8,i*.07))},
 baja(){[440,330,247].forEach((f,i)=>tono(f,.3,'sawtooth',.5,i*.12))},boton(){tono(660,.08,'triangle',.5)},fanfarria(){[392,523,659,784,659,784,1046].forEach((f,i)=>tono(f,.4,'triangle',.9,i*.13))}};
function musica(on){const a=ac();if(!a)return;if(!musG){musG=a.createGain();musG.connect(a.destination);}
 musG.gain.value=on?.05*AJ.mus/100:0;if(on&&!musOn){musOn=true;const pat=[220,277,330,277,247,311,370,311];let i=0;const paso=()=>{if(!musOn)return;const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=pat[i++%8];const t=a.currentTime;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(1,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.42);o.connect(g).connect(musG);o.start(t);o.stop(t+.45);setTimeout(paso,450)};paso();}
 if(!on)musOn=false;}
let habla=Promise.resolve();
function di(clave,texto){$('#bocad span').textContent=texto;$('#bocad').classList.remove('oculto');
 return new Promise(res=>{if(!AJ.voz||!clave){setTimeout(res,Math.min(3200,900+texto.length*45));return;}
  voz.src='voz/'+clave+'.mp3';voz.volume=AJ.voz/100;let done=false;const fin=()=>{if(!done){done=true;res();}};voz.onended=fin;voz.onerror=()=>setTimeout(fin,1200);voz.play().catch(()=>setTimeout(fin,1500));setTimeout(fin,9000);});}
const calla=()=>$('#bocad').classList.add('oculto');
// ---------- pantallas ----------
function pant(id){$$('.pant').forEach(p=>p.classList.toggle('oculto',p.id!==id));}
SET.init($('#gl'),AJ.cal);SET.setCam('general',0);SET.lateral(0,{ropa:'#c03a8a',pelo:'#1a1010',piel:'#e8b896',largo:true});SET.lateral(1,SET.PRES);
let modo='jugar',jugadores=[];
const AVA=[{ropa:'#7a9a8a',pelo:'#2a1a10',piel:'#e0ac84',gafas:true},{ropa:'#d04a8a',pelo:'#1a1010',piel:'#e8b896',largo:true},{ropa:'#3a7ad0',pelo:'#6a4020',piel:'#c8906a'},{ropa:'#e0a020',pelo:'#101010',piel:'#8a5a3a',largo:true}];
function setup(m){modo=m;$('#stit').textContent=m==='programa'?'LOS DOS CONCURSANTES':'¿QUIÉN VA A JUGAR?';
 const n=m==='programa'?2:1,def=[['Iker','Ane'],['Laura','Pablo']];
 $('#sjug').innerHTML=Array.from({length:n},(_,i)=>`<div class="jug">Concursante ${n>1?i+1:''}: <input type="text" maxlength="14" id="sn${i}" value="${def[i][0]}"> Acompañante: <input type="text" maxlength="14" id="sa${i}" value="${def[i][1]}"></div>`).join('');
 $('#sbonus').value=AJ.bonus||'sim';pant('setup');}
const ACC={
 jugar(){setup('jugar')},programa(){setup('programa')},
 opciones(){$('#omus').value=AJ.mus;$('#osfx').value=AJ.sfx;$('#ovoz').value=AJ.voz;$('#oesc').value=AJ.esc;$('#ocal').value=AJ.cal;pant('opciones')},
 volver(){pant('menu');SET.setCam('general')},
 empezar(){AJ.bonus=$('#sbonus').value;guarda();const n=modo==='programa'?2:1;jugadores=[];for(let i=0;i<n;i++)jugadores.push({nombre:($('#sn'+i).value||'Concursante').trim(),acomp:($('#sa'+i).value||'Acompañante').trim(),ava:AVA[i*2%4+(Math.random()*2|0)]});programa();},
 pausa(){pausado=true;$('#pausa').classList.remove('oculto')},seguir(){pausado=false;$('#pausa').classList.add('oculto')},
 salir(){location.reload()},
};
document.addEventListener('click',e=>{const b=e.target.closest('[data-acc]');if(!b)return;ac();SFX.boton();const a=b.dataset.acc;if(ACC[a])ACC[a](b);else if(handler)handler(a,b);});
for(const [id,k] of [['omus','mus'],['osfx','sfx'],['ovoz','voz']])$('#'+id).addEventListener('input',e=>{AJ[k]=+e.target.value;guarda();});
$('#oesc').addEventListener('change',e=>{AJ.esc=e.target.value;guarda();});
$('#ocal').addEventListener('change',e=>{AJ.cal=e.target.value;guarda();});
let handler=null,pausado=false;
// diálogo de elección
function pregunta(tit,txt,ops){return new Promise(res=>{const d=$('#dlg');d.querySelector('h2').textContent=tit;d.querySelector('p').textContent=txt;
 d.querySelector('.fila').innerHTML=ops.map((o,i)=>`<button class="btn ${i?'gris':''}" data-acc="dlg${i}">${o}</button>`).join('');d.classList.remove('oculto');
 handler=a=>{if(a.startsWith('dlg')){d.classList.add('oculto');handler=null;res(+a.slice(3));}};});}
// ---------- HUD ----------
let J=null;
function hud(){const esc=ESC[AJ.esc];$('#coms').innerHTML=Array.from({length:7},(_,i)=>`<div class="tile ${i<7-J.com?'fuera':''}">COMODÍN</div>`).join('');
 $('#esc').innerHTML=esc.slice().reverse().map((v,i)=>`<div class="${6-i===J.pos?'act':''}">${fmt(v)}</div>`).join('');
 $('#tcom').textContent=J.com+' × COMODÍN';$('#teur').textContent=fmt(esc[J.pos]);SET.pantalla({com:J.com,pos:J.pos,esc});}
// ---------- elegir preguntas ----------
const usadas=new Set();
function elige(nivel){const pool=P4[nivel].filter(q=>!usadas.has(q[0]));const q=pool.length?pool[Math.random()*pool.length|0]:P4[nivel][Math.random()*P4[nivel].length|0];usadas.add(q[0]);return q;}
const NIVEL=i=>i<4?'a':i<8?'b':'c';
// ---------- una pregunta ----------
function jugarPregunta(i){return new Promise(async res=>{
 const q=elige(NIVEL(i)),ops=shuf(q.slice(1)),ok=q[1];let t=TIEMPO(i),usados=0,fin=false,elim=[];
 $('#pnum b').textContent=i+1;$('#ptxt').textContent=q[0];
 $('#pres').innerHTML=ops.map((o,k)=>`<button class="op" data-acc="r${k}"><i>${'ABCD'[k]}</i>${o}</button>`).join('');
 $('#tmr').textContent=t;$('#tmr').classList.remove('poco');$('#panel').classList.remove('oculto');$('#ayudas').classList.remove('oculto');
 const upd=()=>{$('#bpuls').disabled=fin||J.com<1||usados>=3;$('#bsuper').disabled=fin||J.superUsado||i>6;};upd();
 SET.setCam('lateral');
 const iv=setInterval(()=>{if(pausado||fin)return;t--;$('#tmr').textContent=Math.max(0,t);$('#tmr').classList.toggle('poco',t<=5);if(t<=5&&t>0)SFX.tic();if(t<=0)termina(-1);},1000);
 async function termina(k){if(fin)return;fin=true;clearInterval(iv);upd();handler=null;const b=$$('.op');
  if(k>=0){b[k].classList.add('sel');await S(900);}
  const idx=ops.indexOf(ok);b[idx].classList.add('ok');const acierto=k===idx;if(k>=0&&!acierto)b[k].classList.add('mal');
  if(acierto){SFX.ok();J.pos=Math.min(6,J.pos+1);J.aciertos++;hud();SFX.sube();await di(J.pos===6?'acierto_top':'acierto',J.pos===6?'¡Correcta! Ya estás en lo más alto.':'¡Respuesta correcta! Subes un escalón.');}
  else{SFX.mal();if(k<0)await di('tiempo','¡Se acabó el tiempo!');
   if(J.com>0){J.com=Math.max(0,J.com-3);hud();await di('fallo','Lo siento, no es correcta. Pierdes tres comodines.');}
   else{J.pos=Math.max(0,J.pos-3);hud();SFX.baja();await di('fallo_esc','No es correcta, y ya no quedan comodines. Bajas tres escalones.');}}
  await S(700);calla();$('#panel').classList.add('oculto');$('#ayudas').classList.add('oculto');res(acierto);}
 handler=async a=>{if(fin)return;
  if(a[0]==='r'){const k=+a.slice(1);if(elim.includes(k))return;termina(k);}
  else if(a==='pulsador'&&J.com>0&&usados<3){usados++;J.com--;J.usados++;SET.pulsa();SFX.pulsa();const malas=[0,1,2,3].filter(k=>ops[k]!==ok&&!elim.includes(k));const e=malas[Math.random()*malas.length|0];elim.push(e);$$('.op')[e].classList.add('elim');t+=15;$('#tmr').textContent=t;hud();upd();}
  else if(a==='super'&&!J.superUsado&&i<=6){J.superUsado=true;t+=15;$('#tmr').textContent=t;upd();SET.pulsa();
   const idx=ops.indexOf(ok),acierta=Math.random()<({a:.92,b:.82,c:.7})[NIVEL(i)];let s=idx;if(!acierta){const o=[0,1,2,3].filter(k=>k!==idx&&!elim.includes(k));if(o.length)s=o[Math.random()*o.length|0];}
   await di('super','¡Super comodín! Tu acompañante te ayuda con esta pregunta.');$('#bocad i').textContent=J.acomp.toUpperCase();$('#bocad span').textContent=`Yo diría que es la ${'ABCD'[s]}: «${ops[s]}».`;$$('.op')[s].classList.add('sug');setTimeout(()=>{$('#bocad i').textContent='PRESENTADOR';},4000);}
 };
});}
// ---------- comodín bonus (90 s, dos opciones) ----------
function bonus(){return new Promise(async res=>{
 await di('bonus','Llega el comodín bonus. Tu acompañante tiene noventa segundos. Cada cinco aciertos, un comodín más.');
 const yo=AJ.bonus==='yo';let t=90,ac=0,fin=false,pend=null;SET.setCam('pantalla');
 $('#bonus').classList.remove('oculto');calla();
 const pool=shuf(P2);let n=0;const info=()=>{$('#binfo').textContent=`${yo?'Juegas tú por '+J.acomp:J.acomp+' juega'} · ⏱ ${t} s · aciertos: ${ac} · comodines ganados: ${Math.floor(ac/5)}`;};
 const iv=setInterval(()=>{if(pausado||fin)return;t--;info();if(t<=0){fin=true;clearInterval(iv);if(pend)pend(-1);}},1000);
 while(!fin){const q=pool[n++%pool.length],ops=shuf([q[1],q[2]]);$('#bq').textContent=q[0];
  $('#bops').innerHTML=ops.map((o,k)=>`<button class="op" data-acc="b${k}"><i>${'AB'[k]}</i>${o}</button>`).join('');info();
  const k=await new Promise(r=>{pend=r;if(yo){handler=a=>{if(a[0]==='b'){handler=null;r(+a[1]);}};}else{setTimeout(()=>r(Math.random()<.8?ops.indexOf(q[1]):ops.indexOf(q[2])),1800+Math.random()*2200);}});
  pend=null;handler=null;if(k<0||fin)break;const b=$$('#bops .op');const bien=ops[k]===q[1];b[k].classList.add(bien?'ok':'mal');if(bien){ac++;SFX.tic();if(ac%5===0)SFX.sube();}else tono(200,.15,'square',.4);info();await S(450);}
 clearInterval(iv);const gan=Math.floor(ac/5),antes=J.com;J.com=Math.min(7,J.com+gan);hud();
 $('#bonus').classList.add('oculto');await di('bonus_fin','¡Se acabó el tiempo del comodín bonus!');
 await pregunta('COMODÍN BONUS',`${J.acomp} ha acertado ${ac} preguntas.\n${gan?`¡Ganas ${gan} comodín${gan>1?'es':''}!`:'No hay comodines nuevos esta vez.'}${antes+gan>7?'\n(Máximo 7 comodines.)':''}`,['SEGUIR']);calla();res();});}
// ---------- partida de un concursante ----------
async function concursante(j,idx){const esc=ESC[AJ.esc];J={...j,pos:0,com:7,superUsado:false,aciertos:0,usados:0};
 SET.lateral(0,j.ava);SET.setPersonas(j.ava);hud();$('#juego').classList.remove('oculto');pant('juego');
 SET.setCam('pres');await di(idx?'presenta2':'presenta1',idx?'Y ahora, nuestro segundo concursante.':'Vamos a conocer a nuestro primer concursante.');
 $('#bocad span').textContent=`¡Bienvenido, ${j.nombre}! Te acompaña ${j.acomp}.`;await S(1600);
 SET.setCam('lateral');await di('empezamos','¡Que empiece el juego!');
 for(let i=0;i<10;i++){
  if(i===6){await bonus();}
  if(i===9){SET.setCam('conc');await di('plantarse','Llegamos a la última pregunta. ¿Te plantas con el premio de un escalón menos, o te la juegas?');
   const pl=esc[Math.max(0,J.pos-1)];const r=await pregunta('¿TE PLANTAS?',`Ahora tienes ${fmt(esc[J.pos])}.\nSi te plantas te llevas ${fmt(pl)} (un escalón menos).\nSi juegas la décima pregunta y aciertas subes a ${fmt(esc[Math.min(6,J.pos+1)])}; si fallas, la penalización de siempre.`,['ME LA JUEGO','ME PLANTO']);
   if(r===1){J.premio=pl;J.plantado=true;await di('planta_si','Te plantas. ¡Enhorabuena!');break;}
   await di('juega','¡Valiente! Vamos con la décima pregunta.');}
  await di('q'+(i+1),['Primera','Segunda','Tercera','Cuarta','Quinta','Sexta','Séptima','Octava','Novena','Décima'][i]+' pregunta.');calla();
  await jugarPregunta(i);}
 if(J.premio==null)J.premio=esc[J.pos];
 SET.setCam('general');SFX.fanfarria();
 if(J.premio>0)await di('fin_bien','¡Enhorabuena! Te llevas el premio.');else await di('fin_cero','Esta vez no ha habido suerte. Te vas sin premio, pero con un gran aplauso.');
 if(AJ.voz)await di('e'+J.premio,fmt(J.premio));
 await pregunta(j.nombre.toUpperCase(),`Premio: ${fmt(J.premio)}${J.plantado?' (se plantó antes de la 10.ª)':''}\nAciertos: ${J.aciertos} · comodines usados en el pulsador: ${J.usados}\nComodines al final: ${J.com}`,[idx<jugadores.length-1?'SIGUIENTE CONCURSANTE':'VER RESULTADOS']);calla();
 return J;}
async function programa(){usadas.clear();musica(true);$('#juego').classList.remove('oculto');pant('juego');
 J={pos:0,com:7};hud();SET.setCam('general',0);SET.setCam('pantalla',3);
 await di('hola','¡Muy buenas noches y bienvenidos a El Comodín de La Uno!');
 SET.setCam('pres');if(modo==='programa')await di('reglas','Diez preguntas, siete comodines y una escalera de premios. Cada acierto te sube un escalón. Cada fallo te quita tres comodines.');
 musica(false);const res=[];for(let i=0;i<jugadores.length;i++)res.push(await concursante(jugadores[i],i));
 musica(true);SET.setCam('pantalla');
 if(res.length>1){await di('resultados','Vamos a ver cómo ha quedado el programa.');const m=Math.max(...res.map(r=>r.premio));
  await pregunta('RESULTADOS DEL PROGRAMA',res.map(r=>`${r.premio===m&&m>0?'🏆 ':''}${r.nombre}: ${fmt(r.premio)}`).join('\n')+(m>0?'':'\nNadie se lleva premio esta noche.'),['VOLVER AL MENÚ']);}
 await di('despedida','Gracias por acompañarnos. ¡Hasta el próximo programa de El Comodín!');calla();musica(false);
 pant('menu');SET.setCam('general');}
window.__elcomodin={get J(){return J},SET,ESC,AJ,P4,P2};
