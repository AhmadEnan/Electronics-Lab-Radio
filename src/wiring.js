const copper='#a44d29',ink='#28302e',muted='#747c71';
const text=(x,y,t,size=16,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" ${extra}>${t}</text>`;
const path=(d,color=copper,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const dot=(x,y)=>`<circle cx="${x}" cy="${y}" r="4" fill="${copper}"/>`;
const net=(id,body)=>`<g class="wire-net" data-net="${id}">${body}</g>`;

export function wiringSVG(step){
  if(step<4)return tankSVG(step);
  const x=c=>100+(c-1)*19;
  const rows={a:180,b:199,c:218,d:237,e:256,f:300,g:319,h:338,i:357,j:376};
  let holes='',labels='',strips='';
  for(let c=1;c<=30;c++){
    labels+=text(x(c),164,c,10,'text-anchor="middle"');
    for(const y of Object.values(rows))holes+=`<circle cx="${x(c)}" cy="${y}" r="2.8" fill="#9ca195"/>`;
  }
  for(const [row,y] of Object.entries(rows))labels+=text(72,y+4,row,12);
  for(const c of [9,17,25]){
    const id=c===9?'tp1':'tp3';
    strips+=net(id,`<rect x="${x(c)-6}" y="173" width="12" height="90" rx="5" fill="${copper}" opacity=".16"/>`);
    if(c!==9)strips+=net('gnd',`<rect x="${x(c)-6}" y="294" width="12" height="89" rx="5" fill="${ink}" opacity=".12"/>`);
  }
  let drawing=`<rect x="52" y="141" width="645" height="318" rx="9" fill="#eceee6" stroke="#c6ccbf"/>${strips}${holes}<g class="diagram-mono">${labels}</g>`;
  drawing+=path('M78 278H672','#c3c8bc','stroke-width="1"')+text(79,288,'centre channel',10,'fill="#747c71"');
  drawing+=net('tp1',path(`M40 100H${x(9)}V${rows.d}`)+dot(x(9),rows.d)+text(37,82,'TP1',16));
  drawing+=net('tp3',path(`M${x(17)} ${rows.b}V113H${x(25)}V${rows.b}`)+dot(x(17),rows.d)+dot(x(25),rows.d)+text(486,100,'TP3',16));
  // Diode d9→d17; cathode marking at the TP3 end.
  drawing+=path(`M${x(9)} ${rows.d}H${x(17)}`,ink);
  drawing+=`<rect x="${x(9)+42}" y="225" width="68" height="24" rx="10" fill="#d8be91" stroke="${ink}"/><rect x="${x(9)+94}" y="225" width="7" height="24" fill="${ink}"/>`;
  drawing+=text(x(9)+63,216,'1N60P',14,'text-anchor="middle"')+text(x(9)+95,273,'band →',13);
  // Resistor e17→g17; capacitor d25→g25. The terminal strips make d17/e17 one node.
  drawing+=path(`M${x(17)} ${rows.e}V266l-6 5 12 8-12 8 12 8-6 5v19`,ink);
  drawing+=text(x(17)-14,313,'15 kΩ',13,'text-anchor="end"');
  drawing+=path(`M${x(25)} ${rows.d}V275m-13 0h26m-26 12h26m-13 0v32`,ink);
  drawing+=text(x(25)+20,290,'3.3 nF',14);
  drawing+=net('gnd',path(`M${x(17)} ${rows.i}V422H40M${x(25)} ${rows.i}V422H${x(17)}`,ink,'stroke-dasharray="7 4"')+dot(x(17),422)+dot(x(25),422)+text(77,446,'Receiver GND · verify rail continuity',14));
  for(let c=1;c<=30;c++)drawing+=`<circle cx="${x(c)}" cy="422" r="2.4" fill="${ink}"/>`;
  const source=step>=6?`<rect x="32" y="10" width="696" height="45" fill="#e9ece3"/>${text(47,38,'Generator + return → 5-turn loop',15)}${text(712,38,'Magnetic coupling only',14,'text-anchor="end" fill="#a44d29"')}`:'';
  return wrap('Detector breadboard connections',`${source}${drawing}${text(37,490,'a–e: one strip per number',14)}${text(724,490,'f–j: a separate strip',14,'text-anchor="end"')}`,760,510);
}
function tankSVG(step){
  let d=`<g class="diagram-mono">${text(32,40,'TANK / TWO SHARED NODES',13)}</g>`;
  // Coil drawn around an insulating former, with dimension lines.
  d+=`<rect x="110" y="148" width="200" height="198" rx="38" fill="#e7e9e0" stroke="#b9c0b2"/><ellipse cx="310" cy="247" rx="24" ry="99" fill="#d7dccf" stroke="#b9c0b2"/>`;
  for(let i=0;i<29;i++)d+=`<path d="M${151+i*3.5} 151c-27 22-27 170 0 192" fill="none" stroke="${copper}" stroke-width="2.5"/>`;
  d+=text(205,390,'75-turn winding',19,'text-anchor="middle"')+text(205,416,'50 mm diameter · ≈25 mm length',14,'text-anchor="middle"');
  d+=path('M143 127v-12h115v12M143 120h115','#747c71','stroke-width="1"')+text(200,106,'≈25 mm',14,'text-anchor="middle"');
  if(step>=2){
    d+=`<rect x="485" y="169" width="136" height="136" rx="10" fill="#e5dfc8" stroke="#b3ac8d"/><rect x="493" y="177" width="120" height="120" rx="7" fill="#f0eedf" stroke="#c9c4ac"/><circle cx="553" cy="229" r="15" fill="#b69c65" stroke="#8f7850"/><circle cx="553" cy="229" r="5" fill="#676658"/>`;
    for(const x of [511,553,595])d+=`<rect x="${x-4}" y="304" width="8" height="30" fill="#b69c65"/>`;
    for(const x of [505,537,569,601])d+=`<rect x="${x-3}" y="149" width="6" height="20" fill="#b69c65"/>`;
    for(const x of [506,600])for(const y of [190,284])d+=`<circle cx="${x}" cy="${y}" r="4" fill="#a2a793"/>`;
    d+=text(553,390,'Enclosed variable capacitor',19,'text-anchor="middle"')+text(553,416,'20–280 pF AM section',14,'text-anchor="middle"');
    if(step>=3){
      d+=net('tp1',path('M151 151V72H445V351H511V334')+dot(445,72)+text(463,77,'TP1',17));
      d+=net('gnd',path('M251 344V455H553V334',ink,'stroke-dasharray="7 4"')+dot(445,455)+text(463,482,'Receiver GND',16));
    }
    d+=text(553,355,'Example pair only; verify AM / common',12,'text-anchor="middle" fill="#a44d29"');
  }else{
    d+=path('M151 151V92H90M251 344v110h65');
    d+=text(350,201,'Keep each turn beside the last.',18)+text(350,232,'No crossing or overlapping turns.',16)+text(350,283,'Strip only the two ends.',18)+text(350,314,'Expose ≈10 mm of clean copper.',16);
  }
  return wrap('Coil and variable capacitor connections',d,760,510);
}
function wrap(title,body,w,h){return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}" xmlns="http://www.w3.org/2000/svg"><g class="diagram-text">${body}</g></svg>`;}
export function highlightNode(node){document.querySelectorAll('[data-net]').forEach(el=>el.classList.toggle('wire-dim',node!=='all'&&el.dataset.net!==node));}
export function wiringDescription(step,node){
  if(node==='tp1')return 'TP1: one coil end + one AM terminal + the diode anode (d9). These points belong to the same receiver node.';
  if(node==='tp3')return step<4?'TP3 is added with the detector in step 04. It is a separate node from TP1.':'TP3: the diode cathode at d17, the resistor at e17 and the capacitor at d25. The b17–b25 jumper joins the two strips.';
  if(node==='gnd')return 'Receiver GND: tank return + resistor return + capacitor return. The generator/test-loop return has no direct wire to this node.';
  return step<4?'The capacitor’s terminal positions are representative. Identify AM and common on the supplied part; do not use this drawing as its pinout.':'Example holes match the assembly. Solid copper lines identify signal connections; dashed graphite lines identify receiver GND. The source loop uses its own return.';
}
