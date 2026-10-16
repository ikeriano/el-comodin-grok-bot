import puppeteer from 'puppeteer-core';
const [base,out]=process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:1280,height:720});const S=ms=>new Promise(r=>setTimeout(r,ms));
p.on('pageerror',e=>console.log('PAGEERROR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text().slice(0,200))});
await p.goto(base+'index.html');await p.evaluate(()=>localStorage.setItem('elcomodin_aj',JSON.stringify({mus:0,sfx:0,voz:0,cal:'media',bonus:'sim'})));await p.reload();await S(2500);
const shot=async n=>{await p.screenshot({path:out+'/'+n+'.png'});console.log('shot',n)};
const tap=async sel=>{await p.waitForSelector(sel,{visible:true,timeout:60000});const r=await p.evaluate(s=>{const b=document.querySelector(s).getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2]},sel);await p.mouse.click(r[0],r[1]);};
const vis=sel=>p.waitForFunction(s=>{const e=document.querySelector(s);return e&&!e.closest('.oculto')},{timeout:90000},sel);
await shot('01-menu');
await tap('[data-acc=opciones]');await S(400);await shot('02-opciones');await tap('#opciones [data-acc=volver]');
await tap('[data-acc=programa]');await S(400);await shot('03-programa-concursantes');await tap('[data-acc=empezar]');
await S(1800);await shot('04-presentador-intro');
for(let i=0;i<10;i++){
 await p.waitForFunction(()=>!document.querySelector('#panel').classList.contains('oculto')||!document.querySelector('#dlg').classList.contains('oculto')||!document.querySelector('#bonus').classList.contains('oculto'),{timeout:120000});
 if(!(await p.evaluate(()=>document.querySelector('#bonus').classList.contains('oculto')))){await S(4000);await shot('08-comodin-bonus');await vis('#dlg');await S(300);await shot('09-bonus-resultado');await tap('[data-acc=dlg0]');i--;continue;}
 if(!(await p.evaluate(()=>document.querySelector('#dlg').classList.contains('oculto')))){await S(300);await shot('11-plantarse');await tap('[data-acc=dlg0]');i--;continue;}
 await S(600);if(i===0)await shot('05-pregunta');
 if(i===1){await tap('#bpuls');await S(300);await tap('#bpuls');await S(300);await shot('06-pulsador');}
 if(i===6){await tap('#bsuper');await S(5500);await shot('10-super-comodin');}
 const k=await p.evaluate(i=>{const J=window.__elcomodin;const ops=[...document.querySelectorAll('.op')];const t=document.querySelector('#ptxt').textContent;const q=[...J.P4.a,...J.P4.b,...J.P4.c].find(x=>x[0]===t);
  const idx=ops.findIndex(o=>o.textContent.slice(1)===q[1]);return i===2?ops.findIndex((o,j)=>j!==idx&&!o.classList.contains('elim')):idx},i);
 await p.evaluate(k=>document.querySelectorAll('.op')[k].click(),k);
 if(i===2){await S(1600);await shot('07-fallo');}
 await p.waitForFunction(()=>document.querySelector('#panel').classList.contains('oculto'),{timeout:60000});
}
await vis('#dlg');await S(300);await shot('12-resultado-concursante');
await b.close();
