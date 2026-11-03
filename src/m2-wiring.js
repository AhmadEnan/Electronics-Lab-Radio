import {COMPONENTS,JUMPERS,NODES,available,component,location} from './m2-circuit.js';
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const X=row=>60+(row-1)*16;
const Y=p=>p.rail?(p.rail==='gnd'?420:92):[155,173,191,209,227,285,303,321,339,357][p.col];
const P=p=>[X(p.row),Y(p)];
const text=(x,y,t,cls='map-text',extra='')=>`<text x="${x}" y="${y}" class="${cls}" ${extra}>${esc(t)}</text>`;
const line=(a,b,color,width=3,extra='')=>`<path d="M${a[0]} ${a[1]} L${b[0]} ${b[1]}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" ${extra}/>`;
const net=(id,body)=>`<g class="wire-net" data-net="${id}" style="--net:${NODES[id].color}">${body}</g>`;
const dot=(p,id)=>`<circle cx="${p[0]}" cy="${p[1]}" r="5.5" fill="${NODES[id].color}" stroke="#f7f7f2" stroke-width="1.4"/>`;
const SECTIONS={all:'0 0 1120 470',supply:'15 35 340 410',q1:'190 40 340 410',q2:'535 40 330 410',detector:'625 35 480 410'};

export function wiringSVG(step,{section='all',selected=null}={}){
 if(section==='tank')return tankSVG();
 const parts=available(step===1?4:step).filter(c=>c.type!=='coil');let board=`<rect x="25" y="70" width="1050" height="370" rx="8" fill="#eceee6" stroke="#b8c1b3"/>`;
 board+=`<rect x="35" y="246" width="1030" height="20" rx="5" fill="#d4d9cd"/>`;
 for(let row=1;row<=63;row++){if(row%5===0||row===1||row===63)board+=text(X(row),133,String(row),'map-number','text-anchor="middle"');for(let col=0;col<10;col++)board+=`<circle cx="${X(row)}" cy="${Y({row,col})}" r="2.6" fill="#a2aa9b"/>`;for(const y of [92,110,402,420])board+=`<circle cx="${X(row)}" cy="${y}" r="2.5" fill="#9ca596"/>`;}
 for(let col=0;col<10;col++)board+=text(12,Y({col})+4,'abcdefghij'[col],'map-number');
 board+=line([50,80],[545,80],NODES.vr.color,1.5)+line([573,80],[1060,80],NODES.vr.color,1.5)+line([50,430],[545,430],NODES.gnd.color,1.5)+line([573,430],[1060,430],NODES.gnd.color,1.5);
 board+=text(62,57,'VR · after D1 + 220 Ω','map-label')+text(62,463,'GND · common return','map-label')+text(553,457,'rail breaks → bridge both','map-note','text-anchor="middle"');
 let strips='';const used=new Set();for(const c of parts)for(const t of c.terminals){if(t.p.rail)continue;const key=`${t.p.row}-${t.p.col<5?'upper':'lower'}`;if(used.has(key))continue;used.add(key);strips+=net(t.node,`<rect x="${X(t.p.row)-6}" y="${t.p.col<5?147:277}" width="12" height="88" rx="5" fill="${NODES[t.node].color}" opacity=".15"/>`);}
 let jumpers='';for(const [id,a,b,from] of JUMPERS){if(from>(step===1?4:step))continue;const A=P(a),B=P(b);jumpers+=net(id,line(A,B,NODES[id].color,3,'class="map-jumper"')+dot(A,id)+dot(B,id));}
 const components=parts.map(c=>drawPart(c)).join('');
 const regions=[['Supply & input',80,330],['Q1',270,520],['Q2 / TP2',600,770],['Detector → OUT',800,1050]];
 const headings=regions.map(([name,a,b])=>text((a+b)/2,24,name,'map-heading','text-anchor="middle"')).join('');
 return `<svg id="m2-board-map" class="m2-map" viewBox="${SECTIONS[section]||SECTIONS.all}" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Interactive M2 breadboard. Select a component to trace its terminals. Use the component buttons for keyboard and screen-reader navigation.">${headings}${board}${strips}${jumpers}${components}</svg><p class="map-hint">Click a part or use the component list. Coloured strips show connected holes; the centre channel separates a–e from f–j. ${step===1?'Preview of the planned board.':''}</p>`;
}
function drawPart(c){const pins=c.terminals.map(t=>P(t.p));let body='',traces='';let mid=[(pins[0][0]+pins.at(-1)[0])/2,(pins[0][1]+pins.at(-1)[1])/2];
 if(c.type==='transistor'){mid=[pins[1][0],260];body=`<rect x="${mid[0]-23}" y="244" width="46" height="28" rx="6" fill="#303a37"/>`+text(mid[0],263,c.ref,'map-transistor','text-anchor="middle"');c.terminals.forEach((t,i)=>{traces+=net(t.node,line(pins[i],[mid[0]+(i-1)*16,244],NODES[t.node].color,3)+dot(pins[i],t.node));body+=text(pins[i][0],238,t.name[0],'map-pin','text-anchor="middle"');});
 }else if(c.type==='pot'){mid=[pins[1][0],365];body=`<rect x="${mid[0]-27}" y="351" width="54" height="30" rx="4" fill="#d8e7eb" stroke="#246b99" stroke-width="2"/><circle cx="${mid[0]}" cy="366" r="9" fill="#b99a59"/>`+line([mid[0]-6,366],[mid[0]+6,366],'#35433e',2);c.terminals.forEach((t,i)=>traces+=net(t.node,line(pins[i],[mid[0]+(i-1)*16,351],NODES[t.node].color,3)+dot(pins[i],t.node)));
 }else{
  if(c.id==='cin')mid[1]=260;if(c.id==='c12')mid[1]=252;if(c.id==='rf1'||c.id==='rf2')mid[1]-=22;
  const angle=Math.atan2(pins[1][1]-pins[0][1],pins[1][0]-pins[0][0]),dx=Math.cos(angle)*17,dy=Math.sin(angle)*17;
  c.terminals.forEach((t,i)=>traces+=net(t.node,line(pins[i],[mid[0]+(i?1:-1)*dx,mid[1]+(i?1:-1)*dy],NODES[t.node].color,3)+dot(pins[i],t.node)));
  let symbol='';if(c.type==='resistor')symbol='<rect x="-17" y="-7" width="34" height="14" rx="3" fill="#e5d2a7" stroke="#4b534a" stroke-width="1.5"/><path d="M-9 -7v14m8-14v14m8-14v14" stroke="#8a633d" stroke-width="3"/>';
  else if(c.type==='diode')symbol=`<rect x="-17" y="-7" width="34" height="14" rx="5" fill="${c.id==='d1'?'#39413e':'#d6a36b'}" stroke="#39413e" stroke-width="1.4"/><path d="M10 -7v14" stroke="${c.id==='d1'?'#dfdfd4':'#28302e'}" stroke-width="4"/>`;
  else symbol=`<path d="M-5 -12v24M5 -12v24" stroke="#7b572b" stroke-width="3"/>${c.type==='electrolytic'?'<text x="-16" y="-12" font-size="14" fill="#28302e">+</text>':''}`;
  body=`<g transform="translate(${mid[0]} ${mid[1]}) rotate(${angle*180/Math.PI})">${symbol}</g>`;
 }
 const labelY=c.type==='transistor'?310:c.type==='pot'?395:mid[1]-19;
 body+=text(mid[0],labelY,c.ref+' · '+c.value,'map-part-label','text-anchor="middle"');
 return `<g class="map-component" data-map-part="${c.id}" data-part-nodes="${c.terminals.map(t=>t.node).join(' ')}" role="button" tabindex="0" aria-label="${esc(c.ref+' '+c.value+'. '+c.terminals.map(t=>t.name+' to '+NODES[t.node].name).join('; '))}" aria-pressed="false"><title>${esc(c.ref+' '+c.value+' — '+c.why)}</title>${traces}<g class="map-package">${body}</g><circle cx="${mid[0]}" cy="${mid[1]}" r="22" fill="transparent" class="map-hit"/></g>`;
}
function tankSVG(){let turns='';for(let i=0;i<22;i++)turns+=`<path d="M${122+i*4} 127c-22 22-22 112 0 134" stroke="#a44d29" stroke-width="3" fill="none"/>`;let link='';for(let i=0;i<6;i++)link+=`<path d="M${310+i*12} 127c-22 22-22 112 0 134" stroke="#246b99" stroke-width="5" fill="none"/>`;
 return `<svg class="m2-map tank-map" viewBox="0 0 760 440" role="group" aria-label="Separated primary and secondary winding connection map"><rect x="78" y="118" width="330" height="152" rx="30" fill="#e6e8df" stroke="#b8c1b3"/><g class="map-component" data-map-part="coil" data-part-nodes="tp1 gnd" role="button" tabindex="0" aria-label="L1, 75-turn primary"><rect x="95" y="120" width="125" height="150" fill="transparent"/>${turns}</g><g class="map-component" data-map-part="link" data-part-nodes="in gnd" role="button" tabindex="0" aria-label="L2, six-turn blue link"><rect x="283" y="120" width="115" height="150" fill="transparent"/>${link}</g>${text(163,87,'L1 · 75 copper turns','map-heading','text-anchor="middle"')}${text(340,298,'L2 · 6 blue turns','map-heading','text-anchor="middle"')}${net('tp1',line([124,135],[45,135],NODES.tp1.color)+text(43,115,'TP1','map-label'))}${net('gnd',line([207,253],[207,330],NODES.gnd.color)+line([207,330],[520,330],NODES.gnd.color)+line([520,330],[520,290],NODES.gnd.color)+text(207,353,'Tank GND end','map-label','text-anchor="middle"'))}${net('in',line([313,140],[500,140],NODES.in.color)+line([500,140],[500,185],NODES.in.color)+line([500,185],[592,185],NODES.in.color)+text(600,190,'IN · row 3 f–j','map-label'))}${net('gnd',line([371,251],[520,251],NODES.gnd.color)+line([520,251],[520,290],NODES.gnd.color)+line([520,290],[592,290],NODES.gnd.color)+text(600,295,'GND rail','map-label'))}${text(380,390,'Separated drawing: L2 is wound over L1’s grounded end in the actual build.','map-note','text-anchor="middle"')}${text(380,416,'No wire from TP1 to IN. Keep the board ≥15 cm from the tank.','map-note','text-anchor="middle"')}</svg>`;
}
export function highlightNode(node,part=null){const nodes=part?new Set(component(part)?.terminals.map(t=>t.node)||[]):null;document.querySelectorAll('#wiring-drawing [data-net]').forEach(e=>e.classList.toggle('wire-dim',nodes?!nodes.has(e.dataset.net):node!=='all'&&e.dataset.net!==node));document.querySelectorAll('.map-component').forEach(e=>{e.setAttribute('aria-pressed',String(e.dataset.mapPart===part));e.classList.toggle('map-muted',part?e.dataset.mapPart!==part:node!=='all'&&!e.dataset.partNodes.split(' ').includes(node));});}
export function wiringDescription(step,node='all',part=null){const c=component(part);if(c)return `${c.ref} · ${c.value}: ${c.terminals.map(t=>`${t.name} → ${NODES[t.node].name}${t.p?' at '+location(t.p):''}`).join(' · ')}. ${c.why}`;return node==='all'?'Select any component to highlight its leads, connected strips and matching 3D part. Zoom into a board section to read individual holes. The map and 3D view use the same row plan.':`${NODES[node].name}: ${NODES[node].description}`;}
