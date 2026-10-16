// Plató 3D ligero de «El Comodín» (inventado, sin recursos oficiales). Pensado para Redmi A2.
import * as THREE from './three.module.min.js';
const GOLD=0xf2b233, GOLD2=0xffd36b;
let R,S,C,clock,beams=[],heads=[],strips,screenTex,screenCv,sideTex=[],sideCv=[],people={},calidad='media',raf=0,last=0,camT=null,camAnim=null;
const CAMS={
 general:{p:[0,7.5,15.5],t:[0,2.2,0]},
 lateral:{p:[0,1.45,4.9],t:[0,1.15,-1.5]},
 conc:{p:[-1.6,1.9,3.2],t:[-1.2,1.6,-0.2]},
 pres:{p:[1.8,1.9,3.2],t:[1.2,1.6,-0.2]},
 pantalla:{p:[0,4.2,4],t:[0,4.6,-7]},
 publico:{p:[3.5,3,6],t:[-6,1.5,0]},
};
function tex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return [t,c];}
function stripTex(){return tex(16,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3a1800');gr.addColorStop(.25,'#ff9a1a');gr.addColorStop(.6,'#ffd36b');gr.addColorStop(1,'#7a3a00');g.fillStyle=gr;g.fillRect(0,0,w,h);g.fillStyle='rgba(255,255,255,.55)';g.fillRect(6,0,4,h);})[0];}
function beamTex(){return tex(64,8,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);})[0];}
function persona(o){ // personaje inventado, low-poly
 const g=new THREE.Group(),L=c=>new THREE.MeshLambertMaterial({color:c});
 const piel=L(o.piel||0xe0ac84),ropa=L(o.ropa),pant=L(o.pant||0x22263a);
 const tronco=new THREE.Mesh(new THREE.CylinderGeometry(.26,.3,.75,10),ropa);tronco.position.y=1.25;g.add(tronco);
 const cad=new THREE.Mesh(new THREE.BoxGeometry(.55,.2,.5),pant);cad.position.set(0,.88,.08);g.add(cad);
 for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.BoxGeometry(.17,.17,.62),pant);m.position.set(s*.14,.88,.4);g.add(m);
  const p=new THREE.Mesh(new THREE.BoxGeometry(.15,.6,.15),pant);p.position.set(s*.14,.55,.68);g.add(p);
  const z=new THREE.Mesh(new THREE.BoxGeometry(.16,.08,.26),L(0x111111));z.position.set(s*.14,.24,.74);g.add(z);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.62,6),ropa);b.position.set(s*.32,1.3,.18);b.rotation.x=-.9;g.add(b);
  const mn=new THREE.Mesh(new THREE.SphereGeometry(.07,6,5),piel);mn.position.set(s*.3,1.1,.45);g.add(mn);}
 const cu=new THREE.Mesh(new THREE.CylinderGeometry(.08,.09,.14,8),piel);cu.position.y=1.68;g.add(cu);
 const ca=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),piel);ca.position.y=1.88;ca.scale.set(.92,1.1,1);g.add(ca);
 const pelo=new THREE.Mesh(new THREE.SphereGeometry(.21,12,8,0,Math.PI*2,0,Math.PI*.5),L(o.pelo||0x2a1a10));pelo.position.y=1.92;pelo.rotation.x=-.25;g.add(pelo);
 if(o.largo){const m=new THREE.Mesh(new THREE.CylinderGeometry(.2,.24,.45,10,1,true),L(o.pelo));m.position.set(0,1.75,-.06);g.add(m);}
 if(o.barba){const m=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8,0,Math.PI*2,Math.PI*.55,Math.PI*.45),L(o.pelo));m.position.set(0,1.86,.03);g.add(m);}
 if(o.gafas){const m=new THREE.Mesh(new THREE.BoxGeometry(.3,.06,.02),L(0x111111));m.position.set(0,1.9,.19);g.add(m);}
 if(o.corbata){const m=new THREE.Mesh(new THREE.BoxGeometry(.18,.5,.02),L(0xf4f4f4));m.position.set(0,1.38,.27);g.add(m);}
 for(const s of[-1,1]){const m=new THREE.Mesh(new THREE.SphereGeometry(.025,5,4),L(0x111111));m.position.set(s*.07,1.92,.18);g.add(m);}
 return g;
}
function taburete(){const g=new THREE.Group(),W=new THREE.MeshLambertMaterial({color:0xf2f2f2}),M=new THREE.MeshLambertMaterial({color:0x999999});
 const a=new THREE.Mesh(new THREE.CylinderGeometry(.32,.3,.12,14),W);a.position.y=.85;g.add(a);
 const r=new THREE.Mesh(new THREE.BoxGeometry(.6,.45,.08),W);r.position.set(0,1.1,-.28);g.add(r);
 const p=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,.8,6),M);p.position.y=.42;g.add(p);
 const b=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,.04,14),M);b.position.y=.02;g.add(b);return g;}
export function avatarCanvas(c,o){const g=c.getContext('2d'),w=c.width,h=c.height;
 const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#2a1602');gr.addColorStop(1,'#ffb43a');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<9;i++){g.fillStyle='rgba(255,220,120,.25)';g.fillRect(i*w/9+4,0,4,h);}
 const cx=w/2,cy=h*.47;g.fillStyle=o.ropa;g.beginPath();g.ellipse(cx,h*1.02,w*.38,h*.33,0,0,7);g.fill();
 if(o.corbata){g.fillStyle='#f4f4f4';g.beginPath();g.moveTo(cx-w*.07,h*.72);g.lineTo(cx+w*.07,h*.72);g.lineTo(cx,h);g.fill();}
 g.fillStyle=o.pelo;if(o.largo){g.beginPath();g.ellipse(cx,cy+h*.06,w*.25,h*.3,0,0,7);g.fill();}
 g.fillStyle=o.piel;g.beginPath();g.ellipse(cx,cy,w*.19,h*.24,0,0,7);g.fill();
 g.fillStyle=o.pelo;g.beginPath();g.ellipse(cx,cy-h*.14,w*.2,h*.12,0,Math.PI,0);g.fill();
 if(o.barba){g.beginPath();g.ellipse(cx,cy+h*.1,w*.18,h*.13,0,0,Math.PI);g.fill();}
 g.fillStyle='#1a1a1a';for(const s of[-1,1]){g.beginPath();g.arc(cx+s*w*.07,cy-h*.02,w*.018,0,7);g.fill();}
 if(o.gafas){g.strokeStyle='#111';g.lineWidth=w*.012;for(const s of[-1,1]){g.strokeRect(cx+s*w*.07-w*.045,cy-h*.05,w*.09,h*.06);}}
 g.strokeStyle='#7a2a1a';g.lineWidth=w*.012;g.beginPath();g.arc(cx,cy+h*.06,w*.06,.2,Math.PI-.2);g.stroke();}
export const PRES={ropa:'#1d2b5c',pelo:'#3b2414',piel:'#e3b08a',barba:true,corbata:true};
export function init(canvas,q){calidad=q||'media';
 R=new THREE.WebGLRenderer({canvas,antialias:calidad==='alta',powerPreference:'low-power'});
 R.setPixelRatio(calidad==='alta'?Math.min(devicePixelRatio,1.5):calidad==='baja'?.6:.85);
 S=new THREE.Scene();S.background=new THREE.Color(0x120700);S.fog=new THREE.Fog(0x120700,18,40);
 C=new THREE.PerspectiveCamera(50,16/9,.1,80);setCam('general',0);
 S.add(new THREE.HemisphereLight(0xffe2b0,0x201030,1.6));const d=new THREE.DirectionalLight(0xffffff,1.6);d.position.set(3,8,6);S.add(d);
 // suelo negro brillante con anillos dorados
 const suelo=new THREE.Mesh(new THREE.CircleGeometry(16,48),new THREE.MeshPhongMaterial({color:0x050505,specular:0x553311,shininess:80}));suelo.rotation.x=-Math.PI/2;S.add(suelo);
 const goldM=new THREE.MeshBasicMaterial({color:GOLD});
 for(const [r,w] of [[1.6,.09],[2.4,.07],[3.6,.12],[5.2,.1],[7,.14]]){const m=new THREE.Mesh(new THREE.RingGeometry(r,r+w,64),goldM);m.rotation.x=-Math.PI/2;m.position.y=.01;S.add(m);}
 for(const a of[-.35,.35]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.18,12),goldM);m.rotation.x=-Math.PI/2;m.rotation.z=a*.25;m.position.set(a*2,.012,6);S.add(m);}
 // tarima
 const tar=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.5,.12,48),new THREE.MeshPhongMaterial({color:0x0b0b0b,shininess:90}));tar.position.y=.06;S.add(tar);
 for(let i=0;i<10;i++){const a=i/10*Math.PI*2,l=new THREE.Mesh(new THREE.CircleGeometry(.16,10),new THREE.MeshBasicMaterial({color:0xfff2d0}));l.rotation.x=-Math.PI/2;l.position.set(Math.cos(a)*4.4,.02,Math.sin(a)*4.4);S.add(l);}
 // fondo de tiras verticales doradas (instanciado)
 const sT=stripTex(),N=calidad==='baja'?40:70;strips=new THREE.InstancedMesh(new THREE.PlaneGeometry(.18,9),new THREE.MeshBasicMaterial({map:sT,color:0xffffff}),N);
 const o=new THREE.Object3D();for(let i=0;i<N;i++){const a=-1.25+2.5*i/(N-1),r=11+Math.random()*.6;o.position.set(Math.sin(a)*r,4.5+Math.random()*.6,-Math.cos(a)*r+2);o.rotation.set(0,-a,0);o.scale.set(.6+Math.random()*1.4,.8+Math.random()*.3,1);o.updateMatrix();strips.setMatrixAt(i,o.matrix);}
 S.add(strips);
 const bg=new THREE.Mesh(new THREE.CylinderGeometry(11.8,11.8,12,40,1,true,-1.4+Math.PI,2.8),new THREE.MeshBasicMaterial({color:0x2a1200,side:THREE.BackSide}));bg.position.set(0,5,2);bg.rotation.y=Math.PI;S.add(bg);
 // pantalla central y laterales
 [screenTex,screenCv]=tex(256,256,()=>{});const sc=new THREE.Mesh(new THREE.PlaneGeometry(3.4,3.4),new THREE.MeshBasicMaterial({map:screenTex}));sc.position.set(0,5.1,-8.2);S.add(sc);
 const marco=new THREE.Mesh(new THREE.PlaneGeometry(3.6,6.5),new THREE.MeshBasicMaterial({map:sT}));marco.position.set(0,3.8,-8.25);S.add(marco);
 for(const s of[-1,1]){const [t,c]=tex(160,200,()=>{});sideTex.push(t);sideCv.push(c);const m=new THREE.Mesh(new THREE.PlaneGeometry(2.4,3),new THREE.MeshBasicMaterial({map:t}));m.position.set(s*4.6,5.6,-7.4);m.rotation.y=-s*.3;S.add(m);
  const base=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.6),new THREE.MeshBasicMaterial({map:sT}));base.position.set(s*4.6,2.8,-7.38);base.rotation.y=-s*.3;S.add(base);}
 // mesa-pedestal blanca iluminada con pulsador dorado
 const pie=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,1.1,24),new THREE.MeshBasicMaterial({color:0xffe2c0}));pie.position.set(0,.65,-.6);S.add(pie);
 const sup=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.08,28),new THREE.MeshLambertMaterial({color:0xffffff,emissive:0x444444}));sup.position.set(0,1.24,-.6);S.add(sup);
 const aro=new THREE.Mesh(new THREE.TorusGeometry(.56,.03,6,28),goldM);aro.rotation.x=Math.PI/2;aro.position.set(0,.12,-.6);S.add(aro);
 const bola=new THREE.Mesh(new THREE.SphereGeometry(.11,16,10),new THREE.MeshPhongMaterial({color:GOLD,emissive:0x553300,shininess:120,specular:0xffffff}));bola.position.set(0,1.33,-.6);S.add(bola);people.bola=bola;
 for(const s of[-1,1]){const t=new THREE.Mesh(new THREE.ConeGeometry(.16,.22,3),new THREE.MeshLambertMaterial({color:0xffffff}));t.rotation.z=Math.PI/2*s;t.position.set(s*.45,1.36,-.6);S.add(t);}
 for(const s of[-1,1]){const t=taburete();t.position.set(s*1.25,0,-.6);t.rotation.y=-s*Math.PI/2;S.add(t);}
 const pres=persona({ropa:0x1d2b5c,pelo:0x3b2414,piel:0xe3b08a,barba:true,corbata:true,pant:0x1d2b5c});pres.position.set(1.25,.0,-.6);pres.rotation.y=-Math.PI/2;S.add(pres);people.pres=pres;
 const conc=persona({ropa:0x7a9a8a});conc.position.set(-1.25,0,-.6);conc.rotation.y=Math.PI/2;S.add(conc);people.conc=conc;
 // público en gradas a ambos lados (instanciado)
 const NP=calidad==='baja'?60:120,pg=new THREE.CapsuleGeometry(.17,.35,2,6),pm=new THREE.MeshLambertMaterial({color:0xffffff});const pub=new THREE.InstancedMesh(pg,pm,NP);
 const grad=new THREE.MeshLambertMaterial({color:0x1a1410});let k=0;const col=new THREE.Color();
 for(const s of[-1,1])for(let f=0;f<4;f++){const g=new THREE.Mesh(new THREE.BoxGeometry(1,.5+f*.5,9),grad);g.position.set(s*(8.2+f*1),(.5+f*.5)/2,0);g.rotation.y=s*.25;S.add(g);
  for(let j=0;j<NP/8;j++){const z=-4+8*j/(NP/8-1);o.position.set(s*(8.2+f*1)+z*s*-.25*.98,.5+f*.5+.35,z+ (s*(8.2+f))*0);o.position.x=s*(8.2+f*1)+Math.sin(s*.25)*z;o.position.z=Math.cos(s*.25)*z;o.rotation.set(0,0,0);o.scale.setScalar(1);o.updateMatrix();pub.setMatrixAt(k,o.matrix);pub.setColorAt(k,col.setHSL(Math.random(),.45,.45));k++;}}
 pub.count=k;S.add(pub);people.pub=pub;
 // focos y haces de luz
 const bT=beamTex(),nb=calidad==='baja'?6:10;
 for(let i=0;i<nb;i++){const s=i%2?1:-1,x=s*(2+((i>>1)%5)*1.7),hd=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));hd.position.set(x,6.5+(i%3)*.8,-6.5);S.add(hd);heads.push(hd);
  const b=new THREE.Mesh(new THREE.CylinderGeometry(.05,.6,14,8,1,true),new THREE.MeshBasicMaterial({map:bT,color:i%3?0xbfd8ff:0xffe0a0,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
  b.geometry.translate(0,-7,0);b.position.copy(hd.position);b.userData={a:Math.random()*6,s:.3+Math.random()*.4,dir:s};S.add(b);beams.push(b);}
 clock=new THREE.Clock();resize();addEventListener('resize',resize);loop();
}
export function setPersonas(o){if(!S)return;const set=(g,c)=>g.traverse(m=>{if(m.isMesh&&m.geometry.type==='CylinderGeometry'&&m.position.y>1)m.material.color.set(c)});set(people.conc,o.ropa);}
export function setCam(n,t=1.2){const c=CAMS[n]||CAMS.general;if(!C)return;if(!t){C.position.set(...c.p);camT=new THREE.Vector3(...c.t);C.lookAt(camT);camAnim=null;return;}
 camAnim={p0:C.position.clone(),t0:camT.clone(),p1:new THREE.Vector3(...c.p),t1:new THREE.Vector3(...c.t),s:performance.now(),d:t*1000};}
export function pantalla(est){if(!screenCv)return;const g=screenCv.getContext('2d'),w=256,h=256;g.fillStyle='#160a00';g.fillRect(0,0,w,h);
 const fh=h/7.6;for(let i=0;i<7;i++){const y=8+i*fh*1.03,lv=6-i;
  if(i<est.com){g.fillStyle='#1b2d8a';g.fillRect(14,y,108,fh-6);g.strokeStyle='#f2b233';g.lineWidth=2;g.strokeRect(14,y,108,fh-6);g.fillStyle='#fff';g.font='bold 17px Jost,sans-serif';g.textAlign='center';g.fillText('COMODÍN',68,y+fh*.62);}
  const act=lv===est.pos;g.fillStyle=act?'#1b2d8a':'#3c3c3c';g.fillRect(134,y,108,fh-6);if(act){g.strokeStyle='#f2b233';g.lineWidth=2;g.strokeRect(134,y,108,fh-6);}
  g.fillStyle='#fff';g.font='bold 17px Jost,sans-serif';g.textAlign='center';g.fillText(String(est.esc[lv]).replace(/\B(?=(\d{3})+(?!\d))/g,'.')+' €',188,y+fh*.62);}
 screenTex.needsUpdate=true;}
export function lateral(i,o){if(!sideCv[i])return;avatarCanvas(sideCv[i],o);sideTex[i].needsUpdate=true;}
export function pulsa(){if(!people.bola)return;people.bola.scale.setScalar(.8);setTimeout(()=>people.bola.scale.setScalar(1),180);}
export function pausa(p){if(p){cancelAnimationFrame(raf);raf=0;}else if(!raf)loop();}
function resize(){if(!R)return;const w=innerWidth,h=innerHeight;R.setSize(w,h,false);C.aspect=w/h;C.updateProjectionMatrix();}
function loop(){raf=requestAnimationFrame(loop);const now=performance.now();if(now-last<(calidad==='alta'?16:32))return;last=now;const t=clock.getElapsedTime();
 for(const b of beams){const u=b.userData;b.rotation.z=u.dir*(.35+Math.sin(t*u.s+u.a)*.35);b.rotation.x=.25+Math.cos(t*u.s*.7+u.a)*.25;}
 if(camAnim){let k=Math.min(1,(now-camAnim.s)/camAnim.d);k=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;C.position.lerpVectors(camAnim.p0,camAnim.p1,k);camT.lerpVectors(camAnim.t0,camAnim.t1,k);if(k>=1)camAnim=null;}
 C.lookAt(camT);R.render(S,C);}
