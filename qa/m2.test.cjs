const {chromium}=require('playwright'),http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),checks=[],errors=[];
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.pdf':'application/pdf','.woff2':'font/woff2'};
const check=(name,pass)=>{checks.push({name,pass:!!pass});assert(pass,name);};
(async()=>{
 const server=http.createServer((req,res)=>{const f=path.join(root,new URL(req.url,'http://local').pathname);try{res.setHeader('Content-Type',mime[path.extname(f)]||'text/html');res.end(fs.readFileSync(f.endsWith(path.sep)?f+'index.html':f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const page=await browser.newPage({viewport:{width:1440,height:1080}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const url=`http://127.0.0.1:${server.address().port}`;await page.goto(url+'/m2.html?debug=1');await page.waitForFunction(()=>window.__radio?.scene.ready);
  check('Eight lessons',await page.locator('[data-step]').count()===8);
  for(let i=0;i<8;i++){await page.locator(`[data-step="${i}"]`).click();check(`Step ${i+1} geometry`,await page.evaluate(i=>window.__radio.scene.step===i+1,i));await page.locator('#assembly-progress').fill('45');check(`Step ${i+1} scrub`,await page.evaluate(()=>Math.abs(window.__radio.scene.progress-.45)<.001));await page.locator('#assembly-progress').fill('100');}
  await page.locator('[data-step="3"]').click();
  check('Each fitted component has a specific picker',await page.locator('#part-buttons [data-part]').count()===18);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'m2-desktop.png')});
  await page.locator('[data-part="rc1"]').click();check('Specific component and terminals in 3D',await page.evaluate(()=>window.__radio.scene.bench.selected==='rc1')&&await page.locator('.terminal-list').innerText().then(t=>t.includes('Q1 collector')&&t.includes('VR rail')));
  check('Connected leads remain visible',await page.evaluate(()=>{const b=window.__radio.scene.bench;let bright=false,dim=false;b.parts.rc1.traverse(o=>{if(o.userData.node==='vr'&&o.material?.opacity===1)bright=true;});b.parts.d2.traverse(o=>{if(o.material?.opacity<.5)dim=true;});return bright&&dim;}));
  await page.locator('[data-part="q1"]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'m2-transistor.png')});
  check('All three transistor terminal labels',await page.locator('#callouts .model-label').count()===3);
  await page.locator('#show-on-map').click();check('Cross-view part selection retained',await page.locator('.map-component[aria-pressed=true]').getAttribute('data-map-part')==='q1');check('Live vector board',await page.locator('#m2-board-map').count()===1);
  await page.locator('#map-section').selectOption('detector');await page.locator('[data-map-part="d2"]').click();check('Map selection reveals band and nodes',await page.locator('.terminal-list').innerText().then(t=>t.includes('Cathode')&&t.includes('TP3 / LEVEL')&&t.includes('c45')));
  await page.locator('[data-map-part="cd"]').focus();await page.keyboard.press('Enter');check('Map works by keyboard',await page.locator('.map-component[aria-pressed=true]').getAttribute('data-map-part')==='cd');
  await page.locator('#trace-node').selectOption('tp3');check('Tracing LEVEL dims unrelated connections',await page.locator('.wire-dim').count()>0&&await page.locator('#trace-help').innerText().then(t=>t.includes('TP3')));
  await page.locator('#trace-node').selectOption('all');await page.locator('[data-map-part="d2"]').click();await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'m2-wiring.png')});
  await page.locator('#show-in-3d').click();check('Map locates exact 3D component',await page.evaluate(()=>window.__radio.scene.bench.selected==='d2'));
  await page.locator('[data-step="4"]').click();await page.locator('[data-part="link"]').click();
  const coilInfo=await page.evaluate(()=>{const b=window.__radio.scene.bench;const range=m=>{const p=m.geometry.parameters.path.getPoints(600);return [Math.min(...p.map(v=>v.z)),Math.max(...p.map(v=>v.z))];};return {primary:range(b.primary),secondary:range(b.secondary),color:b.secondary.material.color.getHex(),visible:b.secondary.material.opacity};});
  check('Default windings have visible axial gap',coilInfo.secondary[0]-coilInfo.primary[1]>.8);check('Secondary has blue insulation',coilInfo.color===0x246b99&&coilInfo.visible===1);
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'m2-link.png')});
  await page.locator('[data-coils="wound"]').click();check('As-wound restores overlap',await page.evaluate(()=>{const b=window.__radio.scene.bench,p=b.secondary.geometry.parameters.path.getPoint(0);return !b.coilsSeparated&&p.z<1.25;}));
  await page.locator('[data-coils="separate"]').click();check('Separated view restored',await page.evaluate(()=>window.__radio.scene.bench.coilsSeparated));
  await page.locator('[data-tab="signal"]').click();check('Bias calculation preserved',await page.locator('#plot-readout').innerText().then(t=>t.includes('1.760')));await page.locator('[data-plot="detector"]').click();check('Divider preserved',await page.locator('#plot-readout').innerText().then(t=>t.includes('99.90')));
  await page.locator('[data-record="t4-2-0"]').fill('2.4');await page.evaluate(()=>scrollTo(0,0));await page.reload();await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>window.__radio?.scene.ready);check('Record persistence',await page.locator('[data-record="t4-2-0"]').inputValue()==='2.4');await page.locator('[data-record="t4-2-0"]').fill('');
  for(const width of [390,768,992,1440,1920]){
   await page.setViewportSize({width,height:1080});await page.evaluate(()=>{window.__radio.setStep(3);scrollTo(0,0);});check(`No 3D overflow ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('[data-tab="wiring"]').click();await page.locator('#map-section').selectOption('detector');await page.locator('[data-map-part="d2"]').click();check(`No wiring overflow ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.join(__dirname,'m2-wiring-mobile.png')});}
   await page.locator('[data-drawing-zoom]').click();check(`Enlargement scroll stays inside diagram ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('[data-drawing-zoom]').click();await page.locator('[data-tab="assembly"]').click();
  }
  await page.setViewportSize({width:390,height:1080});await page.evaluate(()=>{window.__radio.setStep(4);window.__radio.inspect('link',{toggle:false});scrollTo(0,0);});await page.screenshot({path:path.join(__dirname,'m2-mobile.png')});
  await page.goto(url+'/index.html?debug=1');await page.waitForFunction(()=>window.__radio?.scene.ready);check('M1 still loads eight steps',await page.locator('[data-step]').count()===8);await page.locator('[data-step="3"]').click();await page.locator('[data-tab="wiring"]').click();check('M1 node controls preserved',await page.locator('[data-node="tp3"]').count()===1);
  check('No runtime errors',!errors.length);console.log(JSON.stringify({checks:checks.length,errors}));
 }finally{fs.writeFileSync(path.join(__dirname,'m2-results.json'),JSON.stringify({checks,errors},null,2));await browser?.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
