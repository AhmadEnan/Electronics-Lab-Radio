import * as THREE from '../vendor/three.module.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { Bench } from './models.js';

const BOXES = {
  1:[[-10.6,0,-3.6],[-4.4,7.3,1.8]],
  2:[[-10.5,0,-3.6],[-4.4,10.1,1.8]],
  3:[[-10.5,0,-3.6],[-4.4,10.1,1.8]],
  4:[[0.4,0.4,-1.6],[8.8,3,4]],
  5:[[-11,0,-4],[9,10,5]],
  6:[[-19,0,-5],[9,10,8]],
  7:[[-19,0,-9],[15,10,8]],
  8:[[-19,0,-9],[15,10,11]],
};
const LABELS = {
  1:[['coil','75 turns / 25 mm'],['coil','Ø 50 mm former']],
  2:[['capKnob','Threaded tuning shaft'],['tankTop','AM pair: verify on part']],
  3:[['tankTop','TP1 / example AM lug'],['tankBottom','GND / example common']],
  4:[['diodeBand','Cathode band → TP3'],['load','15 kΩ ∥ 3.3 nF']],
  5:[['tp1','TP1 / diode anode'],['groundRail','Receiver GND']],
  6:[['loop','Source loop / own return'],['coil','Receiver / isolated']],
  7:[['probeTip','×10 tip → TP1'],['groundRail','Probe ground → GND']],
  8:[['tp3','TP3 / detector output'],['dmm','DMM / DC volts']],
};

export class RadioScene {
  constructor(canvas, {onPart=()=>{}, onReady=()=>{}, onProgress=()=>{}, BenchClass=Bench, boxes=BOXES, labels=LABELS}={}) {
    this.boxes=boxes;this.labelDefinitions=labels;
    this.canvas=canvas;this.stage=canvas.parentElement;
    this.onPart=onPart;this.onReady=onReady;this.onProgress=onProgress;
    this.labels=document.getElementById('callouts');this.leaders=document.getElementById('leaders');
    this.motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
    this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});
    this.renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio||1,1.5),2));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.98;
    this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.camera=new THREE.PerspectiveCamera(32,1,.1,250);
    this.controls=new OrbitControls(this.camera,canvas);
    this.controls.enableDamping=false;this.controls.enablePan=false;
    this.controls.minDistance=2;this.controls.maxDistance=160;
    this.controls.minPolarAngle=.01;this.controls.maxPolarAngle=Math.PI*.49;
    this.controls.rotateSpeed=.7;this.controls.zoomSpeed=.8;
    this.bench=new BenchClass(this.renderer);
    this.step=1;this.labelsOn=true;this.playing=false;this.visible=false;this.enabled=true;
    this.frameCount=0;this.raf=0;this.last=0;this.ready=false;this.top=false;
    this.controls.addEventListener('change',()=>this.invalidate());
    this.observer=new IntersectionObserver(entries=>{
      this.visible=entries[0].isIntersecting;
      if(this.visible){this.last=0;this.invalidate();}else this.cancelFrame();
    },{threshold:0});this.observer.observe(this.stage);
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(this.stage);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancelFrame();else{this.last=0;this.invalidate();}});
    this.motionQuery.addEventListener('change',()=>{this.playing=false;this.onProgress(this.progress,false);this.invalidate();});
    this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
    canvas.addEventListener('pointerdown',e=>{this.down=[e.clientX,e.clientY];});
    canvas.addEventListener('pointerup',e=>{
      if(!this.down||Math.hypot(e.clientX-this.down[0],e.clientY-this.down[1])>5)return;
      const r=canvas.getBoundingClientRect();this.pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hit=this.raycaster.intersectObjects(this.bench.pickables).find(h=>this.isVisible(h.object));
      if(hit)this.onPart(hit.object.userData.part);
    });
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key))return;
      e.preventDefault();
      if(e.key==='Home')return this.resetView();
      if(['+','=','-'].includes(e.key))return this.zoom(e.key==='-'?1.16:.86);
      const offset=this.camera.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(offset);
      s.theta+=(e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0);
      s.phi=THREE.MathUtils.clamp(s.phi+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0),.02,1.53);
      this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();this.invalidate();
    });
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.cancelFrame();document.getElementById('scene-error').hidden=false;});
    canvas.addEventListener('webglcontextrestored',()=>{document.getElementById('scene-error').hidden=true;this.invalidate();});
    this.setStep(1);this.resize();
  }
  isVisible(object){for(let o=object;o;o=o.parent)if(!o.visible)return false;return true;}
  get progress(){return Math.min(1,this.bench.animation.elapsed/this.bench.animation.duration);}
  setStep(step){
    this.step=step;this.playing=false;this.top=false;
    this.bench.setStep(step,true);this.bench.paused=true;
    // Remove unused tools from the close-up, preserving only useful geometry.
    this.bench.spoolGroup.visible=false;this.bench.toolsGroup.visible=false;
    this.makeLabels();this.resetView();this.onProgress(1,false);this.invalidate();
  }
  resize(){
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight;if(!w||!h)return;
    const selected=this.bench.selected,node=this.bench.activeNode;
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
    if(selected)this.focusPart(selected);else{this.resetView(this.top);if(node&&node!=='all')this.bench.highlightNode?.(node);}
  }
  fit(box,direction){
    const target=box.getCenter(new THREE.Vector3());direction.normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right);
    const tv=Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2)),th=tv*this.camera.aspect;
    let distance=0;
    for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
      const v=new THREE.Vector3(x,y,z).sub(target);
      distance=Math.max(distance,Math.abs(v.dot(right))/th+v.dot(direction),Math.abs(v.dot(up))/tv+v.dot(direction));
    }
    this.controls.maxDistance=Math.max(160,distance*2);
    this.camera.position.copy(target).addScaledVector(direction,distance*1.12);
    this.controls.target.copy(target);this.controls.update();this.invalidate();
  }
  resetView(top=false){
    this.bench.clearFocus?.();if(this.annotations)this.makeLabels();this.top=top;const bounds=this.boxes[this.step];
    const box=new THREE.Box3(new THREE.Vector3(...bounds[0]),new THREE.Vector3(...bounds[1]));
    if(this.progress<1&&[2,4].includes(this.step))box.max.y+=3;
    this.fit(box,top?new THREE.Vector3(0,1,.015):new THREE.Vector3(...(this.bench.viewDirection || (this.step===4?[.15,1.7,1]:[.6,.65,1.4]))));
  }
  focusPart(id){
    const b=this.bench;
    const part=b.parts?.[id] || {coil:b.coilGroup,pipe:b.pipeGroup,capacitor:b.capGroup,diode:b.detectorParts[0],resistor:b.detectorParts[1],ceramic:b.detectorParts[2],board:b.boardGroup,loop:b.loopGroup,generator:b.generatorGroup,scope:b.scopeGroup,probe:b.probeGroup,dmm:b.dmmGroup}[id];
    if(!part||!this.isVisible(part))return;
    this.scrub(1);b.inspect?.(id);b.root.updateMatrixWorld(true);
    const custom=b.focusBounds?.(id)||b.focusBoxes?.[id];
    if(b.annotationsFor)this.makeLabels(b.annotationsFor(id));
    this.fit(custom?new THREE.Box3(new THREE.Vector3(...custom[0]),new THREE.Vector3(...custom[1])):new THREE.Box3().setFromObject(part),new THREE.Vector3(...(b.focusDirection?.(id)||[.15,1.1,1.5])));
  }
  zoom(factor){const offset=this.camera.position.clone().sub(this.controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,2,this.controls.maxDistance));this.camera.position.copy(this.controls.target).add(offset);this.controls.update();this.invalidate();}
  setLabels(on){this.bench.setLabels?.(on);this.labelsOn=on;this.labels.hidden=!on;this.leaders.hidden=!on;this.invalidate();}
  setEnabled(enabled){this.enabled=enabled;if(enabled){this.last=0;this.resize();this.invalidate();}else this.cancelFrame();}
  scrub(fraction){this.playing=false;this.bench.paused=true;this.bench.animation.elapsed=Math.max(0,Math.min(1,fraction))*this.bench.animation.duration;this.bench._animateStep();this.bench._drawScope();this.bench._drawDmm();this.onProgress(this.progress,false);this.invalidate();}
  togglePlay(){
    if(this.playing){this.playing=false;this.onProgress(this.progress,false);return;}
    if(this.progress>=1)this.scrub(0);
    this.playing=true;this.last=0;this.resetView(this.top);this.onProgress(this.progress,true);this.invalidate();
  }
  cancelFrame(){if(this.raf)cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
  invalidate(){if(!this.raf&&this.enabled&&this.visible&&!document.hidden)this.raf=requestAnimationFrame(t=>this.render(t));}
  render(now){
    this.raf=0;if(!this.enabled||!this.visible||document.hidden)return;
    if(this.playing){
      const dt=this.last?Math.min((now-this.last)/1000,.05):0;this.last=now;
      this.bench.animation.elapsed=Math.min(this.bench.animation.duration,this.bench.animation.elapsed+dt);
      this.bench._animateStep();this.playing=this.progress<1;
      this.onProgress(this.progress,this.playing);
      if(!this.playing)this.resetView(this.top);
    }
    this.renderer.render(this.bench.scene,this.camera);this.frameCount++;this.positionLabels();
    if(!this.ready){this.ready=true;this.onReady();}
    if(this.playing)this.invalidate();
  }
  makeLabels(definitions=this.labelDefinitions[this.step]){
    this.labels.replaceChildren();this.leaders.replaceChildren();this.annotations=[];
    for(const [i,[anchor,text]] of definitions.entries()){
      const el=document.createElement('span');el.className='model-label';el.textContent=text;this.labels.append(el);
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('fill','none');path.setAttribute('stroke','#92988d');path.setAttribute('stroke-width','1');
      const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('r','2.5');dot.setAttribute('fill','#a44d29');this.leaders.append(path,dot);
      this.annotations.push({anchor,el,path,dot,i});
    }
  }
  positionLabels(){
    if(!this.labelsOn)return;
    const rect=this.stage.getBoundingClientRect(),cr=this.canvas.getBoundingClientRect();this.leaders.setAttribute('viewBox',`0 0 ${rect.width} ${rect.height}`);
    for(const a of this.annotations){
      const anchor=this.bench.anchors[a.anchor];if(!anchor)continue;
      const point=anchor.getWorldPosition(new THREE.Vector3());
      if(!this.bench.annotationsFor&&this.step===1&&a.i===1)point.z+=2.5;
      point.project(this.camera);
      const x=cr.left-rect.left+(point.x+1)*cr.width/2,y=cr.top-rect.top+(1-point.y)*cr.height/2;
      const visible=point.z<1&&x>=0&&x<=rect.width&&y>=0&&y<=rect.height;
      a.el.hidden=!visible;a.path.style.display=a.dot.style.display=visible?'':'none';if(!visible)continue;
      const three=this.annotations.length===3,left=a.i===0||(three&&a.i===1)?18:Math.max(18,rect.width-a.el.offsetWidth-18),top=a.i===0||(three&&a.i===2)?58:rect.height-135;
      a.el.style.left=`${left}px`;a.el.style.top=`${top}px`;
      const sx=left+a.el.offsetWidth/2,sy=top+(a.i===0?a.el.offsetHeight:0);
      a.path.setAttribute('d',`M${sx},${sy} L${sx},${(sy+y)/2} L${x},${y}`);a.dot.setAttribute('cx',x);a.dot.setAttribute('cy',y);
    }
  }
}
