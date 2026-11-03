import * as T from '../vendor/three.module.js';
import {rounded,cyl,box,tube,canvasTexture,makeEnvironment,createMaterials,tagPart} from './lib.js';
import {COMPONENTS,JUMPERS,NODES,point,component} from './m2-circuit.js';
const V=p=>new T.Vector3(...p);
export const BOXES=Object.fromEntries(Array.from({length:8},(_,i)=>[i+1,i===4||i===7?[[-32,0,-3.5],[9,9,5]]:[[-8.6,0,-2.9],[8.6,3.3,2.9]]]));
export const LABELS={1:[['base1','Q1 base / row 15'],['collector2','TP2 / row 39']],2:[['d1','D1 · 1N5819 / band → R0'],['c0','C0 · 10 µF / stripe → GND']],3:[['q1','Q1 · 2N3904 / E–B–C'],['q2','Q2 · 2N3904 / C = TP2']],4:[['d2','D2 · 1N4148 / band → LEVEL'],['cout','Co · 1 µF / LEVEL → OUT']],5:[['coil','L1 · 75 copper turns'],['link','L2 · 6 blue turns / separated view']],6:[['q2','TP2 · Q2 collector / ×10 tip'],['ground','Common GND / probe return']],7:[['pot','P1 · 1 kΩ / RF gain'],['d2','D2 cathode / TP3 = LEVEL']],8:[['coil','L1 · tuned primary'],['link','L2 · secondary to IN / GND']]};

export class M2Bench {
 constructor(renderer){
  this.viewDirection=[.08,1.7,1.35];this.focusBoxes={};this.coilsSeparated=true;this.activeNode='all';this.selected=null;this.showPartLabels=true;
  this.scene=new T.Scene();this.scene.environment=makeEnvironment(renderer);this.root=new T.Group();this.scene.add(this.root);this.m=createMaterials();
  this.nodeMaterials=Object.fromEntries(Object.entries(NODES).map(([id,n])=>[id,new T.MeshStandardMaterial({color:n.color,roughness:.55})]));
  this.blue=new T.MeshStandardMaterial({color:0x246b99,roughness:.42});this.parts={};this.anchors={};this.pickables=[];this.groups=[];this.animation={elapsed:6,duration:6};this.spoolGroup=new T.Group();this.toolsGroup=new T.Group();this.detectorParts=[];
  this.scene.add(new T.HemisphereLight(0xffffff,0x777a69,1.65));const light=new T.DirectionalLight(0xfff7e8,2.4);light.position.set(-4,22,12);light.castShadow=true;light.shadow.mapSize.set(2048,2048);Object.assign(light.shadow.camera,{left:-38,right:22,top:20,bottom:-20});this.scene.add(light);
  const plane=new T.Mesh(new T.PlaneGeometry(120,90),new T.ShadowMaterial({opacity:.12}));plane.rotation.x=-Math.PI/2;plane.position.y=-.02;plane.receiveShadow=true;this.scene.add(plane);
  this.board();for(const c of COMPONENTS.filter(c=>c.type!=='coil'))this.build(c);this.jumpers();this.tank();
  this.anchor('base1',point({row:15,col:3}));this.anchor('collector2',point({row:39,col:3}));this.anchor('ground',point({row:41,rail:'gnd'}));
  this.root.traverse(o=>{if(o.isMesh||o.isSprite){if(o.material)o.material=o.material.clone();if(o.userData.part)this.pickables.push(o);}});this.setStep(1);
 }
 group(id,from){const g=new T.Group();g.userData.from=from;g.userData.id=id;this.root.add(g);this.groups.push(g);if(id)this.parts[id]=g;return g;}
 anchor(id,p,parent=this.root){const o=new T.Object3D();o.position.set(...p);parent.add(o);this.anchors[id]=o;}
 label(g,text,p,w=1.1){const map=canvasTexture(512,128,(c,a,b)=>{c.fillStyle='#f7f7f2';c.fillRect(0,0,a,b);c.fillStyle='#28302e';c.font='600 84px Barlow';c.textAlign='center';c.textBaseline='middle';c.translate(a/2,b/2);c.scale(Math.min(7,470/c.measureText(text).width),1);c.fillText(text,0,0);});const s=new T.Sprite(new T.SpriteMaterial({map,depthTest:false,transparent:true}));s.scale.set(w,w/4,1);s.position.set(...p);s.userData.label=true;g.add(s);return s;}
 wire(g,points,node,r=.033){const mesh=tube(points,r,this.nodeMaterials[node]||this.m.silver,Math.max(24,points.length*5),8);mesh.userData.node=node;g.add(mesh);return mesh;}
 lead(g,p,to,node){const pin=[p[0],.58,p[2]];this.wire(g,[p,pin],null,.022);this.wire(g,[pin,[p[0],to[1],p[2]],to],node,.027);}
 dot(g,p,node){const m=new T.Mesh(new T.SphereGeometry(.067,12,8),this.nodeMaterials[node]);m.position.set(p[0],.51,p[2]);m.userData.node=node;g.add(m);}
 board(){const g=this.group('board',1);const body=rounded(16.9,.45,5.6,.12,this.m.breadboard);body.position.y=.225;g.add(body);const slot=box(16.1,.008,.30,this.m.hole);slot.position.y=.455;g.add(slot);
  const holes=new T.InstancedMesh(new T.BoxGeometry(.105,.018,.105),this.m.hole,63*10+4*60);let n=0;const matrix=new T.Matrix4();for(let row=1;row<=63;row++)for(let col=0;col<10;col++){const p=point({row,col});matrix.makeTranslation(p[0],.46,p[2]);holes.setMatrixAt(n++,matrix);}for(let row=1;row<=60;row++)for(const z of [-2.35,-2.05,2.05,2.35]){matrix.makeTranslation(point({row,col:0})[0],.46,z);holes.setMatrixAt(n++,matrix);}g.add(holes);
  for(const z of [-2.5,2.5])for(const side of [-1,1]){const stripe=box(7.2,.008,.025,z<0?this.nodeMaterials.vr:this.nodeMaterials.gnd);stripe.position.set(side*4.1,.463,z);g.add(stripe);}
  for(let row=5;row<=60;row+=5)this.label(g,String(row),[point({row,col:0})[0],.49,1.72],.25);
  for(const [text,x] of [['IN',-7.3],['Q1',-4.3],['Q2',1.5],['LEVEL',5.1],['OUT',6.5]])this.label(g,text,[x,.49,-2.72],text==='LEVEL'?.9:.6);
  this.addStrips(g);this.label(g,'VR / + rail',[-.7,.49,-2.62],1.5);this.label(g,'GND rail',[-.7,.49,2.65],1.3);tagPart(g,'board');
 }
 addStrips(g){const used=new Set();for(const c of COMPONENTS)for(const t of c.terminals){if(!t.p)continue;const p=t.p,key=p.rail||`${p.row}-${p.col<5?'upper':'lower'}`;if(used.has(key))continue;used.add(key);const center=point(p),strip=box(p.rail?16:.16,.012,p.rail?.16:1.2,new T.MeshBasicMaterial({color:NODES[t.node].color,transparent:true,opacity:.2,depthWrite:false}));strip.position.set(p.rail?0:center[0],.486,p.rail?center[2]:p.col<5?-.892:.892);strip.userData.strip=t.node;strip.visible=false;g.add(strip);}}
 build(c){const g=this.group(c.id,c.from);const pins=c.terminals.map(t=>point(t.p));const mid=V(pins[0]).lerp(V(pins.at(-1)),.5);mid.y=.96;
  if(c.type==='transistor')this.transistor(g,c,pins,mid);else if(c.type==='pot')this.pot(g,c,pins,mid);else if(c.type==='resistor'||c.type==='diode')this.axial(g,c,pins,mid);else this.capacitor(g,c,pins,mid);
  this.anchor(c.id,mid.toArray());c.terminals.forEach((t,i)=>{this.anchor(`${c.id}-${i}`,pins[i]);this.dot(g,pins[i],t.node);});tagPart(g,c.id);
 }
 axial(g,c,pins,mid){const axis=V(pins[1]).sub(V(pins[0])).normalize(),resistor=c.type==='resistor',length=resistor?.52:.5,rad=resistor?.10:c.id==='d1'?.11:.075;
  const body=cyl(rad,rad,length,32,resistor?this.m.resistorBody:c.id==='d1'?this.m.blackGloss:this.m.glassAmber);body.position.copy(mid);body.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),axis);g.add(body);
  for(const [i,color] of (resistor?c.bands:[c.id==='d1'?0xd5d4cb:0x202527]).entries()){const band=cyl(rad+.003,rad+.003,resistor?.046:.075,24,new T.MeshStandardMaterial({color}));band.quaternion.copy(body.quaternion);band.position.copy(mid).addScaledVector(axis,resistor?[-.17,-.065,.045,.18][i]:.16);g.add(band);}
  c.terminals.forEach((t,i)=>this.lead(g,pins[i],mid.clone().addScaledVector(axis,(i?1:-1)*length/2).toArray(),t.node));this.label(g,`${c.ref} · ${c.value}`,[mid.x,mid.y+(c.id.startsWith('rf')?.40:.28),mid.z],c.id.startsWith('rf')?1.25:1.15);
 }
 capacitor(g,c,pins,mid){const electro=c.type==='electrolytic';mid.y=electro?1.12:.87;const body=electro?cyl(.19,.19,.85,32,this.m.blackGloss):rounded(.40,.40,.16,.045,this.m.ceramic);body.position.copy(mid);g.add(body);const axis=V(pins[1]).sub(V(pins[0])).normalize();
  c.terminals.forEach((t,i)=>this.lead(g,pins[i],[mid.x+axis.x*(i?1:-1)*.11,mid.y-.2,mid.z+axis.z*(i?1:-1)*.11],t.node));
  if(electro){const lid=cyl(.178,.178,.018,32,this.m.silver);lid.position.set(mid.x,mid.y+.43,mid.z);g.add(lid);const stripe=box(.085,.68,.015,this.m.ivory);stripe.rotation.y=Math.atan2(axis.x,axis.z);stripe.position.set(mid.x+axis.x*.19,mid.y,mid.z+axis.z*.19);g.add(stripe);this.label(g,'−',[mid.x+axis.x*.3,mid.y+.18,mid.z+axis.z*.3],.18);}
  this.label(g,`${c.ref} · ${c.value}`,[mid.x,mid.y+(electro?.67:.42),mid.z],1.2);
 }
 transistor(g,c,pins,mid){const x=pins[1][0],z=pins[1][2];const shape=new T.Shape();shape.moveTo(-.23,0);shape.lineTo(.23,0);shape.absarc(0,0,.23,0,Math.PI,false);shape.closePath();const body=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.45,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:32}),this.m.blackGloss);body.rotation.x=-Math.PI/2;body.position.set(x,1.15,z);g.add(body);
  c.terminals.forEach((t,i)=>{this.lead(g,pins[i],[x+(i-1)*.15,1.23,z],t.node);this.label(g,t.name[0],[pins[i][0],.64,z+.44],.18);});mid.set(x,1.4,z);this.label(g,c.ref+' · 2N3904',[x,1.94,z],1.4);this.focusBoxes[c.id]=[[x-1,.25,-2.5],[x+1.05,2.2,2.6]];
 }
 pot(g,c,pins,mid){mid.set(pins[1][0],.96,pins[1][2]);const body=rounded(.75,.63,.60,.07,this.blue);body.position.copy(mid);g.add(body);const screw=cyl(.19,.19,.06,32,this.m.brass);screw.position.set(mid.x,1.31,mid.z);g.add(screw);const slit=box(.28,.01,.03,this.m.black);slit.position.set(mid.x,1.345,mid.z);g.add(slit);c.terminals.forEach((t,i)=>this.lead(g,pins[i],[mid.x+(i-1)*.254,.8,mid.z],t.node));this.label(g,'P1 · 1 kΩ',[mid.x,1.62,mid.z],1.2);}
 jumpers(){for(const [node,a,b,from] of JUMPERS){const g=this.group(null,from);g.userData.node=node;const A=point(a),B=point(b);this.wire(g,[A,[A[0],.65,A[2]],[B[0],.65,B[2]],B],node,.037);this.dot(g,A,node);this.dot(g,B,node);}}
 tank(){const g=this.group('coil',5),x=-28,y=3.05;this.tankX=x;this.tankY=y;
  const shell=new T.Mesh(new T.CylinderGeometry(2.48,2.48,7.4,96,1,true),new T.MeshStandardMaterial({color:0xe7e4d7,side:T.DoubleSide,roughness:.7,transparent:true,opacity:.72}));shell.rotation.x=Math.PI/2;shell.position.set(x,y,.9);g.add(shell);for(const z of [-2.8,4.6]){const rim=new T.Mesh(new T.TorusGeometry(2.48,.055,12,96),this.m.pvcEdge);rim.position.set(x,y,z);g.add(rim);}
  const pts=[];for(let i=0;i<=75*64;i++){const t=i/(75*64),a=t*75*Math.PI*2;pts.push([x+Math.cos(a)*2.52,y+Math.sin(a)*2.52,-1.25+t*2.5]);}this.primary=tube(pts,.025,this.m.copper,4800,8);g.add(this.primary);this.label(g,'L1 · 75 turns / COPPER',[x,y+3.1,-.8],4.4);
  const cap=rounded(2.1,1.7,2.1,.12,this.m.ivory);cap.position.set(x,6.5,-.1);g.add(cap);const shaft=cyl(.18,.18,.8,32,this.m.brass);shaft.position.set(x,7.75,-.1);g.add(shaft);this.label(g,'20–280 pF',[x,8.4,-.1],2.3);
  this.wire(g,[[x+2.52,y,-1.25],[x+2.8,5,-1.25],[x+.8,5.7,-.7]],'tp1');this.wire(g,[[x+2.52,y,1.25],[x+2.8,5,1.25],[x+.8,5.7,.7]],'gnd');tagPart(g,'coil');this.anchor('coil',[x,y+2.6,-.7]);
  const l=this.group('link',5);this.linkWinding=new T.Group();l.add(this.linkWinding);this.linkWires=new T.Group();l.add(this.linkWires);this.anchor('link',[x,y+2.6,2.9]);this.focusBoxes.coil=[[-31,0,-3],[-25,8.7,4.8]];this.focusBoxes.link=this.focusBoxes.coil;this.setCoilsSeparated(true);
 }
 setCoilsSeparated(separated){this.coilsSeparated=separated;const x=this.tankX,y=this.tankY,start=separated?2.3:.43,r=2.65,pts=[];
  for(const holder of [this.linkWinding,this.linkWires]){holder.traverse(o=>o.geometry?.dispose());holder.clear();}
  for(let i=0;i<=6*96;i++){const t=i/(6*96),a=t*6*Math.PI*2;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r,start+t*.82]);}this.secondary=tube(pts,.065,this.blue,576,12);this.linkWinding.add(this.secondary);this.label(this.linkWinding,'L2 · 6 turns / BLUE',[x,y+1.3,start+1.8],4.2);
  for(let j=0;j<2;j++){const end=j?pts.at(-1):pts[0],points=[end,[x+3.2,1.1,start+j*.2]];for(let k=0;k<=180;k++){const t=k/180,a=t*18*Math.PI+j*Math.PI;points.push([x+3.2+t*19,.82+.085*Math.cos(a),.9+.085*Math.sin(a)]);}points.push(j?point({row:3,rail:'gnd'}):point({row:3,col:6}));this.wire(this.linkWires,points,j?'gnd':'in',.045);}
  this.wire(this.linkWires,[[x+.8,5.7,.7],[x+3,4,1.25],[x+3.2,1.1,start+.2]],'gnd',.035);
  this.anchors.link.position.set(x,y+2.6,start+.4);tagPart(this.parts.link,'link');
  if(this.pickables?.length){this.pickables=this.pickables.filter(o=>o.userData.part!=='link');this.parts.link.traverse(o=>{if(o.isMesh||o.isSprite){o.material=o.material.clone();this.pickables.push(o);}});this.applyHighlight();}
 }
 setLabels(on){this.showPartLabels=on;this.applyHighlight();}
 setStep(step){this.step=step;this.selected=null;this.activeNode='all';this.animation.elapsed=this.animation.duration;this._animateStep();}
 _animateStep(){const t=this.animation.elapsed/this.animation.duration;for(const g of this.groups){g.visible=g.userData.from<=this.step;const local=Math.max(0,Math.min(1,t*1.4-(g.userData.from-1)*.06));g.position.y=g.userData.from===this.step?2*(1-local)**3:0;}this.applyHighlight();}
 inspect(id){this.selected=id;this.activeNode='all';this.applyHighlight();}
 highlightNode(node){this.selected=null;this.activeNode=node;this.applyHighlight();}
 clearFocus(){this.selected=null;this.activeNode='all';this.applyHighlight();}
 applyHighlight(){const chosen=component(this.selected),nodes=chosen?new Set(chosen.terminals.map(t=>t.node)):this.activeNode!=='all'?new Set([this.activeNode]):null;
  for(const g of this.groups)g.traverse(o=>{if(!o.material||o.isInstancedMesh)return;if(o.userData.strip){o.visible=!!nodes?.has(o.userData.strip);return;}const id=g.userData.id,own=id===this.selected||(['coil','link'].includes(this.selected)&&['coil','link'].includes(id)),relevant=!nodes||id==='board'||own||o.userData.node&&nodes.has(o.userData.node);o.material.transparent=!relevant||o.isSprite;o.material.opacity=relevant?1:.14;o.material.depthWrite=relevant&&!o.isSprite;if(o.userData.label)o.visible=this.showPartLabels&&(!nodes||own||id==='board');});
 }
 annotationsFor(id){const c=component(id);if(!c)return LABELS[this.step];if(c.type==='coil')return [['coil','L1 · 75-turn copper primary'],['link',this.coilsSeparated?'L2 · 6-turn blue link / separated':'L2 · 6-turn link / over GND end']];return c.terminals.map((t,i)=>[`${id}-${i}`,`${c.ref} ${t.name} → ${NODES[t.node].name}`]);}
 focusDirection(id){return ['coil','link'].includes(id)?[1.7,1.1,.8]:[.15,1.1,1.5];}
 focusBounds(id){if(id==='board')return BOXES[this.step];if(this.focusBoxes[id])return this.focusBoxes[id];const c=component(id);if(!c)return null;const pts=c.terminals.filter(t=>t.p).map(t=>point(t.p));return [[Math.min(...pts.map(p=>p[0]))-.8,.1,Math.min(...pts.map(p=>p[2]))-.6],[Math.max(...pts.map(p=>p[0]))+.8,2.4,Math.max(...pts.map(p=>p[2]))+.6]];}
 setTuning(){} _drawScope(){} _drawDmm(){}
}
