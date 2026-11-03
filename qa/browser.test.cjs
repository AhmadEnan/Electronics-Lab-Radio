const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const checks=[],errors=[];
const check=(name,pass,detail)=>{checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});if(!pass)console.error('FAIL:',name,detail||'');};
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.woff2':'font/woff2','.pdf':'application/pdf'};
(async()=>{
 const server=http.createServer((req,res)=>{
   const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
   const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   try{res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/?debug=1`;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__radio?.scene.ready);
  check('Eight build steps',await page.locator('[data-step]').count()===8);
  check('Circuit image loads',await page.locator('.circuit-figure img').evaluate(e=>e.complete&&e.naturalWidth>0));
  for(const w of [390,768,992,1200,1440,1728,1920]){
    await page.setViewportSize({width:w,height:1000});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(150);
    check(`No horizontal overflow at ${w}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    check(`Visible canvas at ${w}`,await page.locator('#scene-canvas').evaluate(e=>e.clientHeight>=250));
    if([390,768,992,1440,1920].includes(w))await page.screenshot({path:path.join(__dirname,`redesign-${w}.png`),fullPage:w===1440});
  }
  await page.setViewportSize({width:1440,height:1000});
  for(let i=0;i<8;i++){
    await page.locator(`[data-step="${i}"]`).click();
    check(`Step ${i+1} content and geometry`,await page.evaluate(i=>window.__radio.scene.step===i+1&&document.querySelectorAll('#lesson-steps li').length===3&&document.querySelector('[aria-current=step]').dataset.step===String(i),i));
    await page.locator('#assembly-progress').fill('45');
    check(`Step ${i+1} scrub`,await page.evaluate(()=>Math.abs(window.__radio.scene.progress-.45)<.001));
    await page.locator('#assembly-progress').fill('100');
  }
  const geometry=await page.evaluate(()=>{
    const b=window.__radio.scene.bench;
    const distance=(a,c)=>a.distanceTo(c);
    const endpoint=(mesh,t)=>mesh.geometry.parameters.path.getPoint(t);
    b.root.updateMatrixWorld(true);
    const terminals=b.capTerminals;
    return {terminalCount:terminals.length,coilSegments:b.coilGeo.parameters.tubularSegments,
      amCoil:distance(endpoint(b.tankLeads.children[0],1),b.capAMWorld),commonCoil:distance(endpoint(b.tankLeads.children[1],1),b.capCommonWorld),
      amBoard:distance(endpoint(b.boardLinks.children[0],0),b.capAMWorld),commonBoard:distance(endpoint(b.boardLinks.children[1],0),b.capCommonWorld),
      sourceSeparate:b.genLeads!==b.boardLinks&&b.genLeads.children.every(m=>endpoint(m,1).distanceTo(b.capCommonWorld)>1),
      shell:b.capShell.geometry.parameters};
  });
  check('Capacitor has seven tabs',geometry.terminalCount===7);
  check('75-turn coil geometry retained',geometry.coilSegments===75*64);
  check('Both coil leads terminate on capacitor tabs',geometry.amCoil<1e-8&&geometry.commonCoil<1e-8,geometry);
  check('Receiver links use those same terminals',geometry.amBoard<1e-8&&geometry.commonBoard<1e-8);
  check('Generator leads remain separate from receiver return',geometry.sourceSeparate);
  await page.locator('[data-step="1"]').click();await page.locator('[data-part="capacitor"]').click();await page.waitForTimeout(150);await page.screenshot({path:path.join(__dirname,'redesign-capacitor.png')});
  await page.locator('[data-step="3"]').click();await page.locator('[data-tab="wiring"]').click();
  await page.locator('[data-node="tp3"]').click();check('Wiring highlight dims other nodes',await page.locator('.wire-dim').count()>0);
  await page.locator('[data-node="all"]').click();await page.screenshot({path:path.join(__dirname,'redesign-wiring.png')});
  await page.locator('[data-step="6"]').click();await page.locator('[data-tab="signal"]').click();
  const f0=await page.evaluate(()=>window.__radio.lab.f0);await page.locator('#model-probe').selectOption('100');
  check('Probe loading lowers resonance',await page.evaluate(()=>window.__radio.lab.f0)<f0);
  await page.screenshot({path:path.join(__dirname,'redesign-resonance.png')});
  await page.locator('[data-plot="detector"]').click();await page.locator('[data-resonate]').click();await page.locator('#model-depth').selectOption('0.6');
  check('AM model produces finite output',await page.evaluate(()=>Number.isFinite(window.__radio.lab.lastTrace.mean)&&window.__radio.lab.lastTrace.mean>0));
  await page.screenshot({path:path.join(__dirname,'redesign-detector.png')});
  for(const w of [390,768,992,1440]){
    await page.setViewportSize({width:w,height:1000});
    check(`Signal controls fit ${w}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(w===390)await page.screenshot({path:path.join(__dirname,'redesign-signal-mobile.png')});
  }
  await page.setViewportSize({width:1440,height:1000});await page.locator('[data-tab="assembly"]').click();await page.locator('[data-step="0"]').click();
  await page.waitForTimeout(200);const frames=await page.evaluate(()=>window.__radio.scene.frameCount);await page.waitForTimeout(250);
  check('No animation frames while idle',frames===await page.evaluate(()=>window.__radio.scene.frameCount));
  await page.locator('#play-assembly').click();await page.waitForTimeout(200);
  check('Explicit replay advances assembly',await page.evaluate(()=>window.__radio.scene.progress>0&&window.__radio.scene.progress<1));
  await page.locator('#play-assembly').click();const p=await page.evaluate(()=>window.__radio.scene.progress);await page.waitForTimeout(150);
  check('Pause holds progress',p===await page.evaluate(()=>window.__radio.scene.progress));
  await page.locator('#play-assembly').click();await page.locator('#record').scrollIntoViewIfNeeded();await page.waitForTimeout(200);
  const offFrames=await page.evaluate(()=>window.__radio.scene.frameCount);await page.waitForTimeout(200);
  check('No frames while off-screen',offFrames===await page.evaluate(()=>window.__radio.scene.frameCount));
  await page.evaluate(()=>scrollTo(0,0));await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
  check('Reduced motion stops playback',await page.evaluate(()=>!window.__radio.scene.playing));
  await page.locator('[data-step="1"]').click();check('Reduced motion lands in complete state',await page.evaluate(()=>window.__radio.scene.progress===1));
  await page.locator('#scene-canvas').focus();const before=await page.evaluate(()=>window.__radio.scene.camera.position.x);await page.keyboard.press('ArrowRight');
  check('Keyboard rotates 3D',before!==await page.evaluate(()=>window.__radio.scene.camera.position.x));
  check('Keyboard focus ring visible',await page.locator('#scene-canvas').evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));
  await page.locator('#tab-assembly').focus();await page.keyboard.press('ArrowRight');check('Tab keyboard navigation opens wiring',await page.locator('#wiring-view').isVisible());
  await page.locator('[data-step="2"]').click();await page.locator('[data-step="4"]').click();await page.goBack();
  check('Back restores prior lesson',await page.locator('[aria-current=step]').getAttribute('data-step')==='2');
  const fallback=await browser.newPage();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'||kind==='webgl2'?null:original.call(this,kind,...args);};});
  await fallback.goto(url);await fallback.locator('#scene-error').waitFor({state:'visible'});
  check('No-WebGL fallback keeps written guide',await fallback.locator('#lesson-steps li').count()===3);await fallback.locator('[data-open-wiring]').click();check('No-WebGL wiring view works',await fallback.locator('#wiring-drawing svg').count()===1);await fallback.close();
  check('No runtime or resource errors',errors.length===0,errors);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
 const report={date:new Date().toISOString(),passed:checks.filter(c=>c.pass).length,total:checks.length,checks};
 fs.writeFileSync(path.join(__dirname,'redesign-results.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 if(checks.some(c=>!c.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
