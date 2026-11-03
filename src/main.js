import { LESSONS } from './lessons.js';
import { RadioScene } from './scene.js';
import { wiringSVG, highlightNode, wiringDescription } from './wiring.js';
import { SignalLab } from './signals.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const pad=n=>String(n).padStart(2,'0');
const PARTS={
  coil:['75-turn coil','75 turns of 0.30 mm enamelled copper on a 50 mm former, with an approximately 25 mm winding length. The computed 291.5 µH is an estimate from geometry. Measure the actual resonance.'],
  pipe:['PVC former','The insulating pipe supports the winding. The coil diameter follows its outside diameter. The support cradles are illustrative, not required parts.'],
  capacitor:['Enclosed variable capacitor','Compact 21 × 21 × 17 mm-style housing based on the supplied reference, with a threaded tuning shaft, rear trimmers and seven terminal tabs. The two connected tabs are an illustrative AM/common pair: confirm your actual pinout. Rear trimmers are not the main tuning control.'],
  diode:['1N60P diode','The dark band marks the cathode, which goes to TP3. The unbanded end goes to TP1. The forward voltage depends on current and the actual device; the signal model’s 0.25 V is an adjustable simplification.'],
  resistor:['15 kΩ resistor','Connect it from TP3 to receiver GND, in parallel with the 3.3 nF capacitor. It provides the capacitor’s discharge path.'],
  ceramic:['3.3 nF capacitor','The 332 marking means 33 × 10² pF, or 3.3 nF. This nonpolar capacitor connects from TP3 to GND. With 15 kΩ, RC is 49.5 µs.'],
  board:['Breadboard connections','Each numbered a–e strip is connected internally; the corresponding f–j strip is separate. The model uses d9 for TP1 and d17/e17 plus strip 25 for TP3. Verify your board’s ground-rail continuity.'],
  loop:['Five-turn test loop','Its two leads connect only to the generator. Keep its return separate from receiver GND. Align its axis with the receiving coil and keep the spacing fixed while measuring.'],
  generator:['Function generator','Drives the separate test loop in the RF band. Check frequency range, amplitude units and termination settings. Its output voltage is not the voltage at TP1.'],
  scope:['Oscilloscope','Measures TP1 relative to receiver GND. Use a compensated ×10 probe and matching channel setting. The miniature screen is an illustration; use the signal model for calculated traces.'],
  probe:['×10 probe','Tip to TP1; short ground lead to receiver GND. Probe capacitance detunes the tank. The signal model uses 10 pF as an example; check the actual probe specification.'],
  dmm:['DC voltmeter','Positive lead to TP3, common lead to receiver GND. For the steady-sine test, record DC voltage alongside the actual TP1 peak from the scope.']
};
const shortNames={coil:'Coil',pipe:'Former',capacitor:'Variable capacitor',diode:'Diode',resistor:'15 kΩ',ceramic:'3.3 nF',board:'Breadboard',loop:'Test loop',generator:'Generator',scope:'Scope',probe:'Probe',dmm:'DMM'};
let scene=null,index=0,tab='assembly',node='all',selectedPart=null,sceneFailed=false;
let lab=new SignalLab(s=>{scene?.bench.setTuning(s.c);scene?.invalidate();});
const drawingZoom=document.createElement('button');drawingZoom.textContent='Enlarge';drawingZoom.dataset.drawingZoom='';drawingZoom.setAttribute('aria-pressed','false');
$('.node-select').append(drawingZoom);
drawingZoom.addEventListener('click',()=>{const enlarged=$('#wiring-drawing').classList.toggle('is-enlarged');drawingZoom.setAttribute('aria-pressed',String(enlarged));drawingZoom.textContent=enlarged?'Fit drawing':'Enlarge';});
new ResizeObserver(()=>{if(tab==='signal')lab.draw();}).observe($('#plot'));

function renderNav(){let group='';$('#step-nav').innerHTML=LESSONS.map((l,i)=>{
  let heading='';if(l.group!==group){group=l.group;heading=`<p class="step-group">${group}</p>`;}
  return `${heading}<button class="step-link" data-step="${i}" ${i===index?'aria-current="step"':''}><span>${pad(i+1)}</span><span>${l.name}</span></button>`;
}).join('');
  $$('#step-nav [data-step]').forEach(b=>b.addEventListener('click',()=>setStep(+b.dataset.step)));
}
function setStep(next,{historyMode='push',scroll=false}={}){
  index=Math.max(0,Math.min(LESSONS.length-1,next));const l=LESSONS[index];
  const content={'lesson-number':`Step ${pad(index+1)} / ${pad(LESSONS.length)} · ${l.group}`,'lesson-title':l.title,'lesson-intro':l.intro,'lesson-parts':l.parts,'lesson-why':l.why,'lesson-check':l.check,'lesson-caution':l.caution,'figure-label':`${pad(index+1)} / ${l.name}`,'model-footnote':l.note,'figure-number':`FIG. ${pad(index+1)}`,'page-count':`${pad(index+1)} / ${pad(LESSONS.length)}`,'record-prompt':l.record};
  for(const [id,value] of Object.entries(content))document.getElementById(id).textContent=value;
  $('#lesson-steps').replaceChildren(...l.steps.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
  $('#prev-step').disabled=index===0;$('#next-step').textContent=index===LESSONS.length-1?'Lab record →':'Next →';
  $$('#step-nav [data-step]').forEach(b=>{if(+b.dataset.step===index)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
  const active=$(`[data-step="${index}"]`);if(innerWidth<992&&active)$('#step-nav').scrollTo({left:active.offsetLeft-$('#step-nav').offsetLeft-20,behavior:'instant'});
  selectedPart=null;$('#part-detail').hidden=true;
  $('#part-buttons').innerHTML=l.inspect.map(id=>`<button data-part="${id}" aria-pressed="false" aria-controls="part-detail">${shortNames[id]}</button>`).join('');
  $$('[data-part]').forEach(b=>b.addEventListener('click',()=>inspect(b.dataset.part)));
  scene?.setStep(l.scene);scene?.bench.setTuning(lab.state.c);drawWiring();updateCaption();
  if(l.id==='envelope')lab.setMode('detector');else if(l.id==='resonance')lab.setMode('resonance');
  if(tab==='signal')lab.draw();
  if(historyMode!=='none'){
    const url=new URL(location.href);url.searchParams.set('step',l.id);
    try{history[historyMode==='replace'?'replaceState':'pushState']({},'',url);}catch{/* file:// remains usable */}
  }
  if(scroll){$('.lesson-workspace').scrollIntoView({block:'start'});$('#lesson-title').tabIndex=-1;$('#lesson-title').focus({preventScroll:true});}
}
function updateCaption(){
  const l=LESSONS[index];
  $('#figure-caption').textContent=tab==='assembly'?`${l.note}. Use the timeline to inspect assembly; select a part for a close-up.`:tab==='wiring'?'Trace each electrical node. The highlighted connections correspond to the written build steps.':'Change one parameter at a time. Curves are calculated from the stated assumptions; the lab record is reserved for actual measurements.';
}
function drawWiring(){
  $('#wiring-drawing').innerHTML=wiringSVG(LESSONS[index].scene);highlightNode(node);
  $('#wiring-description').textContent=wiringDescription(LESSONS[index].scene,node);
}
function inspect(id){
  if(!PARTS[id])return;
  const close=selectedPart===id;selectedPart=close?null:id;
  $$('[data-part]').forEach(b=>b.setAttribute('aria-pressed',!close&&b.dataset.part===id));
  $('#part-detail').hidden=close;
  if(close){scene?.resetView();return;}
  const title=document.createElement('h3'),body=document.createElement('p');title.textContent=PARTS[id][0];body.textContent=PARTS[id][1];$('#part-detail').replaceChildren(title,body);
  if(tab==='assembly')scene?.focusPart(id);
}
function selectTab(name){
  tab=name;
  $$('[data-tab]').forEach(b=>{const active=b.dataset.tab===name;b.setAttribute('aria-selected',active);b.tabIndex=active?0:-1;document.getElementById(b.getAttribute('aria-controls')).hidden=!active;});
  $('#assembly-timeline').hidden=name!=='assembly'||sceneFailed;$('.part-inspection').hidden=name==='signal';$('#part-detail').hidden=true;selectedPart=null;
  $$('[data-part]').forEach(b=>b.setAttribute('aria-pressed','false'));
  scene?.setEnabled(name==='assembly');
  if(name==='signal')lab.draw();updateCaption();
}
function updateProgress(p,playing){$('#assembly-progress').value=p*100;$('#assembly-position').textContent=`${Math.round(p*100)}%`;$('#play-assembly').textContent=playing?'Ⅱ Pause':p>=1?'▶ Replay':'▶ Play';$('#play-assembly').setAttribute('aria-pressed',String(playing));}

renderNav();
const initial=()=>Math.max(0,LESSONS.findIndex(l=>l.id===new URLSearchParams(location.search).get('step')));
setStep(initial(),{historyMode:'replace'});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
$('.view-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=$$('[data-tab]'),current=tabs.indexOf(document.activeElement);const next=e.key==='Home'?0:e.key==='End'?2:(current+(e.key==='ArrowRight'?1:2))%3;tabs[next].focus();selectTab(tabs[next].dataset.tab);});
$$('[data-node]').forEach(b=>b.addEventListener('click',()=>{node=b.dataset.node;$$('[data-node]').forEach(el=>el.setAttribute('aria-pressed',el===b));drawWiring();}));
$$('[data-plot]').forEach(b=>b.addEventListener('click',()=>lab.setMode(b.dataset.plot)));
$('#prev-step').addEventListener('click',()=>setStep(index-1,{scroll:true}));
$('#next-step').addEventListener('click',()=>{if(index===LESSONS.length-1)$('#record').scrollIntoView();else setStep(index+1,{scroll:true});});
$('#assembly-progress').addEventListener('input',e=>scene?.scrub(+e.target.value/100));
$('#play-assembly').addEventListener('click',()=>scene?.togglePlay());
$$('[data-camera]').forEach(b=>b.addEventListener('click',()=>{
  const action=b.dataset.camera;
  if(action==='labels'){const on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);scene?.setLabels(on);}
  else if(action==='in'||action==='out')scene?.zoom(action==='in'?.8:1.25);
  else{scene?.resetView(action==='top');selectedPart=null;$('#part-detail').hidden=true;$$('[data-part]').forEach(el=>el.setAttribute('aria-pressed','false'));}
}));
$('[data-open-wiring]').addEventListener('click',()=>selectTab('wiring'));
window.addEventListener('popstate',()=>setStep(initial(),{historyMode:'none'}));
// Fonts resolve before canvas textures are painted. The text guide is already usable.
document.fonts.ready.then(()=>{
  try{
    scene=new RadioScene($('#scene-canvas'),{onPart:inspect,onReady:()=>{$('#scene-loading').hidden=true;},onProgress:updateProgress});
    scene.setStep(LESSONS[index].scene);scene.setEnabled(tab==='assembly');
    if(new URLSearchParams(location.search).has('debug'))window.__radio={get scene(){return scene;},lab,lessons:LESSONS,setStep,selectTab};
  }catch(error){
    sceneFailed=true;console.error('Assembly unavailable:',error);$('#scene-loading').hidden=true;$('#scene-error').hidden=false;
    $('#assembly-timeline').hidden=true;$$('[data-camera]').forEach(b=>b.disabled=true);
  }
});
