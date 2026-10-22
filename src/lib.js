import * as THREE from "../vendor/three.module.js";
import { RoundedBoxGeometry } from "../vendor/RoundedBoxGeometry.js";

export const PALETTE = {
  ink: 0x18213d,
  inkSoft: 0x2b3450,
  paper: 0xf4ebdb,
  cream: 0xfbf5e9,
  pvc: 0xece3d3,
  pvcInner: 0xcfc4b1,
  copper: 0xb5723d,
  copperDark: 0x8d5429,
  brass: 0xb88948,
  brassLight: 0xd4ae6d,
  silver: 0xc8c4ba,
  teal: 0x168f8d,
  tealDeep: 0x0b6e70,
  red: 0xa84938,
  blue: 0x2e6f96,
  amber: 0xd79b3e,
  glass: 0xe0aa63,
  creamDark: 0xd9cdb9,
  shadow: 0x71604b,
};

export function rounded(w, h, d, r, material, segments = 3) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, segments, r), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function cyl(radiusTop, radiusBottom, height, segments, material, open = false) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments, 1, open),
    material
  );
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function box(w, h, d, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function tube(points, radius, material, tubular = 80, radial = 6) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p[0], p[1], p[2])),
    false,
    "catmullrom",
    0.2
  );
  const geo = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function circleTexture(size, draw) {
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  draw(ctx, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function canvasTexture(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function tagSprite(text, opts = {}) {
  const {
    fg = "#18213d",
    bg = "rgba(251,245,233,.94)",
    border = "#b8a68d",
    dot = "#168f8d",
    mono = true,
    width = 2.1,
  } = opts;
  const tex = canvasTexture(256, 96, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.arcTo(w - 6, 6, w - 6, h - 6, r);
    ctx.arcTo(w - 6, h - 6, 6, h - 6, r);
    ctx.arcTo(6, h - 6, 6, 6, r);
    ctx.arcTo(6, 6, w - 6, 6, r);
    ctx.closePath();
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = dot;
    ctx.beginPath();
    ctx.arc(32, h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.font = `${mono ? '600 34px "JetBrains Mono", monospace' : '600 38px "Barlow Semi Condensed", sans-serif'}`;
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "2px";
    ctx.fillText(text, 52, h / 2 + 1);
  });
  const material = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width, width * (96 / 256), 1);
  sprite.center.set(0.5, 0.5);
  return sprite;
}

export function makeEnvironment(renderer) {
  const tex = canvasTexture(1024, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#fff9ee");
    g.addColorStop(0.42, "#f4e9d7");
    g.addColorStop(0.6, "#dbcbb5");
    g.addColorStop(1, "#8e7e69");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const warm = ctx.createRadialGradient(w * 0.28, h * 0.23, 4, w * 0.28, h * 0.23, 220);
    warm.addColorStop(0, "rgba(255,249,232,.95)");
    warm.addColorStop(1, "rgba(255,249,232,0)");
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    const cool = ctx.createRadialGradient(w * 0.78, h * 0.38, 8, w * 0.78, h * 0.38, 250);
    cool.addColorStop(0, "rgba(206,231,226,.55)");
    cool.addColorStop(1, "rgba(206,231,226,0)");
    ctx.fillStyle = cool;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(255,255,255,.28)";
    ctx.fillRect(0, h * 0.34, w, 18);
    ctx.fillStyle = "rgba(80,67,50,.12)";
    ctx.fillRect(0, h * 0.72, w, 26);
  });
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

export function createMaterials() {
  const std = (color, options = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...options });

  return {
    ink: std(PALETTE.ink, {roughness:0.6}),
    copperDark: std(PALETTE.copperDark, {metalness:0.5,roughness:0.45}),
    pvc: new THREE.MeshPhysicalMaterial({
      color: PALETTE.pvc,
      roughness: 0.46,
      metalness: 0,
      clearcoat: 0.28,
      clearcoatRoughness: 0.42,
    }),
    pvcInner: std(PALETTE.pvcInner, { roughness: 0.9, side: THREE.BackSide }),
    pvcEdge: std(0xd8cdbb, { roughness: 0.7 }),
    foam: std(0xe3d7c4, { roughness: 1 }),
    wood: std(0xc9a978, { roughness: 0.82 }),
    woodDark: std(0x9f7c4c, { roughness: 0.88 }),
    copper: new THREE.MeshStandardMaterial({
      color: PALETTE.copper,
      metalness: 0.72,
      roughness: 0.28,
    }),
    copperMatte: new THREE.MeshStandardMaterial({
      color: 0xaa6a38,
      metalness: 0.55,
      roughness: 0.42,
    }),
    brass: new THREE.MeshStandardMaterial({
      color: PALETTE.brass,
      metalness: 0.88,
      roughness: 0.28,
    }),
    brassLight: new THREE.MeshStandardMaterial({
      color: PALETTE.brassLight,
      metalness: 0.9,
      roughness: 0.22,
    }),
    silver: new THREE.MeshStandardMaterial({
      color: PALETTE.silver,
      metalness: 0.82,
      roughness: 0.32,
    }),
    steel: new THREE.MeshStandardMaterial({
      color: 0x8f908c,
      metalness: 0.72,
      roughness: 0.38,
    }),
    black: std(0x1a1c1e, { roughness: 0.55 }),
    blackGloss: new THREE.MeshStandardMaterial({
      color: 0x14181a,
      metalness: 0.2,
      roughness: 0.24,
    }),
    ivory: std(0xf5eddf, { roughness: 0.5 }),
    whitePlastic: std(0xf9f5eb, { roughness: 0.62 }),
    breadboard: new THREE.MeshPhysicalMaterial({
      color: 0xfbf8f0,
      roughness: 0.55,
      clearcoat: 0.15,
      clearcoatRoughness: 0.5,
    }),
    hole: std(0x8f8678, { roughness: 1 }),
    railRed: std(0xc95d4b, { roughness: 0.65 }),
    railBlue: std(0x2e7ea3, { roughness: 0.65 }),
    teal: std(PALETTE.teal, { roughness: 0.5 }),
    tealWire: new THREE.MeshStandardMaterial({
      color: PALETTE.teal,
      roughness: 0.46,
      metalness: 0.08,
    }),
    redWire: new THREE.MeshStandardMaterial({
      color: PALETTE.red,
      roughness: 0.46,
      metalness: 0.06,
    }),
    blackWire: new THREE.MeshStandardMaterial({
      color: 0x24272b,
      roughness: 0.5,
      metalness: 0.06,
    }),
    clear: new THREE.MeshPhysicalMaterial({
      color: 0xeaf1eb,
      transparent: true,
      opacity: 0.2,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    tape: new THREE.MeshPhysicalMaterial({
      color: 0xe9dcc2,
      transparent: true,
      opacity: 0.48,
      roughness: 0.66,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    glassAmber: new THREE.MeshPhysicalMaterial({
      color: PALETTE.glass,
      transparent: true,
      opacity: 0.48,
      roughness: 0.08,
      metalness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    glassCore: new THREE.MeshStandardMaterial({
      color: 0x9f6a35,
      metalness: 0.45,
      roughness: 0.45,
    }),
    ceramic: new THREE.MeshStandardMaterial({
      color: 0xc9803f,
      roughness: 0.62,
      metalness: 0.02,
    }),
    ceramicEdge: std(0x9d5d2c, { roughness: 0.7 }),
    resistorBody: new THREE.MeshStandardMaterial({
      color: 0xd8c49a,
      roughness: 0.56,
      metalness: 0.04,
    }),
    bandBrown: std(0x5a3a24, { roughness: 0.55 }),
    bandGreen: std(0x2c6a4d, { roughness: 0.55 }),
    bandOrange: std(0xc06a2e, { roughness: 0.55 }),
    bandGold: new THREE.MeshStandardMaterial({
      color: 0xc8a04f,
      metalness: 0.65,
      roughness: 0.35,
    }),
    scopeBody: new THREE.MeshPhysicalMaterial({
      color: 0xdcd4c5,
      roughness: 0.5,
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
    }),
    scopeDark: std(0x232a2e, { roughness: 0.5 }),
    screenBezel: std(0x111820, { roughness: 0.32 }),
    genBody: new THREE.MeshPhysicalMaterial({
      color: 0xd3cdc0,
      roughness: 0.5,
      clearcoat: 0.24,
      clearcoatRoughness: 0.45,
    }),
    dmmYellow: new THREE.MeshPhysicalMaterial({
      color: 0xd7a638,
      roughness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.4,
    }),
    dmmRubber: std(0x393d3d, { roughness: 0.78 }),
    dmmFace: std(0x6e7470, { roughness: 0.45 }),
    screenGreen: new THREE.MeshBasicMaterial({ color: 0xcfe0bd }),
    acrylic: new THREE.MeshPhysicalMaterial({
      color: 0xdfe8e2,
      transparent: true,
      opacity: 0.28,
      roughness: 0.08,
      clearcoat: 1,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
    paper: std(0xf5ecdc, { roughness: 0.96 }),
  };
}

export function tagPart(object, id) {
  object.traverse((o) => {
    if (o.isMesh || o.isSprite) o.userData.part = id;
  });
}

export function setDrawFraction(geometries, fraction) {
  for (const geo of geometries) {
    if (!geo || !geo.index) continue;
    const count = geo.index.count;
    geo.setDrawRange(0, Math.max(2, Math.floor((count * fraction) / 6) * 6));
  }
}
