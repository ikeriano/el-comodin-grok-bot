import puppeteer from 'puppeteer-core';
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const p=await b.newPage();await p.setViewport({width:800,height:360,deviceScaleFactor:2});
const c=await p.createCDPSession();await c.send('Emulation.setCPUThrottlingRate',{rate:6});
await p.goto('http://127.0.0.1:27391/index.html');await p.evaluate(()=>localStorage.setItem('elcomodin_aj',JSON.stringify({mus:0,sfx:0,voz:0})));await p.reload();await new Promise(r=>setTimeout(r,3000));
await p.click('[data-acc=jugar]');await p.click('[data-acc=empezar]');
await p.waitForFunction(()=>!document.querySelector('#panel').classList.contains('oculto'),{timeout:120000});
const r=await p.evaluate(()=>new Promise(res=>{let n=0,t0=performance.now();const R=window.__elcomodin.SET;const f=()=>{n++;if(performance.now()-t0<5000)requestAnimationFrame(f);else res({raf:n/5,mem:performance.memory?.usedJSHeapSize/1e6})};f();}));
console.log(JSON.stringify(r));await b.close();
