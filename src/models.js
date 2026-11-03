import * as THREE from "../vendor/three.module.js";
import {
  PALETTE,
  rounded,
  cyl,
  box,
  tube,
  canvasTexture,
  tagSprite,
  makeEnvironment,
  createMaterials,
  tagPart,
  setDrawFraction,
} from "./lib.js";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const DEG = Math.PI / 180;

/* Bench geometry notes -----------------------------------------------------
   1 unit = 1 cm. The pipe is 50 mm, the winding band 25 mm, the breadboard
   8.4 x 5.6 cm (a compact 400-point board). The detector parts are slightly overstated so their markings
   and orientation stay legible at a whole-bench camera distance.
   ------------------------------------------------------------------------ */

export class Bench {
  constructor(renderer) {
    this.renderer = renderer;
    this.scene = new THREE.Scene();
    this.scene.environment = makeEnvironment(renderer);
    this.root = new THREE.Group();
    this.scene.add(this.root);

    this.m = createMaterials();
    this.anchors = {};
    this.pickables = [];
    this.tweens = [];
    this.reveals = {};
    this.time = 0;
    this.sourceAmplitude = 0.5;
    this.paused = false;
    this.animation = { elapsed: 9, duration: 8 };
    this.step = 0;
    this.tuning = 129.5;
    this.capMounted = false;
    this.signalOn = false;
    this.dmmOn = false;
    this.probeAtTP1 = false;

    this._lights();
    this._shadowPlane();
    this._spool();
    this._tools();
    this._tray();
    this._pipe();
    this._winding();
    this._capacitor();
    this._tankLeads();
    this._breadboard();
    this._testLoop();
    this._generator();
    this._scope();
    this._probe();
    this._dmm();
    this._tankToBoard();
    this.probeGround = tube([[2.97724,2.6,0.46],[1.5,1.9,2.6],[0.98,1.08,3.32]],0.035,this.m.blackWire,70,6);
    this.root.add(this.probeGround);
    this._signalFlow();

    this.root.updateMatrixWorld(true);
    this._collectPickables();
    this.setStep(0, true);
    this.setTuning(129.5);
  }

  /* ------------------------------------------------------------------ setup */
  _lights() {
    this.scene.add(new THREE.HemisphereLight(0xf4f5ef, 0x9b9c94, 1.25));

    const key = new THREE.DirectionalLight(0xf5f4ed, 2.4);
    key.position.set(15, 25, 17);
    key.target.position.set(0, 2.5, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -25;
    key.shadow.camera.right = 25;
    key.shadow.camera.top = 24;
    key.shadow.camera.bottom = -24;
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 75;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.03;
    key.shadow.radius = 5;
    this.scene.add(key, key.target);

    const fill = new THREE.DirectionalLight(0xe0e8ec, 0.9);
    fill.position.set(-18, 12, 9);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xf1e9da, 0.65);
    rim.position.set(-4, 8, -20);
    this.scene.add(rim);

    this.scene.add(new THREE.AmbientLight(0xfff7ea, 0.18));
  }

  _shadowPlane() {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 70),
      new THREE.ShadowMaterial({ color: PALETTE.shadow, opacity: 0.16 })
    );
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0.001;
    plane.receiveShadow = true;
    plane.userData.noPick = true;
    this.scene.add(plane);
  }

  _anchor(name, parent, x = 0, y = 0, z = 0) {
    const o = new THREE.Object3D();
    o.position.set(x, y, z);
    parent.add(o);
    this.anchors[name] = o;
    return o;
  }

  /* ------------------------------------------------------------------ spool */
  _spool() {
    const g = new THREE.Group();
    g.position.set(-12.6, 0, 9.8);
    g.rotation.y = 0.18;
    this.root.add(g);
    this.spoolGroup = g;

    const bottom = cyl(1.95, 1.95, 0.16, 40, this.m.wood);
    bottom.position.y = 0.11;
    g.add(bottom);

    const core = cyl(0.56, 0.56, 1.62, 28, this.m.woodDark);
    core.position.y = 0.94;
    g.add(core);

    const wire = cyl(1.26, 1.26, 1.48, 40, this.m.copper);
    wire.position.y = 0.98;
    g.add(wire);

    for (let i = 0; i < 9; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.265, 0.012, 4, 48),
        this.m.copperMatte
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.34 + i * 0.16;
      g.add(ring);
    }

    const top = cyl(1.95, 1.95, 0.16, 40, this.m.wood);
    top.position.y = 1.81;
    g.add(top);

    const tail = tube(
      [
        [1.12, 1.25, 0.44],
        [1.62, 0.65, 1.18],
        [1.15, 0.13, 2.0],
        [2.05, 0.075, 2.38],
      ],
      0.027,
      this.m.copper,
      70,
      5
    );
    g.add(tail);

    tagPart(g, "spool");
    this._anchor("spool", g, 0, 1.15, 0);
  }

  _tools() {
    const g = new THREE.Group();
    g.position.set(-10.8, 0, 3.65);
    this.root.add(g);
    this.toolsGroup = g;

    const ruler = rounded(8.2, 0.1, 1.35, 0.05, this.m.paper);
    ruler.position.y = 0.06;
    g.add(ruler);
    for (let i = 0; i < 21; i++) {
      const tick = box(0.024, 0.012, i % 5 === 0 ? 0.38 : 0.22, this.m.scopeDark);
      tick.position.set(-3.7 + i * 0.37, 0.12, -0.5);
      tick.castShadow = false;
      g.add(tick);
    }
    const tape = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.19, 10, 36), this.m.tape);
    tape.rotation.x = Math.PI / 2;
    tape.position.set(-4.8, 0.2, 0.55);
    tape.castShadow = true;
    g.add(tape);
    const tapeCentre = cyl(0.46, 0.46, 0.1, 24, this.m.paper);
    tapeCentre.position.set(-4.8, 0.18, 0.55);
    g.add(tapeCentre);

    tagPart(g, "tools");
  }

  /* ------------------------------------------------------------------- tray */
  _tray() {
    const g = new THREE.Group();
    g.position.set(-4.8, 0, 7.8);
    this.root.add(g);
    this.trayGroup = g;

    const base = rounded(6.5, 0.34, 3.8, 0.22, this.m.wood);
    base.position.y = 0.17;
    g.add(base);
    const inset = rounded(6.0, 0.1, 3.3, 0.16, this.m.paper);
    inset.position.y = 0.35;
    g.add(inset);

    // low tray walls
    for (const [x, z, w, d] of [
      [0, -1.78, 6.5, 0.22],
      [0, 1.78, 6.5, 0.22],
      [-3.15, 0, 0.22, 3.6],
      [3.15, 0, 0.22, 3.6],
    ]) {
      const wall = rounded(w, 0.44, d, 0.1, this.m.woodDark);
      wall.position.set(x, 0.25, z);
      g.add(wall);
    }

    const loose = new THREE.Group();
    g.add(loose);
    this.looseParts = loose;

    const diode = this._diode();
    diode.position.set(0.95, 0.62, -0.85);
    diode.rotation.set(0, 0.22, 0.04);
    diode.scale.setScalar(0.82);
    loose.add(diode);

    const resistor = this._resistor();
    resistor.position.set(1.1, 0.90, 0.55);
    resistor.rotation.set(0.08, -0.3, 0.08);
    resistor.scale.setScalar(0.82);
    loose.add(resistor);

    const ceramic = this._ceramic();
    ceramic.position.set(2.55, 0.55, 0.6);
    ceramic.rotation.set(-Math.PI / 2, 0.2, 0.3);
    ceramic.scale.setScalar(0.9);
    loose.add(ceramic);

    tagPart(loose, "tray");
    tagPart(g, "tray");
    this._anchor("tray", g, 0, 1.1, 0);
  }

  /* ------------------------------------------------------------------- pipe */
  _pipe() {
    const g = new THREE.Group();
    g.position.set(-7.5, 4.2, -1.0);
    this.root.add(g);
    this.pipeGroup = g;

    const outer = cyl(2.5, 2.5, 6.0, 72, this.m.pvc, true);
    outer.rotation.z = Math.PI / 2;
    g.add(outer);

    const inner = cyl(2.36, 2.36, 6.0, 72, this.m.pvcInner, true);
    inner.rotation.z = Math.PI / 2;
    inner.castShadow = false;
    g.add(inner);

    for (const sx of [-1, 1]) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(2.36, 2.5, 72),
        new THREE.MeshStandardMaterial({
          color: 0xd6c9b7,
          roughness: 0.62,
          side: THREE.DoubleSide,
          metalness: 0,
        })
      );
      ring.rotation.y = (sx * Math.PI) / 2;
      ring.position.x = sx * 3.0;
      ring.castShadow = false;
      g.add(ring);

    }

    // wooden cradles under the pipe
    for (const x of [-2.15, 2.15]) {
      const base = rounded(1.25, 0.22, 5.0, 0.08, this.m.wood);
      base.position.set(x, -4.09, 0);
      g.add(base);
      for (const z of [-1.95, 1.95]) {
        const post = rounded(0.95, 2.65, 0.36, 0.08, this.m.foam);
        post.position.set(x, -2.85, z);
        post.rotation.x = z > 0 ? -0.08 : 0.08;
        post.castShadow = true;
        g.add(post);
        const pad = rounded(0.86, 0.06, 0.3, 0.03, this.m.tape);
        pad.position.set(x, -1.50, z * 0.985);
        pad.castShadow = false;
        g.add(pad);
      }
    }

    const pipePrint = canvasTexture(1024,256,(ctx,w,h)=>{
      ctx.clearRect(0,0,w,h);ctx.fillStyle="#737d7a";
      ctx.font='500 45px "Barlow",sans-serif';ctx.textAlign="center";
      ctx.fillText('PVC-U  Ø 50 mm',w/2,105);
      ctx.font='28px "Barlow",sans-serif';ctx.fillText('INSULATING COIL FORMER',w/2,158);
    });
    const marking = new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.48),new THREE.MeshBasicMaterial({map:pipePrint,transparent:true,depthWrite:false}));
    marking.position.set(2.05,0,2.505);g.add(marking);
    tagPart(g, "pipe");
    this._anchor("coil", g, 0, 0, 0);
  }

  _winding() {
    const g = new THREE.Group();
    this.pipeGroup.add(g);
    this.coilGroup = g;

    const turns = 75;
    const per = 64;
    const n = turns * per;
    const points = [];
    const r = 2.516;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = t * turns * Math.PI * 2;
      points.push(new THREE.Vector3(-1.25 + 2.5 * t, Math.cos(a) * r, Math.sin(a) * r));
    }
    const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.02);
    const geo = new THREE.TubeGeometry(curve, n, 0.015, 6, false);
    this.coilGeo = geo;
    this.coilCount = geo.index ? geo.index.count : 0;
    const mesh = new THREE.Mesh(geo, this.m.copper);
    mesh.castShadow = false;
    g.add(mesh);

    this.reveals.coil = [geo];
    for(const x of [-1.28,1.28]) {
      const anchor=rounded(0.28,0.025,0.9,0.015,this.m.tape);
      anchor.position.set(x,2.526,0);g.add(anchor);
    }

    const tails = new THREE.Group();
    g.add(tails);
    this.looseTails = tails;
    tails.add(
      tube(
        [
          [-1.25, 2.516, 0],
          [-1.38, 2.45, 0.85],
          [-1.45, 1.95, 1.62],
          [-1.45, 1.62, 2.0],
        ],
        0.021,
        this.m.copper,
        48,
        4
      )
    );
    tails.add(
      tube(
        [
          [1.25, 2.516, 0],
          [1.38, 2.45, 0.82],
          [1.45, 1.9, 1.62],
          [1.45, 1.62, 2.0],
        ],
        0.021,
        this.m.copper,
        48,
        4
      )
    );
    tagPart(tails, "coil");
    tagPart(g, "coil");
  }

  /* -------------------------------------------------------------- capacitor */
  _capacitor() {
    // Enclosed polyvaricon, based on the supplied 21 × 21 × 17 mm reference.
    // Seven terminal tabs are representative positions, NOT an identified pinout.
    const g = new THREE.Group(); this.root.add(g); this.capGroup = g;
    const shell = new THREE.MeshPhysicalMaterial({color:0xe5dfbe,roughness:0.3,
      metalness:0,transparent:true,opacity:0.48,depthWrite:false,side:THREE.DoubleSide});
    this.capShell = rounded(2.1,2.1,1.7,0.13,shell,5); g.add(this.capShell);
    const front=rounded(2.06,2.06,0.1,0.1,this.m.ivory,4);front.position.z=0.86;g.add(front);
    const rear=rounded(2.06,2.06,0.09,0.1,this.m.ivory,4);rear.position.z=-0.86;g.add(rear);
    // Dielectric-separated sections inside the housing, not exposed air fins.
    for (const x of [-0.48,0.48]) for(let i=0;i<13;i++) {
      const plate=cyl(0.42,0.42,0.018,24,this.m.silver);
      plate.rotation.x=Math.PI/2;plate.position.set(x,0,-0.65+i*0.1);plate.castShadow=false;g.add(plate);
    }
    const rotor=new THREE.Group();g.add(rotor);this.capRotor=rotor;
    const shaft=cyl(0.17,0.17,0.43,6,this.m.brass);
    shaft.rotation.x=Math.PI/2;shaft.position.z=1.08;rotor.add(shaft);
    const bore=cyl(0.075,0.075,0.012,20,this.m.black);
    bore.rotation.x=Math.PI/2;bore.position.z=1.30;rotor.add(bore);
    const mark=box(0.035,0.12,0.012,this.m.copperDark);mark.position.set(0,0.11,1.305);rotor.add(mark);
    // No invented large dial. The brass threaded shaft is the tuning control.
    this.capDial=null;
    for(const x of [-0.78,0.78]) for(const y of [-0.78,0.78]) {
      const screw=cyl(0.105,0.105,0.045,20,this.m.silver);
      screw.rotation.x=Math.PI/2;screw.position.set(x,y,0.94);g.add(screw);
      const slot=box(0.14,0.018,0.009,this.m.ink);slot.position.set(x,y,0.968);g.add(slot);
    }
    for(const x of [-0.59,0.59]) {
      const rim=new THREE.Mesh(new THREE.TorusGeometry(0.115,0.025,8,24),this.m.brass);
      rim.position.set(x,-0.27,0.93);g.add(rim);
      const hole=cyl(0.09,0.09,0.01,18,this.m.black);hole.rotation.x=Math.PI/2;hole.position.set(x,-0.27,0.926);g.add(hole);
    }
    // Four rear trimmer screws, visible when orbiting around the component.
    for(const x of [-0.52,0.52]) for(const y of [-0.5,0.5]) {
      const trim=cyl(0.20,0.20,0.06,24,this.m.brassLight);
      trim.rotation.x=Math.PI/2;trim.position.set(x,y,-0.94);g.add(trim);
      const slot=box(0.27,0.025,0.012,this.m.ink);slot.position.set(x,y,-0.978);g.add(slot);
    }
    this.capTerminals=[];
    for(const [side,xs] of [[-1,[-0.67,0,0.67]],[1,[-0.75,-0.25,0.25,0.75]]]) {
      for(const x of xs) {
        const lug=rounded(0.13,0.64,0.045,0.02,this.m.brass,3);
        lug.position.set(x,side*1.27,-0.47);g.add(lug);this.capTerminals.push(lug);
        const hole=new THREE.Mesh(new THREE.TorusGeometry(0.028,0.009,6,12),this.m.copperDark);
        hole.position.set(x,side*1.49,-0.442);g.add(hole);
      }
    }
    // Illustrative AM/common pair. Endpoints are shared by anchors AND wires.
    this.capAMLocal=V(-0.67,-1.49,-0.47);
    this.capCommonLocal=V(0,-1.49,-0.47);
    this.capTrayPos=V(-6.1,1.2,7.75);
    this.capTrayQuat=new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI/2,0,0.12));
    this.capMountedPos=V(-7.5,8.32,-0.35);this.capMountedQuat=new THREE.Quaternion();
    this.capAMWorld=this.capAMLocal.clone().add(this.capMountedPos);
    this.capCommonWorld=this.capCommonLocal.clone().add(this.capMountedPos);
    const mount=new THREE.Group();this.root.add(mount);this.capMount=mount;
    const pad=rounded(1.9,0.32,1.1,0.07,this.m.foam);pad.position.set(-7.5,7.1,-0.15);mount.add(pad);
    for(const x of [-8.51,-6.49]) {const band=rounded(0.14,2.1,1.72,0.025,this.m.tape);band.position.set(x,8.32,-0.35);mount.add(band);}
    mount.visible=false;
    tagPart(g,'capacitor');
    this._anchor('cap',g,0,0,0);this._anchor('capFrame',g,0.95,0,0.85);
    this._anchor('capKnob',g,0,0,1.3);
    this._anchor('tankTop',g,...this.capAMLocal.toArray());
    this._anchor('tankBottom',g,...this.capCommonLocal.toArray());
    g.position.copy(this.capTrayPos);g.quaternion.copy(this.capTrayQuat);
  }

  _tankLeads() {
    const g = new THREE.Group();
    this.root.add(g);
    this.tankLeads = g;

    const a = tube([[-8.75,6.716,-1],[-8.95,7.12,-0.8],[-8.85,7.12,-0.35],this.capAMWorld.toArray()],0.025,this.m.copper,72,6);
    const b = tube([[-6.25,6.716,-1],[-6.05,7.12,-0.8],[-6.15,7.12,-0.35],this.capCommonWorld.toArray()],0.025,this.m.copper,72,6);
    g.add(a, b);
    this.reveals.tank = [a.geometry, b.geometry];
    tagPart(g, "tank");
    this._anchor("tankWire", g, -7.4, 6.6, 0.4);
    g.visible = false;
  }

  /* --------------------------------------------------------- detector parts */
  _diode() {
    const g = new THREE.Group();

    const core = cyl(0.075, 0.075, 0.82, 12, this.m.glassCore);
    core.rotation.z = Math.PI / 2;
    g.add(core);

    const glass = cyl(0.18, 0.18, 0.86, 32, this.m.glassAmber);
    glass.rotation.z = Math.PI / 2;
    g.add(glass);

    const capA = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), this.m.glassAmber);
    capA.scale.set(0.42, 1, 1);
    capA.position.x = -0.43;
    g.add(capA);
    const capB = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 12), this.m.glassAmber);
    capB.scale.set(0.42, 1, 1);
    capB.position.x = 0.43;
    g.add(capB);

    const band = cyl(0.185, 0.185, 0.1, 32, this.m.black);
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.30;
    g.add(band);

    const leadL = tube(
      [
        [-0.43, 0, 0],
        [-1.08, -0.12, 0],
        [-1.38, -0.45, 0],
        [-1.95, -0.83, 0],
      ],
      0.028,
      this.m.silver,
      36,
      5
    );
    const leadR = tube(
      [
        [0.43, 0, 0],
        [1.08, -0.12, 0],
        [1.38, -0.45, 0],
        [1.95, -0.83, 0],
      ],
      0.028,
      this.m.silver,
      36,
      5
    );
    g.add(leadL, leadR);

    const marker = tagSprite("1N60P", { width: 1.55, bg: "rgba(251,245,233,.82)" });
    marker.position.set(0, 0.78, 0.05);
    marker.visible = false;
    g.add(marker);

    tagPart(g, "diode");
    return g;
  }

  _resistor() {
    const g = new THREE.Group();

    const body = cyl(0.125, 0.125, 0.65, 20, this.m.resistorBody);
    body.rotation.z = Math.PI / 2;
    g.add(body);

    for (const [x, mat, w] of [
      [-0.22, this.m.bandBrown, 0.065],
      [-0.08, this.m.bandGreen, 0.065],
      [0.06, this.m.bandOrange, 0.065],
      [0.24, this.m.bandGold, 0.045],
    ]) {
      const band = cyl(0.130, 0.130, w, 20, mat);
      band.rotation.z = Math.PI / 2;
      band.position.x = x;
      g.add(band);
    }

    g.add(
      tube(
        [
          [-0.325, 0, 0],
          [-0.68, -0.2, 0],
          [-0.85, -0.58, 0],
        ],
        0.025,
        this.m.silver,
        24,
        5
      )
    );
    g.add(
      tube(
        [
          [0.325, 0, 0],
          [0.7, -0.18, 0],
          [0.89, -0.58, 0],
        ],
        0.025,
        this.m.silver,
        24,
        5
      )
    );

    tagPart(g, "resistor");
    return g;
  }

  _ceramic() {
    const g = new THREE.Group();

    const disc = cyl(0.36, 0.36, 0.13, 36, this.m.ceramic);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.035, 8, 40), this.m.ceramicEdge);
    rim.position.z = 0.055;
    g.add(rim);

    const marking = new THREE.Mesh(
      new THREE.PlaneGeometry(0.44, 0.22),
      new THREE.MeshBasicMaterial({
        map: canvasTexture(256, 128, (ctx, w, h) => {
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "#412717";
          ctx.font = '700 62px "Barlow Semi Condensed", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("332", w / 2, h / 2 + 2);
        }),
        transparent: true,
        depthWrite: false,
      })
    );
    marking.position.set(0, 0.06, 0.069);
    g.add(marking);

    g.add(
      tube(
        [
          [-0.23, -0.29, -0.02],
          [-0.25, -0.7, -0.02],
          [-0.27, -0.95, -0.02],
        ],
        0.023,
        this.m.silver,
        20,
        5
      )
    );
    g.add(
      tube(
        [
          [0.23, -0.29, -0.02],
          [0.25, -0.7, -0.02],
          [0.27, -0.95, -0.02],
        ],
        0.023,
        this.m.silver,
        20,
        5
      )
    );

    tagPart(g, "ceramic");
    return g;
  }

  /* -------------------------------------------------------------- breadboard */
  _breadboard() {
    const g = new THREE.Group();
    g.position.set(4.6, 0.55, 1.2);
    this.root.add(g);
    this.boardGroup = g;

    const slab = rounded(8.4, 1.0, 5.6, 0.2, this.m.breadboard);
    slab.position.y = 0;
    g.add(slab);
    tagPart(slab, "board");

    const trench = box(7.8, 0.025, 0.56, this.m.pvcEdge);
    trench.position.y = 0.504;
    g.add(trench);
    const holes = [];
    const xs = [];
    const cols = 30;
    for (let i = 0; i < cols; i++) xs.push(-3.62 + (7.24 * i) / (cols - 1));
    const rows = [-1.52, -1.26, -1.0, -0.74, -0.48, 0.48, 0.74, 1.0, 1.26, 1.52];
    for (const x of xs) for (const z of rows) holes.push([x, z]);

    for (const z of [-2.12, -2.42, 2.12, 2.42]) {
      for (const x of xs) holes.push([x, z]);
    }

    const holeGeo = new THREE.CylinderGeometry(0.054, 0.054, 0.014, 9);
    const holeMesh = new THREE.InstancedMesh(holeGeo, this.m.hole, holes.length);
    const dummy = new THREE.Object3D();
    holes.forEach(([x, z], i) => {
      dummy.position.set(x, 0.505, z);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      holeMesh.setMatrixAt(i, dummy.matrix);
    });
    holeMesh.instanceMatrix.needsUpdate = true;
    holeMesh.castShadow = false;
    holeMesh.receiveShadow = true;
    tagPart(holeMesh, "board");
    g.add(holeMesh);

    for (const [z, mat] of [
      [-2.42, this.m.railRed],
      [-2.12, this.m.railBlue],
      [2.12, this.m.railBlue],
      [2.42, this.m.railRed],
    ]) {
      const line = box(7.4, 0.015, 0.045, mat);
      line.position.set(0, 0.514, z + (z < 0 ? -0.13 : 0.13));
      line.castShadow = false;
      g.add(line);
    }

    for (const z of [-2.55, 2.55]) {
      const ruler = box(7.5, 0.008, 0.02, this.m.pvcEdge);
      ruler.position.set(0, 0.512, z);
      ruler.castShadow = false;
      g.add(ruler);
    }

    this.pinX = (column) => -3.62 + 7.24 * column / 29;
    this._testPoint(g, this.pinX(8), -0.74, "TP1");
    this._testPoint(g, this.pinX(16), -0.74, "TP3");
    this._anchor("board", g, 0, 0.9, 0);
    this._anchor("tp1", g, this.pinX(8), 1.78, -0.74);
    this._anchor("tp3", g, this.pinX(16), 1.78, -0.74);
    this._anchor("groundRail", g, this.pinX(16), 0.53, 2.12);
    this._anchor("diodeBand", g, -0.34, 0.96, -0.74);
    this._anchor("load", g, this.pinX(24), 1.5, 0);

    const printing = canvasTexture(1536,1024,(ctx,w,h)=>{
      ctx.clearRect(0,0,w,h);ctx.fillStyle="#646c6e";
      ctx.font='22px "JetBrains Mono",monospace';ctx.textAlign="center";
      const px=x=>(x/8.4+0.5)*w, py=z=>(z/5.6+0.5)*h;
      for(let i=0;i<30;i++) for(const z of [-1.78,1.82]) ctx.fillText(String(i+1),px(this.pinX(i)),py(z));
      ctx.font='25px "JetBrains Mono",monospace';
      [-1.52,-1.26,-1,-0.74,-0.48,0.48,0.74,1,1.26,1.52].forEach((z,i)=>{
        for(const x of [-3.98,3.98]) ctx.fillText('abcdefghij'[i],px(x),py(z)+8);
      });
      for(const z of [-2.42,2.42]) {ctx.fillStyle="#af473e";ctx.fillText('+',px(-3.98),py(z)+7);}
      for(const z of [-2.12,2.12]) {ctx.fillStyle="#28647c";ctx.fillText('−',px(-3.98),py(z)+7);}
      ctx.font='18px "Barlow",sans-serif';ctx.fillStyle="#747675";ctx.fillText('SOLDERLESS BREADBOARD · 2.54 mm pitch',w/2,h/2+7);
    });
    const print = new THREE.Mesh(new THREE.PlaneGeometry(8.4,5.6),new THREE.MeshBasicMaterial({map:printing,transparent:true,depthWrite:false}));
    print.rotation.x=-Math.PI/2;print.position.y=0.525;g.add(print);
    this._mountDetector(g);
  }

  _testPoint(parent, x, z, label) {
    const y0 = 0.53;
    const h = 1.25;
    const pts = [[x,y0,z-0.26],[x,y0+h-0.15,z-0.26],[x,y0+h,z-0.12],
      [x,y0+h,z+0.12],[x,y0+h-0.15,z+0.26],[x,y0,z+0.26]];
    const wire = tube(pts, 0.045, this.m.tealWire, 90, 6);
    tagPart(wire, "board");
    parent.add(wire);

    const tag = tagSprite(label, {
      width: 1.05,
      bg: "rgba(237,246,242,.96)",
      border: "#8fc3ba",
    });
    tag.position.set(x, y0 + h + 0.42, z);
    parent.add(tag);

    for (const dx of [-0.16, 0.16]) {
      const collar = cyl(0.075, 0.075, 0.09, 12, this.m.teal);
      collar.position.set(x, 0.56, z + (dx < 0 ? -0.26 : 0.26));
      collar.castShadow = false;
      parent.add(collar);
    }
  }

  _mountDetector(board) {
    const d = new THREE.Group();
    board.add(d);
    this.detectorGroup = d;

    const x1 = this.pinX(8), x3 = this.pinX(16), xc = this.pinX(24);
    const diode = this._diode();
    const scale = (x3-x1)/3.9;
    diode.scale.setScalar(scale);
    diode.position.set((x1+x3)/2,0.53+0.83*scale,-0.74);
    d.add(diode);
    const resistor = this._resistor();
    resistor.rotation.y = -Math.PI/2;
    resistor.position.set(x3,1.11,0.11);
    d.add(resistor);
    const ceramic = this._ceramic();
    // Spread the two leads into separate halves of the SAME numbered strip.
    for (const lead of ceramic.children.slice(-2)) {
      ceramic.remove(lead); lead.geometry.dispose();
    }
    for(const sign of [-1,1]) ceramic.add(tube([[sign*0.15,-0.29,0],
      [sign*0.08,-0.67,sign*0.5],[0,-0.95,sign*0.74]],0.023,this.m.silver,32,6));
    ceramic.position.set(xc,1.48,0);
    d.add(ceramic);
    this.detectorParts = [diode,resistor,ceramic];
    this.detectorHomes = this.detectorParts.map(o=>o.position.clone());
    const jumpers = new THREE.Group();
    d.add(jumpers);
    jumpers.add(tube([[x3,0.53,-1.26],[x3,0.86,-1.26],
      [xc,0.86,-1.26],[xc,0.53,-1.26]],0.034,this.m.tealWire,60,6));
    for(const x of [x3,xc]) jumpers.add(tube([[x,0.53,1.26],
      [x,0.85,1.65],[x,0.53,2.12]],0.034,this.m.blackWire,40,6));
    tagPart(jumpers,"board");
    this.detectorJumpers = jumpers;
  }

  /* --------------------------------------------------------------- test loop */
  _testLoop() {
    const g = new THREE.Group();
    g.position.set(-1.4, 4.2, -1.0);
    this.root.add(g);
    this.loopGroup = g;

    const r = 3.35;
    const loopPoints=[];
    for(let i=0;i<=320;i++) {
      const t=i/320,a=Math.PI+t*5*Math.PI*2;
      loopPoints.push(V(-0.44+0.88*t,r*Math.cos(a),r*Math.sin(a)));
    }
    const loopCurve=new THREE.CatmullRomCurve3(loopPoints);
    const loopWire=new THREE.Mesh(new THREE.TubeGeometry(loopCurve,640,0.05,10,false),this.m.redWire);
    g.add(loopWire);

    const base = rounded(1.15, 0.28, 6.2, 0.12, this.m.wood);
    base.position.y = -4.02;
    base.castShadow = false;
    g.add(base);
    const inset = rounded(0.82, 0.08, 5.7, 0.06, this.m.paper);
    inset.position.y = -3.85;
    inset.castShadow = false;
    g.add(inset);

    for (const z of [-2.0, 2.0]) {
      const post = rounded(0.48, 1.5, 0.48, 0.12, this.m.ivory);
      post.position.set(0, -3.18, z);
      post.rotation.x = z > 0 ? -0.09 : 0.09;
      post.castShadow = false;
      g.add(post);
      const foot = rounded(0.62, 0.1, 0.62, 0.04, this.m.tape);
      foot.position.set(0, -3.83, z);
      foot.castShadow = false;
      g.add(foot);
    }

    // the two loop tails, waiting at the bottom
    g.add(
      tube(
        [
          [-0.44, -3.35, 0],
          [-0.42, -3.55, 0.28],
          [-0.35, -3.82, 0.35],
        ],
        0.045,
        this.m.redWire,
        28,
        5
      )
    );
    g.add(
      tube(
        [
          [0.44, -3.35, 0],
          [0.3, -3.55, -0.2],
          [0.22, -3.82, -0.28],
        ],
        0.045,
        this.m.blackWire,
        28,
        5
      )
    );

    const label = tagSprite("5 T DRIVE", {
      width: 1.45,
      bg: "rgba(251,245,233,.94)",
      border: "#c48d7b",
      dot: "#a84938",
    });
    label.position.set(0, -3.58, 1.75);
    g.add(label);

    tagPart(g, "loop");
    this._anchor("loop", g, 0, 0, 0);
  }

  /* --------------------------------------------------------------- generator */
  _generator() {
    const g = new THREE.Group();
    g.position.set(-14.0, 2.35, 4.2);
    g.rotation.y = 0.3;
    this.root.add(g);
    this.generatorGroup = g;

    const body = rounded(8.5, 4.5, 4.4, 0.24, this.m.genBody);
    g.add(body);

    const front = rounded(7.65, 2.65, 0.12, 0.1, this.m.scopeDark);
    front.position.set(0, 0.36, 2.23);
    front.castShadow = false;
    g.add(front);

    const screenTex = canvasTexture(512, 160, (ctx, w, h) => {
      ctx.fillStyle = "#101a20";
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.fillStyle = "#e2ab57";
      ctx.font = '500 48px "JetBrains Mono", monospace';
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText("819.000", w - 92, 58);
      ctx.font = '500 22px "JetBrains Mono", monospace';
      ctx.fillStyle = "#b8a98f";
      ctx.fillText("kHz", w - 18, 62);
      ctx.textAlign = "left";
      ctx.font = '500 20px "JetBrains Mono", monospace';
      ctx.fillStyle = "#78b9ad";
      ctx.fillText("SINE", 22, 58);
      ctx.fillStyle = "#9b8f7c";
      ctx.font = '500 17px "JetBrains Mono", monospace';
      ctx.fillText("1.00 Vpp", 22, 104);
      ctx.fillStyle = "#e2ab57";
      ctx.fillText("OUTPUT  ON", 22, 132);
    });
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.15, 0.98),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    this.generatorTex=screenTex;
    screen.position.set(-1.5, 0.78, 2.305);
    g.add(screen);

    for (const [x, y, r] of [
      [2.45, 0.9, 0.33],
      [3.15, 0.86, 0.24],
      [2.95, 0.1, 0.2],
    ]) {
      const knob = cyl(r, r, 0.24, 24, this.m.silver);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, y, 2.36);
      g.add(knob);
      const mark = box(0.035, r * 1.45, 0.02, this.m.ink);
      mark.position.set(x, y + 0.02, 2.49);
      mark.rotation.z = x * 0.6;
      mark.castShadow = false;
      g.add(mark);
    }

    for (const x of [1.1, 1.85]) {
      const port = cyl(0.16, 0.16, 0.18, 18, this.m.silver);
      port.rotation.x = Math.PI / 2;
      port.position.set(x, -1.0, 2.34);
      g.add(port);
    }

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.11, 8, 24, Math.PI),
      this.m.scopeDark
    );
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 2.34, 0);
    g.add(handle);

    for (const x of [-3.2, 3.2]) {
      const foot = rounded(0.5, 0.25, 0.7, 0.08, this.m.black);
      foot.position.set(x, -2.35, 0);
      g.add(foot);
    }

    tagPart(g, "generator");
    this._anchor("generator", g, -1.5, 0.78, 2.4);

    // generator leads to the loop, run along the bench and up the loop stand
    const leads = new THREE.Group();
    this.root.add(leads);
    this.genLeads = leads;
    const red = tube(
      [
        [-12.26, 1.35, 6.11],
        [-12.14, 0.82, 5.7],
        [-11.9, 0.18, 5.0],
        [-11.0, 0.12, 4.2],
        [-8.5, 0.12, 3.6],
        [-5.0, 0.12, 3.45],
        [-2.6, 0.12, 3.4],
        [-1.75, 0.36, 1.8],
        [-1.75, 0.38, -0.65],
      ],
      0.055,
      this.m.redWire,
      150,
      6
    );
    const black = tube(
      [
        [-11.54, 1.35, 5.89],
        [-11.48, 0.82, 5.55],
        [-11.38, 0.18, 4.9],
        [-10.7, 0.12, 4.15],
        [-8.3, 0.12, 3.78],
        [-5.2, 0.12, 3.62],
        [-2.6, 0.12, 3.62],
        [-1.18, 0.36, 1.9],
        [-1.18, 0.38, -1.28],
      ],
      0.055,
      this.m.blackWire,
      150,
      6
    );
    leads.add(red, black);
    tagPart(leads, "loop");
    leads.visible = false;
  }

  /* -------------------------------------------------------------------- scope */
  _scope() {
    const g = new THREE.Group();
    g.position.set(8.4, 2.4, -6.1);
    g.rotation.y = -0.1;
    this.root.add(g);
    this.scopeGroup = g;

    const body = rounded(10.6, 4.8, 4.2, 0.28, this.m.scopeBody);
    g.add(body);

    const bezel = rounded(5.2, 2.96, 0.16, 0.1, this.m.screenBezel);
    bezel.position.set(-1.45, 0.5, 2.12);
    bezel.castShadow = false;
    g.add(bezel);

    this.scopeTex = canvasTexture(640, 360, () => {});
    this.scopeCanvas = this.scopeTex.image;
    this.scopeCtx = this.scopeCanvas.getContext("2d");
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(4.85, 2.6),
      new THREE.MeshBasicMaterial({ map: this.scopeTex })
    );
    screen.position.set(-1.45, 0.5, 2.21);
    g.add(screen);

    for (const [x, y, r] of [
      [2.4, 0.85, 0.34],
      [3.3, 0.82, 0.24],
      [2.4, -0.1, 0.22],
      [3.3, -0.1, 0.18],
    ]) {
      const knob = cyl(r, r, 0.26, 24, this.m.scopeDark);
      knob.rotation.x = Math.PI / 2;
      knob.position.set(x, y, 2.28);
      g.add(knob);
      const mark = box(0.025, r * 1.5, 0.02, this.m.ivory);
      mark.position.set(x, y + 0.02, 2.42);
      mark.rotation.z = x * 0.5;
      mark.castShadow = false;
      g.add(mark);
    }

    for (const [x, y] of [
      [-2.3, -1.55],
      [-1.2, -1.55],
    ]) {
      const port = cyl(0.15, 0.15, 0.2, 18, this.m.silver);
      port.rotation.x = Math.PI / 2;
      port.position.set(x, y, 2.25);
      g.add(port);
    }

    const brand = tagSprite("SCOPE", {
      width: 1.4,
      bg: "rgba(24,33,61,.9)",
      border: "#18213d",
      fg: "#f4ebdb",
      dot: "#64cbc3",
    });
    brand.position.set(2.55, 1.7, 2.23);
    brand.scale.multiplyScalar(0.7);
    g.add(brand);

    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.12, 8, 24, Math.PI),
      this.m.scopeDark
    );
    handle.rotation.y = Math.PI / 2;
    handle.rotation.z = Math.PI / 2;
    handle.position.set(0, 2.48, 0.1);
    g.add(handle);

    for (const x of [-4.0, 4.0]) {
      const foot = rounded(0.55, 0.24, 0.8, 0.08, this.m.black);
      foot.position.set(x, -2.4, 0);
      g.add(foot);
    }

    tagPart(g, "scope");
    this._anchor("scopeScreen", g, -1.45, 0.5, 2.3);

    this._drawScope();
  }

  /* -------------------------------------------------------------------- probe */
  _probe() {
    const g = new THREE.Group();
    this.root.add(g);
    this.probeGroup = g;

    const needle = cyl(0.004, 0.018, 0.5, 8, this.m.steel);
    needle.position.y = 0.25;
    g.add(needle);

    const collar = cyl(0.075, 0.11, 0.36, 14, this.m.scopeDark);
    collar.position.y = 0.58;
    g.add(collar);

    const body = cyl(0.105, 0.105, 1.7, 18, this.m.scopeDark);
    body.position.y = 1.55;
    g.add(body);

    const grip = cyl(0.16, 0.15, 0.92, 20, this.m.tealWire);
    grip.position.y = 1.85;
    g.add(grip);

    const tail = cyl(0.11, 0.085, 0.4, 14, this.m.scopeDark);
    tail.position.y = 2.62;
    g.add(tail);

    const x10 = tagSprite("×10", {
      width: 0.8,
      bg: "rgba(251,245,233,.95)",
      border: "#b8a68d",
      mono: true,
    });
    x10.position.set(0.02, 1.98, 0.18);
    g.add(x10);

    tagPart(g, "probe");
    this._anchor("probeTip", g, 0, 0, 0);

    this.probeRestPos = V(6.7, 0.28, -3.1);
    this.probeRestQuat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0.1, 0.45, -1.42)
    );
    this.probeTP1Pos = V(2.97724, 2.33, 0.46);
    this.probeTP1Quat = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(-0.12, 0.12, 0.58)
    );

    this.probeCable = null;
    this._setProbe(false);
  }

  _setProbe(atTP1) {
    this.probeAtTP1 = atTP1;
    this.probeGroup.position.copy(atTP1 ? this.probeTP1Pos : this.probeRestPos);
    this.probeGroup.quaternion.copy(atTP1 ? this.probeTP1Quat : this.probeRestQuat);
    this.probeGroup.updateMatrixWorld(true);
    this._rebuildProbeCable();
  }

  _rebuildProbeCable() {
    if (this.probeCable) {
      this.pickables = this.pickables.filter(o => o !== this.probeCable);
      this.root.remove(this.probeCable);
      this.probeCable.geometry.dispose();
      this.probeCable = null;
    }
    this.scopeGroup.updateMatrixWorld(true);
    const port = this.scopeGroup.localToWorld(V(-1.75, -1.55, 2.25));
    const top = this.probeGroup.localToWorld(V(0, 2.78, 0));
    const mid = port.clone().lerp(top, 0.52);
    mid.y = Math.max(0.45, Math.min(port.y, top.y) - 0.9);
    const mid2 = port.clone().lerp(top, 0.22);
    mid2.y = Math.max(1.0, port.y - 0.3);
    const cable = tube(
      [
        [port.x, port.y, port.z],
        [mid2.x, mid2.y, mid2.z],
        [mid.x, mid.y, mid.z],
        [top.x, top.y, top.z],
      ],
      0.043,
      this.m.blackWire,
      110,
      6
    );
    this.probeCable = cable;
    tagPart(cable, "probe");
    this.root.add(cable);
    cable.userData.dynamicPick = true;
    if (!this.pickables.includes(cable)) this.pickables.push(cable);
  }

  /* ---------------------------------------------------------------------- DMM */
  _dmm() {
    const g = new THREE.Group();
    g.position.set(7.8, 0.34, 7.2);
    g.rotation.y = -0.25;
    this.root.add(g);
    this.dmmGroup = g;

    const rubber = rounded(4.0, 0.58, 6.4, 0.22, this.m.dmmRubber);
    rubber.position.y = 0.02;
    g.add(rubber);

    const body = rounded(3.55, 0.72, 5.95, 0.2, this.m.dmmYellow);
    body.position.y = 0.12;
    g.add(body);

    const face = rounded(3.15, 0.1, 4.7, 0.12, this.m.dmmFace);
    face.position.y = 0.49;
    g.add(face);

    const bezel = rounded(2.6, 0.08, 1.42, 0.07, this.m.scopeDark);
    bezel.position.set(0, 0.57, -1.05);
    g.add(bezel);

    this.dmmTex = canvasTexture(512, 256, () => {});
    this.dmmCanvas = this.dmmTex.image;
    this.dmmCtx = this.dmmCanvas.getContext("2d");
    const display = new THREE.Mesh(
      new THREE.PlaneGeometry(2.36, 1.18),
      new THREE.MeshBasicMaterial({ map: this.dmmTex })
    );
    display.rotation.x = -Math.PI / 2;
    display.position.set(0, 0.62, -1.05);
    g.add(display);
    this.dmmDisplay = display;

    const knob = cyl(0.55, 0.55, 0.18, 28, this.m.scopeDark);
    knob.position.set(0, 0.66, 0.72);
    g.add(knob);
    const knobMark = box(0.05, 0.02, 0.38, this.m.ivory);
    knobMark.position.set(0, 0.77, 0.55);
    g.add(knobMark);

    for (const [x, z] of [
      [-0.75, 2.1],
      [0, 2.1],
      [0.75, 2.1],
    ]) {
      const button = rounded(0.55, 0.12, 0.35, 0.05, this.m.dmmRubber);
      button.position.set(x, 0.6, z);
      g.add(button);
    }

    for (const x of [-1.1, 0, 1.1]) {
      const port = cyl(0.13, 0.13, 0.2, 16, this.m.black);
      port.position.set(x, 0.6, -2.75);
      g.add(port);
    }

    tagPart(g, "dmm");
    this._anchor("dmm", g, 0, 0.75, -0.7);
    this._drawDmm();

    const leads = new THREE.Group();
    this.root.add(leads);
    this.dmmLeads = leads;

    const red = tube(
      [
        [9.546, 0.94, 4.808],
        [7.1, 1.35, 4.15],
        [6.6, 2.0, 3.75],
        [6.1, 2.55, 3.1],
        [5.75, 2.88, 2.4],
        [4.97448, 2.33, 0.46],
      ],
      0.048,
      this.m.redWire,
      90,
      6
    );
    const black = tube(
      [
        [8.480, 0.94, 4.536],
        [9.3, 1.05, 4.5],
        [8.9, 1.2, 4.1],
        [8.35, 1.25, 3.8],
        [6.972, 1.08, 3.32],
      ],
      0.048,
      this.m.blackWire,
      70,
      6
    );
    leads.add(red, black);
    for (const [x, y, z, mat] of [
      [5.7, 2.9, 1.94, this.m.redWire],
      [7.6, 1.27, 3.32, this.m.blackWire],
    ]) {
      const tip = cyl(0.02, 0.07, 0.34, 8, mat);
      tip.position.set(x, y + 0.1, z);
      leads.add(tip);
    }
    tagPart(leads, "dmm");
    leads.visible = false;
  }

  /* --------------------------------------------------------- tank → detector */
  _tankToBoard() {
    const g = new THREE.Group();
    this.root.add(g);
    this.boardLinks = g;

    const signal = tube(
      [
        this.capAMWorld.toArray(),
        [-8.82, 6.6, 0.35],
        [-8.88, 5.3, 1.55],
        [-8.65, 3.4, 2.45],
        [-8.0, 1.2, 3.25],
        [-6.5, 0.28, 3.85],
        [-4.0, 0.2, 4.1],
        [-1.5, 0.2, 4.15],
        [-0.3, 0.2, 4.1],
        [-0.25, 0.5, 3.7],
        [-0.2, 1.3, 3.3],
        [0.0, 2.0, 2.8],
        [0.8, 2.6, 2.3],
        [1.5, 2.85, 2.0],
        [2.97724, 2.33, 0.46],
      ],
      0.05,
      this.m.tealWire,
      190,
      6
    );

    const ground = tube(
      [
        this.capCommonWorld.toArray(),
        [-6.25, 6.6, 0.2],
        [-6.2, 5.1, 1.65],
        [-5.7, 2.6, 2.8],
        [-4.6, 1.0, 3.55],
        [-3.0, 0.5, 3.75],
        [-1.0, 0.28, 3.85],
        [0.0, 0.3, 3.8],
        [0.4, 0.8, 3.55],
        [0.98, 1.08, 3.32],
      ],
      0.05,
      this.m.blackWire,
      190,
      6
    );

    g.add(signal, ground);
    this.reveals.boardLinks = [signal.geometry, ground.geometry];
    tagPart(g, "tank");
    this._anchor("tankRun", g, -1.0, 3.2, 2.1);
    g.visible = false;
  }

  /* -------------------------------------------------------------- signal flow */
  _signalFlow() {
    const sg = new THREE.Group();
    this.root.add(sg);
    this.signalGroup = sg;

    const glowTex = canvasTexture(128, 128, (ctx, w, h) => {
      const grad = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.2, "rgba(160,245,232,.95)");
      grad.addColorStop(0.55, "rgba(50,205,195,.34)");
      grad.addColorStop(1, "rgba(50,205,195,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    });

    this.fieldRings = [];
    for (let i = 0; i < 6; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x51c9bf,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.028, 6, 64), mat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-1.4, 4.2, -1.0);
      sg.add(ring);
      this.fieldRings.push(ring);
    }

    this.pulsePath = new THREE.CatmullRomCurve3([
      V(-8.7, 6.86, -0.17),
      V(-8.84, 6.2, 1.0),
      V(-8.8, 4.4, 2.05),
      V(-8.3, 1.8, 3.1),
      V(-6.8, 0.5, 3.7),
      V(-4.4, 0.28, 4.1),
      V(-2.0, 0.24, 4.15),
      V(-0.3, 0.4, 4.1),
      V(-0.2, 1.3, 3.3),
      V(0.2, 2.3, 2.7),
      V(1.0, 2.7, 2.2),
      V(2.97724, 2.33, 0.46),
      V(2.7, 2.55, 1.94),
      V(3.8, 2.28, 1.94),
      V(4.8, 2.25, 1.94),
      V(5.7, 2.9, 1.94),
      V(6.4, 2.6, 2.45),
      V(7.1, 1.8, 3.55),
      V(7.4, 1.1, 4.25),
    ]);
    this.pulsePath = new THREE.CurvePath();
    this.pulsePath.add(this.boardLinks.children[0].geometry.parameters.path);
    this.pulsePath.add(new THREE.CatmullRomCurve3([
      V(2.97724,2.33,0.46),V(2.97724,1.08,0.46),V(3.976,1.505,0.46),
      V(4.97448,1.08,0.46),V(4.97448,1.66,1.31),V(4.97448,1.08,2.2),
      V(4.97448,1.4,2.85),V(4.97448,1.08,3.32)
    ]));

    this.signalPulses = [];
    for (let i = 0; i < 18; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x64e0d5,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const s = new THREE.Sprite(mat);
      s.scale.setScalar(0.34);
      sg.add(s);
      this.signalPulses.push(s);
    }

    const coilGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: 0x4bc8be,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    coilGlow.position.set(-7.5, 4.2, -1.0);
    coilGlow.scale.setScalar(3.1);
    sg.add(coilGlow);
    this.coilGlow = coilGlow;

    sg.visible = false;
  }

  /* ------------------------------------------------------------------ drawing */
  _response() {
    const L = 291.5e-6;
    const C = this.tuning * 1e-12;
    const f = 1 / (2 * Math.PI * Math.sqrt(L * C));
    const u = 819000 / f;
    return 1 / Math.sqrt(1 + (40 * (u - 1 / u)) ** 2);
  }

  _drawScope() {
    if(!this.scopeCtx) return;
    const ctx=this.scopeCtx;ctx.fillStyle='#202a29';ctx.fillRect(0,0,640,360);
    ctx.strokeStyle='#45534f';ctx.lineWidth=1;
    for(let x=32;x<640;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,360);ctx.stroke();}
    for(let y=30;y<360;y+=30){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(640,y);ctx.stroke();}
    ctx.strokeStyle='#c2cab9';ctx.lineWidth=3;ctx.beginPath();
    for(let x=0;x<=640;x+=2){const y=180-(this.probeAtTP1?70:0)*Math.sin(x/640*Math.PI*12);x?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();
    ctx.fillStyle='#e2e6dc';ctx.font='22px Barlow,sans-serif';ctx.fillText('CH1  ·  TP1  ·  ×10',22,35);
    ctx.font='18px Barlow,sans-serif';ctx.fillText('ILLUSTRATIVE TRACE · NOT A READING',22,335);this.scopeTex.needsUpdate=true;
  }

  _drawDmm() {
    if(!this.dmmCtx) return;
    const ctx=this.dmmCtx;ctx.fillStyle='#d0d8bd';ctx.fillRect(0,0,512,256);
    ctx.fillStyle='#303b30';ctx.textAlign='center';ctx.font='70px Barlow,sans-serif';
    ctx.fillText(this.dmmOn?'TP3':'—',256,132);ctx.font='24px Barlow,sans-serif';ctx.fillText('DC VOLTS · MEASURE ON BENCH',256,213);
    this.dmmTex.needsUpdate=true;
  }

  setTuning(pF) {
    this.tuning = THREE.MathUtils.clamp(pF, 20, 280);
    const t = (this.tuning - 20) / 260;
    const angle = Math.PI * (1 - t);
    if (this.capRotor) this.capRotor.rotation.z = angle;
    if (this.capDial) this.capDial.rotation.z = angle;
    this._drawScope();
    this._drawDmm();
    return this._response();
  }

  setSignal(on) {
    this.signalOn = on;
    this.signalGroup.visible = on && this.step >= 6;
  }

  /* ------------------------------------------------------------------- tweens */
  _tween(duration, onUpdate, onDone, delay = 0) {
    this.tweens.push({
      start: performance.now() + delay,
      duration: Math.max(1, duration),
      onUpdate,
      onDone,
      done: false,
    });
  }

  _ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  _reveal(name, target, duration = 0) {
    const geos = this.reveals[name];
    if (!geos) return;
    const from = this.revealProgress?.[name] ?? 0;
    if (duration <= 0) {
      this.revealProgress = this.revealProgress || {};
      this.revealProgress[name] = target;
      setDrawFraction(geos, target);
      return;
    }
    this._tween(duration, (t) => {
      const p = from + (target - from) * this._ease(t);
      this.revealProgress = this.revealProgress || {};
      this.revealProgress[name] = p;
      setDrawFraction(geos, p);
    });
  }

  _moveCap(mounted, duration = 0) {
    this.capMounted = mounted;
    const toPos = mounted ? this.capMountedPos : this.capTrayPos;
    const toQ = mounted ? this.capMountedQuat : this.capTrayQuat;

    if (!mounted) this.capMount.visible = false;
    if (duration <= 0) {
      this.capGroup.position.copy(toPos);
      this.capGroup.quaternion.copy(toQ);
      this.capMount.visible = mounted;
      return;
    }

    const fromPos = this.capGroup.position.clone();
    const fromQ = this.capGroup.quaternion.clone();
    this._tween(
      duration,
      (t) => {
        const e = this._ease(t);
        this.capGroup.position.lerpVectors(fromPos, toPos, e);
        this.capGroup.quaternion.slerpQuaternions(fromQ, toQ, e);
        if (mounted && t > 0.9) this.capMount.visible = true;
      },
      () => {
        this.capMount.visible = mounted;
      }
    );
  }

  _setDmm(on) {
    this.dmmOn = on;
    if (this.dmmLeads) this.dmmLeads.visible = on;
    this._drawDmm();
  }

  /* -------------------------------------------------------------------- state */
  setStep(index, instant = false) {
    this.tweens = [];
    this.step = index;
    this.paused = false;
    this.animation = { elapsed: instant ? 9 : 0, duration: 8 };
    this.coilGroup.visible = index >= 1;
    this._reveal("coil", index >= 1 ? 1 : 0, 0);
    this.looseTails.visible = index >= 1 && index <= 2;
    this.spoolGroup.visible = index <= 1;
    this.toolsGroup.visible = index <= 1;
    this.trayGroup.visible = index === 0;
    this._moveCap(index >= 2, 0);
    this.tankLeads.visible = index >= 3;
    this._reveal("tank",index >= 3 ? 1 : 0,0);
    this.detectorGroup.visible = index >= 4;
    this.looseParts.visible = index < 4;
    this.boardLinks.visible = index >= 5;
    this._reveal("boardLinks",index >= 5 ? 1 : 0,0);
    this.genLeads.visible = index >= 6;
    this.loopGroup.visible = index >= 6;
    this.dmmGroup.visible = index === 0 || index >= 8;
    this._setProbe(index >= 7);
    this.probeGround.visible = index >= 7;
    this._setDmm(index >= 8);
    this.sourceAmplitude = 0.5;
    this.setTuning(129.5);
    // Context is retained for assembly; isolated close-ups remove visual obstruction.
    this.boardGroup.visible = index === 0 || index >= 4;
    this.pipeGroup.visible = index !== 4;
    this.capGroup.visible = index !== 4;
    this.capMount.visible = index >= 2 && index !== 4;
    this.tankLeads.visible = index >= 3 && index !== 4;
    this.generatorGroup.visible = index === 0 || index >= 6;
    this.scopeGroup.visible = index === 0 || index >= 7;
    this.probeGroup.visible = index >= 7;
    this.probeCable.visible = index >= 7;
    this.signalGroup.visible = this.signalOn && index >= 6;
    this._animateStep();
    this._drawScope(); this._drawDmm();
  }

  _animateStep() {
    const a = this.animation;
    const t = THREE.MathUtils.clamp((a.elapsed-1.0)/5.8,0,1);
    const e = this._ease(t);
    if(this.step === 1) {
      this._reveal("coil",t,0);
      this.looseTails.visible = t > 0.98;
    }
    if(this.step === 2) {
      this.capGroup.position.copy(this.capMountedPos).add(V(0,(1-e)*3.2,0));
      this.capMount.visible = t > 0.85;
    }
    if(this.step === 3) this._reveal("tank",t,0);
    if(this.step === 4) {
      this.detectorParts.forEach((part,i)=>{
        const p = THREE.MathUtils.clamp(t*3-i,0,1);
        part.visible = t*3 >= i;
        part.position.copy(this.detectorHomes[i]).add(V(0,(1-this._ease(p))*2.5,0));
      });
      this.detectorJumpers.visible = t > 0.96;
    } else {
      this.detectorParts.forEach((part,i)=>{part.visible=true;part.position.copy(this.detectorHomes[i]);});
      this.detectorJumpers.visible = true;
    }
    if(this.step === 5) this._reveal("boardLinks",t,0);
    if(this.step === 6) {
      this.loopGroup.position.set(-1.4,4.2+(1-e)*3,-1);
      this.genLeads.visible = t > 0.95;
    } else this.loopGroup.position.set(-1.4,4.2,-1);
    if(this.step === 7) {
      // A sweep of C past a fixed 819 kHz source, then hold at resonance.
      this.setTuning(t>=1 ? 129.5 : 20+260*t);
    }
    if(this.step === 8) {
      const levels = [0.05,0.1,0.2,0.3,0.5,1];
      this.sourceAmplitude=levels[Math.min(5,Math.floor(t*6))];
    }
  }

  _collectPickables() {
    this.pickables = [];
    this.root.traverse((o) => {
      if (o.isMesh && o.userData.part && !o.userData.noPick) {
        this.pickables.push(o);
      }
    });
  }

  update(dt) {
    if(this.paused) return;
    this.time += dt;
    if(this.animation.elapsed < this.animation.duration) {
      this.animation.elapsed = Math.min(this.animation.duration,this.animation.elapsed+dt);
      this._animateStep();
      this._drawScope(); this._drawDmm();
    }
    if(false) {
      this.lastScreenFrame = Math.floor(this.time*12);
      this._drawScope(); this._drawDmm();
    }
    const now = performance.now();

    for (const tw of this.tweens) {
      if (tw.done) continue;
      const t = THREE.MathUtils.clamp((now - tw.start) / tw.duration, 0, 1);
      if (now < tw.start) continue;
      tw.onUpdate(t);
      if (t >= 1) {
        tw.done = true;
        tw.onDone?.();
      }
    }
    if (this.tweens.length > 40) this.tweens = this.tweens.filter((t) => !t.done);

    if (this.signalOn && this.step >= 6) {
      const ratio = this._response();
      this.fieldRings.forEach((ring, i) => {
        const t = (this.time * 0.24 + i / this.fieldRings.length) % 1;
        ring.position.x = -1.4 - t * 5.2;
        ring.scale.setScalar(1 + t * 0.08 + ratio * 0.03);
        ring.material.opacity = Math.sin(Math.PI * t) * 0.26 * (0.35 + ratio * 0.65);
      });

      this.signalPulses.forEach((s, i) => {
        s.visible = this.step >= 5;
        const t = (this.time * 0.16 + i / this.signalPulses.length) % 1;
        const p = this.pulsePath.getPointAt(t);
        s.position.set(p.x, p.y + Math.sin(this.time * 2 + i) * 0.025, p.z);
        s.material.opacity = 0.5 + Math.sin(this.time * 3 + i) * 0.22;
      });

      this.coilGlow.material.opacity = 0.16 + ratio * 0.16 + Math.sin(this.time * 2.2) * 0.025;
    }
  }
}



