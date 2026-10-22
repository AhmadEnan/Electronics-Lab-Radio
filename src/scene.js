import * as THREE from "../vendor/three.module.js";
import { OrbitControls } from "../vendor/OrbitControls.js";
import { Bench } from "./models.js";
import { STEPS } from "./steps.js";

const reduceMotion =
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class RadioScene {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.stage = canvas.closest(".stage") || canvas.parentElement;
    this.calloutLayer = document.getElementById("callouts");
    this.leaderLayer = document.getElementById("leaders");
    this.onPart = options.onPart || (() => {});
    this.onReady = options.onReady || (() => {});

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.03;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.2, 180);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.enablePan = false;
    this.controls.minDistance = 9;
    this.controls.maxDistance = 80;
    this.controls.minPolarAngle = 0.32;
    this.controls.maxPolarAngle = 1.41;
    this.controls.rotateSpeed = 0.72;
    this.controls.zoomSpeed = 0.8;

    this.bench = new Bench(this.renderer);
    this.step = 0;
    this.labelsOn = true;
    this.callouts = [];
    this.leaderNodes = [];
    this.cameraTween = null;
    this.lastPointer = { x: 0, y: 0 };
    this.dragging = false;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.hoverDirty = false;
    this._firstFrame = true;
    this._last = performance.now();

    this._bind();
    this.resize();
    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(this.stage);

    this._applyCamera(0, true);
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  _bind() {
    this.controls.addEventListener("start", () => {
      this.cameraTween = null;
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      this.dragging = true;
      this.lastPointer = { x: e.clientX, y: e.clientY };
    });
    this.canvas.addEventListener("pointerup", (e) => {
      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.dragging = false;
      if (Math.hypot(dx, dy) > 6) return;
      const part = this._pick(e);
      if (part) this.onPart(part);
    });
    this.canvas.addEventListener("pointerleave", () => {
      this.canvas.style.cursor = "grab";
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (e.buttons) {
        this.canvas.style.cursor = "grabbing";
        return;
      }
      this.canvas.style.cursor = "grab";
      this._hover(e);
    });
  }

  _pointerInfo(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _visibleChain(obj) {
    let o = obj;
    while (o) {
      if (!o.visible) return false;
      o = o.parent;
    }
    return true;
  }

  _pick(e) {
    this._pointerInfo(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.bench.pickables, false);
    for (const hit of hits) {
      if (!hit.object.userData.part) continue;
      if (!this._visibleChain(hit.object)) continue;
      return hit.object.userData.part;
    }
    return null;
  }

  _hover(e) {
    if (!this._hoverQueued) {
      this._hoverQueued = true;
      requestAnimationFrame(() => {
        this._hoverQueued = false;
        const part = this._pick(e);
        this.canvas.style.cursor = part ? "pointer" : "grab";
      });
    }
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.bench) this._applyCamera(this.step, true);
    this._updateCalloutPositions();
  }

  _responsiveScale() {
    const a = this.camera.aspect;
    if (a < 0.95) return 1.42;
    if (a < 1.25) return 1.2;
    return 1;
  }

  _applyCamera(index, instant = false) {
    const preset = STEPS[index]?.camera;
    if (!preset) return;
    const bounds = [
      [[-19,0,-9],[15,10,11]], [[-10.6,1.6,-3.6],[-4.4,7.3,1.8]],
      [[-9.5,5.5,-1.6],[-5.5,this.bench.animation.elapsed>=8?9.8:12.8,1.3]], [[-10.2,3,-3.2],[-4.8,9.8,1.5]],
      [[0.4,0.4,-1.6],[8.8,this.bench.animation.elapsed>=8?2.8:4.6,4]], [[-11,0,-4],[9,10,5]],
      [[-19,0,-5],[9,10,8]], [[0,0,-9],[15,6,5]],
      [[0,0,-2],[12,5,11]],
    ][index];
    const box = new THREE.Box3(new THREE.Vector3(...bounds[0]),new THREE.Vector3(...bounds[1]));
    const target = box.getCenter(new THREE.Vector3());
    const direction = new THREE.Vector3(...(index===4 ? [0.3,1.5,1] : index>=7 ? [0.45,1.1,1.5] : [0.7,0.65,1.4])).normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction,right);
    const tanV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2));
    const tanH = tanV*this.camera.aspect;
    let distance = 0;
    for(const x of [box.min.x,box.max.x]) for(const y of [box.min.y,box.max.y]) for(const z of [box.min.z,box.max.z]) {
      const v=new THREE.Vector3(x,y,z).sub(target);
      distance=Math.max(distance,Math.abs(v.dot(right))/tanH+v.dot(direction),Math.abs(v.dot(up))/tanV+v.dot(direction));
    }
    const pos=target.clone().addScaledVector(direction,distance*1.08);
    this.controls.maxDistance = Math.max(80,distance*1.8);

    if (instant) {
      this.camera.position.copy(pos);
      this.controls.target.copy(target);
      this.controls.update();
      this.cameraTween = null;
      return;
    }
    this.cameraTween = {
      fromPos: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPos: pos,
      toTarget: target,
      start: performance.now(),
      duration: reduceMotion ? 1 : 850,
    };
  }

  setStep(index, options = {}) {
    this.step = index;
    this.bench.setStep(index, !!options.instant || reduceMotion);
    this._applyCamera(index, !!options.instant);
    this._buildCallouts();
    if (options.instant) this._updateCalloutPositions();
  }

  resetView() {
    this._applyCamera(this.step, false);
  }

  focusPart(id) {
    const b=this.bench;
    const part={coil:b.coilGroup,pipe:b.pipeGroup,capacitor:b.capGroup,
      diode:b.detectorParts[0],resistor:b.detectorParts[1],ceramic:b.detectorParts[2],
      board:b.boardGroup,loop:b.loopGroup,scope:b.scopeGroup,dmm:b.dmmGroup,probe:b.probeGroup,
      generator:b.generatorGroup,spool:b.spoolGroup,tray:b.trayGroup}[id];
    if(!part || !this._visibleChain(part)) return;
    b.animation.elapsed=b.animation.duration;
    b._animateStep();
    part.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3().setFromObject(part);
    const target=bounds.getCenter(new THREE.Vector3());
    const size=bounds.getSize(new THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z)*0.65;
    const distance=Math.max(2.6,radius/Math.tan(THREE.MathUtils.degToRad(this.camera.fov/2))/Math.min(1,this.camera.aspect));
    const dir=new THREE.Vector3(0.3,1.1,1.5).normalize();
    this.controls.minDistance=1.5;
    this.cameraTween={fromPos:this.camera.position.clone(),fromTarget:this.controls.target.clone(),
      toPos:target.clone().addScaledVector(dir,distance),toTarget:target,start:performance.now(),duration:reduceMotion?1:700};
  }

  replay() { this.setStep(this.step); }

  togglePause() {
    this.bench.paused = !this.bench.paused;
    return this.bench.paused;
  }

  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const len = offset.length();
    const next = THREE.MathUtils.clamp(len * factor, this.controls.minDistance, this.controls.maxDistance);
    offset.setLength(next);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  setLabels(on) {
    this.labelsOn = on;
    if (!on) {
      this.calloutLayer.innerHTML = "";
      this.leaderLayer.innerHTML = "";
      this.callouts = [];
      this.leaderNodes = [];
      return;
    }
    this._buildCallouts();
    this._updateCalloutPositions();
  }

  setSignal(on) {
    this.bench.setSignal(on);
  }

  setTuning(pF) {
    return this.bench.setTuning(pF);
  }

  _buildCallouts() {
    if (!this.labelsOn) return;
    this.calloutLayer.innerHTML = "";
    this.leaderLayer.innerHTML = "";
    this.callouts = [];
    this.leaderNodes = [];

    const data = STEPS[this.step]?.callouts || [];
    data.forEach((c, i) => {
      const el = document.createElement("article");
      el.className = "callout";
      el.dataset.slot = c.slot;
      el.innerHTML = `
        <span class="callout-num">${String(this.step + 1).padStart(2, "0")} · ${String.fromCharCode(65 + i)}</span>
        <div class="callout-kicker">${c.kicker}</div>
        <div class="callout-title">${c.title}</div>
        <p class="callout-body">${c.body}</p>`;
      this.calloutLayer.appendChild(el);
      this.callouts.push({ el, anchor: c.anchor, slot: c.slot });

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#8b7c66");
      path.setAttribute("stroke-width", "1");
      path.setAttribute("stroke-dasharray", "3 4");
      path.setAttribute("opacity", "0");
      this.leaderLayer.appendChild(path);

      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute("r", "2.4");
      dot.setAttribute("fill", "#168f8d");
      dot.setAttribute("stroke", "#f4ebdb");
      dot.setAttribute("stroke-width", "1.3");
      dot.setAttribute("opacity", "0");
      this.leaderLayer.appendChild(dot);

      this.leaderNodes.push({ path, dot });

      requestAnimationFrame(() => {
        if (el.isConnected) el.classList.add("is-in");
        path.setAttribute("opacity", "0.7");
        dot.setAttribute("opacity", "1");
      });
    });
  }

  _updateCalloutPositions() {
    if(!this.stage.contains(this.calloutLayer)) return;
    if (!this.labelsOn || !this.callouts.length) return;
    const rect = this.stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.leaderLayer.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);
    this.leaderLayer.setAttribute("width", rect.width);
    this.leaderLayer.setAttribute("height", rect.height);

    const v = new THREE.Vector3();
    this.callouts.forEach((c, i) => {
      const anchor = this.bench.anchors[c.anchor];
      const nodes = this.leaderNodes[i];
      if (!anchor) {
        nodes.path.setAttribute("opacity", "0");
        nodes.dot.setAttribute("opacity", "0");
        return;
      }
      anchor.getWorldPosition(v);
      v.project(this.camera);
      const canvasRect = this.canvas.getBoundingClientRect();
      const x = canvasRect.left-rect.left+(v.x * 0.5 + 0.5) * canvasRect.width;
      const y = canvasRect.top-rect.top+(-v.y * 0.5 + 0.5) * canvasRect.height;
      const visible = v.z < 1 && x > -30 && x < rect.width + 30 && y > -20 && y < rect.height + 20;
      if (!visible) {
        nodes.path.setAttribute("opacity", "0");
        nodes.dot.setAttribute("opacity", "0");
        return;
      }

      const card = c.el.getBoundingClientRect();
      const left = card.left - rect.left;
      const top = card.top - rect.top;
      const isLeft = c.slot === "tl" || c.slot === "bl";
      const startX = isLeft ? left + card.width : left;
      const startY = top + Math.min(card.height * 0.5, 42);
      const elbowX = startX + (isLeft ? 26 : -26);

      nodes.path.setAttribute(
        "d",
        `M ${startX.toFixed(1)} ${startY.toFixed(1)} L ${elbowX.toFixed(1)} ${startY.toFixed(1)} L ${elbowX.toFixed(1)} ${y.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)}`
      );
      nodes.path.setAttribute("opacity", "0.68");
      nodes.dot.setAttribute("cx", x.toFixed(1));
      nodes.dot.setAttribute("cy", y.toFixed(1));
      nodes.dot.setAttribute("opacity", "1");
    });
  }

  _loop(now) {
    const dt = Math.min((now - this._last) / 1000, 0.05);
    this._last = now;

    if (this.cameraTween) {
      const t = THREE.MathUtils.clamp(
        (now - this.cameraTween.start) / this.cameraTween.duration,
        0,
        1
      );
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      this.camera.position.lerpVectors(
        this.cameraTween.fromPos,
        this.cameraTween.toPos,
        e
      );
      this.controls.target.lerpVectors(
        this.cameraTween.fromTarget,
        this.cameraTween.toTarget,
        e
      );
      if (t >= 1) this.cameraTween = null;
    }

    this.controls.update();
    const wasPlaying=this.bench.animation.elapsed<this.bench.animation.duration;
    this.bench.update(dt);
    if(wasPlaying && this.bench.animation.elapsed>=this.bench.animation.duration && [2,4].includes(this.step)) this._applyCamera(this.step);
    const progress = document.getElementById('animationProgress');
    const status = document.getElementById('animationStatus');
    const a = this.bench.animation;
    if (progress) progress.value = Math.min(100,a.elapsed/a.duration*100);
    if (status) {
      const descriptions = ['Inspect the kit · click a component','Winding 75 turns','Lowering the capacitor onto its mount',
        'Joining the two AM terminals','Inserting diode, resistor, then capacitor','Connecting TP1 and ground',
        'Aligning the five-turn test loop','Sweeping C past the 819 kHz source','Increasing the six source levels'];
      status.textContent = this.bench.paused ? 'Animation paused' : a.elapsed>=a.duration ? 'Step complete · replay to watch again' : descriptions[this.step];
    }
    if (this.step===7 && a.elapsed<a.duration) {
      const cap = document.getElementById('tuneRange');
      const readout = document.getElementById('tuneCap');
      const frequency = document.getElementById('tuneFreq');
      if (cap) cap.value=this.bench.tuning;
      if (readout) readout.textContent=this.bench.tuning.toFixed(1)+' pF';
      if (frequency) frequency.textContent=(1/(2*Math.PI*Math.sqrt(291.5e-6*this.bench.tuning*1e-12))/1000).toFixed(1)+' kHz';
    }
    this._updateLessonReadout();
    this.renderer.render(this.bench.scene, this.camera);
    this._updateCalloutPositions();

    if (this._firstFrame) {
      this._firstFrame = false;
      this.onReady();
    }
    this._raf = requestAnimationFrame(this._loop);
  }

  _updateLessonReadout() {
    const readout=document.getElementById('liveReadout');
    if(!readout) return;
    const b=this.bench, ratio=b._response();
    readout.hidden=this.step<6;
    if(this.step===6) readout.textContent='5-turn loop → magnetic field → 75-turn coil · no electrical connection';
    if(this.step===7) readout.textContent=`Illustration · source 819 kHz · C ${b.tuning.toFixed(1)} pF · TP1 peak ${(b.sourceAmplitude*ratio).toFixed(3)} V`;
    if(this.step===8) readout.textContent=`Illustration · source ${b.sourceAmplitude.toFixed(2)} V · TP1 peak ${(b.sourceAmplitude*ratio).toFixed(3)} V · TP3 DC ${Math.max(0,b.sourceAmplitude*ratio-0.25).toFixed(3)} V`;
  }
}
