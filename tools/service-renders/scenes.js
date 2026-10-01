/**
 * Original studio renders for the services imagery — one scene per service, each showing that
 * service's own work and deliverables. Rendered at 2400×1800 and posted to a local receiver for
 * web optimisation. Development-only: nothing here ships with the site.
 *
 * Layout rule for baked-in labels: the site's image card overlays a label strip along the top
 * (~12%) and a caption along the bottom (~20%), so on-image panels stay within roughly 15–75% of
 * the height, and are sized to stay legible when the card is ~650px wide.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const W = 2400;
const H = 1800;
const RECEIVER = 'http://127.0.0.1:5199';
const BRAND_LIGHT = '#8db5ff';
const AMBER = '#f5a524';
const FONT = 'Satoshi, "Segoe UI", Arial, sans-serif';

const fontsReady = Promise.all(['500 44px Satoshi', '700 44px Satoshi', '900 44px Satoshi'].map((f) => document.fonts.load(f))).catch(
  () => undefined,
);

/* ---------------------------------------------------------------- renderer */

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.localClippingEnabled = true;
document.body.appendChild(renderer.domElement);

/**
 * Product-photography environment: bright softboxes in a dark studio, so metals pick up crisp
 * highlights, plus dim surround panels so vertical faces never read as black.
 */
function studioEnvironment() {
  const env = new THREE.Scene();
  env.background = new THREE.Color('#04060c');
  const softbox = (w, h, intensity, position, color = '#ffffff') => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
    );
    m.position.set(...position);
    m.lookAt(0, 0, 0);
    env.add(m);
  };
  softbox(7, 3.5, 5, [0, 9, 1]);
  softbox(2.5, 6, 3.4, [-8, 3, 4]);
  softbox(2.5, 6, 2.4, [8, 2.5, -1]);
  softbox(12, 1.2, 1.8, [0, 2.5, -10], '#a9c2ff');
  softbox(14, 3, 0.35, [0, -4, 7]);
  softbox(24, 7, 0.55, [0, 1.5, 13]);
  softbox(24, 7, 0.4, [-13, 1.5, 0]);
  softbox(24, 7, 0.4, [13, 1.5, 0]);
  softbox(24, 7, 0.3, [0, 1.5, -13], '#b8ccff');
  return new THREE.PMREMGenerator(renderer).fromScene(env, 0).texture;
}
const envTexture = studioEnvironment();

/* ------------------------------------------------------------------ studio */

function canvasTexture(width, height, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  draw(c.getContext('2d'), width, height);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function backdrop() {
  return canvasTexture(1200, 900, (g, w, h) => {
    const grad = g.createRadialGradient(w * 0.5, h * 0.42, 30, w * 0.5, h * 0.52, w * 0.78);
    grad.addColorStop(0, '#24407f');
    grad.addColorStop(0.35, '#132652');
    grad.addColorStop(0.72, '#091533');
    grad.addColorStop(1, '#040915');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
}

function floorGlow(radius, color = '#2f66e0', opacity = 0.3) {
  const map = canvasTexture(512, 512, (g) => {
    const grad = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 512, 512);
  });
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(radius * 2, radius * 2),
    new THREE.MeshBasicMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.002;
  return glow;
}

function studio({ camera, target = [0, 0.5, 0], fov = 30, shadowSize = 8, glow = 5.5, keyIntensity = 1.9 }) {
  const scene = new THREE.Scene();
  scene.background = backdrop();
  scene.environment = envTexture;
  scene.environmentIntensity = 1;

  const key = new THREE.DirectionalLight('#ffffff', keyIntensity);
  key.position.set(4, 10, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 0.5, far: 40 });
  key.shadow.camera.updateProjectionMatrix();
  key.shadow.radius = 10;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  scene.add(key);

  const rim = new THREE.DirectionalLight('#5d8dff', 2.6);
  rim.position.set(-7, 5, -8);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight('#c8d6ff', '#060c20', 0.25));

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);
  scene.add(floorGlow(glow));

  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 200);
  cam.position.set(...camera);
  cam.lookAt(...target);
  return { scene, camera: cam };
}

/* --------------------------------------------------------------- materials */

const mat = {
  steel: () => new THREE.MeshPhysicalMaterial({ color: '#c3c9d2', metalness: 1, roughness: 0.32 }),
  aluminium: () => new THREE.MeshPhysicalMaterial({ color: '#cdd2d9', metalness: 1, roughness: 0.4 }),
  dark: () => new THREE.MeshPhysicalMaterial({ color: '#171e2c', metalness: 0.45, roughness: 0.5 }),
  blackOxide: () => new THREE.MeshPhysicalMaterial({ color: '#2a303b', metalness: 0.9, roughness: 0.45 }),
  blue: () =>
    new THREE.MeshPhysicalMaterial({ color: '#1f5bd8', metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12 }),
  cast: () => new THREE.MeshPhysicalMaterial({ color: '#7d8593', metalness: 0.8, roughness: 0.55 }),
  matte: (color = '#8d95a2') => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.85 }),
  plinth: () => new THREE.MeshPhysicalMaterial({ color: '#0e1628', metalness: 0.3, roughness: 0.3, clearcoat: 0.6 }),
  glow: (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false }),
};

/* ---------------------------------------------------------------- geometry */

function part(geometry, material, { position = [0, 0, 0], rotation = [0, 0, 0], shadow = true } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function hole(x, y, r) {
  const p = new THREE.Path();
  p.absarc(x, y, r, 0, Math.PI * 2, true);
  return p;
}

function slotHole(x, y, w, h) {
  const p = new THREE.Path();
  const r = Math.min(w, h) / 2;
  const left = x - w / 2;
  const bottom = y - h / 2;
  p.moveTo(left + r, bottom);
  p.lineTo(left + w - r, bottom);
  p.absarc(left + w - r, y, r, -Math.PI / 2, Math.PI / 2, false);
  p.lineTo(left + r, bottom + h);
  p.absarc(left + r, y, r, Math.PI / 2, (Math.PI * 3) / 2, false);
  return p;
}

function extrude(shape, depth, bevel = 0.02) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 48,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** Profile in XY laid flat: X stays X, Y becomes −Z, thickness runs along Y (centred). */
function slab(shape, thickness, bevel) {
  const g = extrude(shape, thickness, bevel);
  g.rotateX(-Math.PI / 2);
  return g;
}

function gearGeometry({ teeth, radius, depth = 0.25, bore = 0.12, windows = 0 }) {
  const root = radius * 0.86;
  const step = (Math.PI * 2) / teeth;
  const s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const pts = [
      [root, a],
      [radius, a + step * 0.2],
      [radius, a + step * 0.45],
      [root, a + step * 0.65],
    ];
    pts.forEach(([r, t], j) => {
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (i === 0 && j === 0) s.moveTo(x, y);
      else s.lineTo(x, y);
    });
  }
  s.closePath();
  if (bore) s.holes.push(hole(0, 0, bore));
  for (let k = 0; k < windows; k++) {
    const a = (k / windows) * Math.PI * 2;
    s.holes.push(hole(Math.cos(a) * radius * 0.52, Math.sin(a) * radius * 0.52, radius * 0.16));
  }
  return slab(s, depth, 0.012);
}

function boltGeometry(size = 0.09) {
  const head = new THREE.CylinderGeometry(size, size, size * 0.8, 6);
  head.translate(0, size * 0.4, 0);
  const washer = new THREE.CylinderGeometry(size * 1.25, size * 1.25, size * 0.14, 32);
  washer.translate(0, size * 0.07, 0);
  return mergeGeometries([head, washer]);
}

/** Socket head cap screw head, standing on its base. */
function capScrew(radius = 0.11) {
  const head = new THREE.CylinderGeometry(radius, radius, radius * 1.1, 32);
  head.translate(0, radius * 0.55, 0);
  return head;
}

/** Box segment between two points in the XZ plane at a given height. */
function barBetween([x1, z1], [x2, z2], { y, width = 0.16, height = 0.08 }) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const length = Math.hypot(dx, dz);
  const g = new RoundedBoxGeometry(length + width, height, width, 2, Math.min(width, height) / 2.2);
  const m = new THREE.Mesh(g);
  m.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
  m.rotation.y = Math.atan2(-dz, dx);
  return m;
}

/** Flat-shaded prism from a bottom rectangle to a (possibly different) top rectangle. */
function prism([wb, db], [wt, dt], h, { caps = true, invert = false } = {}) {
  const b = [
    [-wb / 2, 0, -db / 2],
    [wb / 2, 0, -db / 2],
    [wb / 2, 0, db / 2],
    [-wb / 2, 0, db / 2],
  ];
  const t = [
    [-wt / 2, h, -dt / 2],
    [wt / 2, h, -dt / 2],
    [wt / 2, h, dt / 2],
    [-wt / 2, h, dt / 2],
  ];
  const quads = [
    [b[3], b[2], t[2], t[3]],
    [b[2], b[1], t[1], t[2]],
    [b[1], b[0], t[0], t[1]],
    [b[0], b[3], t[3], t[0]],
  ];
  if (caps) {
    quads.push([t[3], t[2], t[1], t[0]]);
    quads.push([b[0], b[1], b[2], b[3]]);
  }
  const positions = [];
  for (const [p0, p1, p2, p3] of quads) {
    const tris = invert
      ? [
          [p0, p2, p1],
          [p0, p3, p2],
        ]
      : [
          [p0, p1, p2],
          [p0, p2, p3],
        ];
    for (const tri of tris) for (const p of tri) positions.push(...p);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  g.computeVertexNormals();
  return g;
}

/** Non-indexed geometry with only position + normal, so different builders can be merged. */
function clean(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  for (const key of Object.keys(g.attributes)) if (key !== 'position' && key !== 'normal') g.deleteAttribute(key);
  g.clearGroups();
  return g;
}

function invertNormals(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i += 3) {
    for (let k = 0; k < 3; k++) {
      const tmp = pos.getComponent(i + 1, k);
      pos.setComponent(i + 1, k, pos.getComponent(i + 2, k));
      pos.setComponent(i + 2, k, tmp);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** Glowing annotation arrow from one point to another (load paths, pull direction). */
function arrow3d(from, to, color = AMBER, radius = 0.045) {
  const start = new THREE.Vector3(...from);
  const dir = new THREE.Vector3(...to).sub(start);
  const len = dir.length();
  const tipLen = Math.min(0.32, len * 0.4);
  const material = mat.glow(color);
  const group = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len - tipLen, 16), material);
  shaft.position.y = (len - tipLen) / 2;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(radius * 2.8, tipLen, 24), material);
  tip.position.y = len - tipLen / 2;
  group.add(shaft, tip);
  group.position.copy(start);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return group;
}

/* ------------------------------------------------------------------- lines */

function fatLine(points, { color = BRAND_LIGHT, width = 3, dashed = false, opacity = 1, dash = 0.14, gap = 0.1 } = {}) {
  const geo = new LineGeometry();
  geo.setPositions(points.flat());
  const m = new LineMaterial({ color, linewidth: width, dashed, dashSize: dash, gapSize: gap, transparent: true, opacity, toneMapped: false });
  m.resolution.set(W, H);
  const line = new Line2(geo, m);
  if (dashed) line.computeLineDistances();
  return line;
}

function circlePoints(cx, y, cz, r, from = 0, to = Math.PI * 2, n = 96) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = from + ((to - from) * i) / n;
    pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]);
  }
  return pts;
}

function edgeLines(geometry, { color = '#0b1535', width = 2.2, angle = 25, opacity = 0.85 } = {}) {
  const geo = new LineSegmentsGeometry().fromEdgesGeometry(new THREE.EdgesGeometry(geometry, angle));
  const m = new LineMaterial({ color, linewidth: width, transparent: true, opacity, toneMapped: false });
  m.resolution.set(W, H);
  return new LineSegments2(geo, m);
}

function label(text, { height = 0.3, color = '#dbe7ff', weight = 700 } = {}) {
  const font = `${weight} 88px ${FONT}`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const w = Math.ceil(probe.measureText(text).width) + 48;
  const map = canvasTexture(w, 128, (g) => {
    g.font = font;
    g.fillStyle = color;
    g.textBaseline = 'middle';
    g.fillText(text, 24, 68);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false }));
  sprite.scale.set((height * w) / 128, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/** CAD-style driving-dimension box, e.g. "D1 = Ø180". */
function paramTag(text, { height = 0.36 } = {}) {
  const font = `700 84px ${FONT}`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const w = Math.ceil(probe.measureText(text).width) + 96;
  const h = 140;
  const map = canvasTexture(w, h, (g) => {
    g.fillStyle = 'rgba(8, 18, 48, 0.88)';
    g.strokeStyle = BRAND_LIGHT;
    g.lineWidth = 6;
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, 26);
    g.fill();
    g.stroke();
    g.font = font;
    g.fillStyle = '#eef3ff';
    g.textBaseline = 'middle';
    g.fillText(text, 48, h / 2 + 4);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false }));
  sprite.scale.set((height * w) / h, height, 1);
  sprite.renderOrder = 10;
  return sprite;
}

/* --------------------------------------------------------------------- HUD */

const HUD = {
  bg: 'rgba(6, 12, 32, 0.8)',
  border: 'rgba(141, 181, 255, 0.42)',
  title: '#a9c2ff',
  text: '#eef3ff',
  green: '#34d178',
  red: '#ef5a5f',
};

function hudIcon(g, cx, cy, { icon = 'dot', color = BRAND_LIGHT, n }) {
  g.save();
  if (icon === 'check') {
    g.strokeStyle = color;
    g.lineWidth = 7;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(cx - 15, cy + 1);
    g.lineTo(cx - 4, cy + 13);
    g.lineTo(cx + 17, cy - 13);
    g.stroke();
  } else if (icon === 'num') {
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cy, 24, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#08112b';
    g.font = `900 30px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(n), cx, cy + 2);
  } else {
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cy, 11, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

/** Titled panel with up to three short rows. `anchor` sets which edge `x` refers to. */
function hudPanel(g, { x, y, title, rows, anchor = 'left' }) {
  g.save();
  const titleFont = `700 36px ${FONT}`;
  const rowFont = `500 44px ${FONT}`;
  g.font = rowFont;
  const textWidth = Math.max(...rows.map((r) => g.measureText(r.text).width));
  g.font = titleFont;
  g.letterSpacing = '5px';
  const titleWidth = g.measureText(title).width;
  const width = Math.max(titleWidth + 96, textWidth + 156);
  const rowH = 76;
  const height = 98 + rows.length * rowH + 10;
  const left = anchor === 'right' ? x - width : x;

  g.fillStyle = HUD.bg;
  g.strokeStyle = HUD.border;
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(left, y, width, height, 28);
  g.fill();
  g.stroke();

  g.fillStyle = HUD.title;
  g.textBaseline = 'middle';
  g.fillText(title, left + 48, y + 60);
  g.letterSpacing = '0px';
  rows.forEach((row, i) => {
    const cy = y + 98 + i * rowH + rowH / 2 - 8;
    hudIcon(g, left + 72, cy, row);
    g.font = rowFont;
    g.fillStyle = HUD.text;
    g.fillText(row.text, left + 118, cy + 2);
  });
  g.restore();
}

/** Centred label with an optional smaller second line. */
function hudTag(g, [x, y], text, sub, { accent = BRAND_LIGHT } = {}) {
  g.save();
  const main = `700 44px ${FONT}`;
  const small = `500 34px ${FONT}`;
  g.font = main;
  g.letterSpacing = '3px';
  const mw = g.measureText(text).width;
  g.letterSpacing = '0px';
  g.font = small;
  const sw = sub ? g.measureText(sub).width : 0;
  const width = Math.max(mw, sw) + 88;
  const height = sub ? 138 : 88;
  const left = x - width / 2;
  const top = y - height / 2;
  g.fillStyle = HUD.bg;
  g.strokeStyle = HUD.border;
  g.lineWidth = 3;
  g.beginPath();
  g.roundRect(left, top, width, height, 26);
  g.fill();
  g.stroke();
  g.fillStyle = accent;
  g.fillRect(left + 30, top + (sub ? 34 : 30), 6, sub ? 70 : 28);
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.font = main;
  g.letterSpacing = '3px';
  g.fillStyle = HUD.text;
  g.fillText(text, left + 56, top + (sub ? 48 : height / 2 + 2));
  g.letterSpacing = '0px';
  if (sub) {
    g.font = small;
    g.fillStyle = HUD.title;
    g.fillText(sub, left + 56, top + 96);
  }
  g.restore();
}

/** Numbered review marker with a short leader down to the feature it refers to. */
function hudPin(g, [x, y], n, color, lift = 110) {
  g.save();
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - lift + 32);
  g.stroke();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(x, y, 8, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = color;
  g.strokeStyle = '#ffffff';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(x, y - lift, 34, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#08112b';
  g.font = `900 38px ${FONT}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), x, y - lift + 2);
  g.restore();
}

/** Row of small pills, e.g. export formats. */
function hudChips(g, [x, y], title, chips, { anchor = 'left' } = {}) {
  g.save();
  const chipFont = `700 38px ${FONT}`;
  const titleFont = `700 32px ${FONT}`;
  g.font = chipFont;
  g.letterSpacing = '3px';
  const widths = chips.map((c) => g.measureText(c).width + 56);
  g.font = titleFont;
  const titleWidth = g.measureText(title).width + 28;
  const total = titleWidth + widths.reduce((a, b) => a + b, 0) + (chips.length - 1) * 16;
  let cursor = anchor === 'right' ? x - total : x;
  g.textBaseline = 'middle';
  g.fillStyle = HUD.title;
  g.fillText(title, cursor, y);
  cursor += titleWidth;
  chips.forEach((c, i) => {
    g.fillStyle = HUD.bg;
    g.strokeStyle = BRAND_LIGHT;
    g.lineWidth = 3;
    g.beginPath();
    g.roundRect(cursor, y - 34, widths[i], 68, 34);
    g.fill();
    g.stroke();
    g.font = chipFont;
    g.fillStyle = HUD.text;
    g.fillText(c, cursor + 28, y + 2);
    g.font = titleFont;
    cursor += widths[i] + 16;
  });
  g.restore();
}

/* ------------------------------------------------------------- shared part */

/** Bearing flange: bolted plate, boss with bore and (optionally) three gussets. */
function flangeGeometries({ ribs: withRibs = true } = {}) {
  const plateShape = new THREE.Shape();
  plateShape.absarc(0, 0, 1.8, 0, Math.PI * 2, false);
  plateShape.holes.push(hole(0, 0, 0.56));
  for (const [x, y] of boltCircle()) plateShape.holes.push(hole(x, y, 0.13));
  const plate = slab(plateShape, 0.32, 0.03);
  plate.translate(0, 0.19, 0);

  const bossOuter = new THREE.CylinderGeometry(0.95, 0.95, 1.0, 96, 1, true);
  bossOuter.translate(0, 0.85, 0);
  const bore = invertNormals(new THREE.CylinderGeometry(0.56, 0.56, 1.36, 96, 1, true));
  bore.translate(0, 0.68, 0);
  const bossTop = new THREE.RingGeometry(0.56, 0.95, 96);
  bossTop.rotateX(-Math.PI / 2);
  bossTop.translate(0, 1.35, 0);

  if (!withRibs) return [plate, bossOuter, bore, bossTop];
  const ribs = [0, 1, 2].map((k) => {
    const s = new THREE.Shape();
    s.moveTo(0.9, 0.35);
    s.lineTo(1.55, 0.35);
    s.lineTo(0.9, 1.12);
    s.closePath();
    const g = extrude(s, 0.12, 0.01);
    g.rotateY((k / 3) * Math.PI * 2);
    return g;
  });
  return [plate, bossOuter, bore, bossTop, ...ribs];
}

/** Bolt-hole centres in the flange's profile plane (x, y); world position is (x, top, −y). */
function boltCircle() {
  return Array.from({ length: 6 }, (_, k) => {
    const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
    return [Math.cos(a) * 1.38, Math.sin(a) * 1.38];
  });
}

/* ================================================================== scenes */

/**
 * 01 · Mechanical Product Design — requirement to mechanism: gear train, crank and slider laid out
 * on a base, with the motion study, load paths and a layout-review panel.
 */
function mechanicalProductDesign() {
  const { scene, camera } = studio({ camera: [5.4, 5.9, 7.6], target: [0.35, 0.45, -0.35], fov: 30 });

  scene.add(part(new RoundedBoxGeometry(6.6, 0.28, 4.4, 4, 0.08), mat.dark(), { position: [0, 0.14, 0] }));
  const bolt = boltGeometry(0.1);
  for (const [x, z] of [
    [-3.0, -1.9],
    [3.0, -1.9],
    [-3.0, 1.9],
    [3.0, 1.9],
  ])
    scene.add(part(bolt, mat.steel(), { position: [x, 0.28, z] }));

  const big = { x: -1.35, z: 0.55, r: 1.3 };
  const small = { x: -1.35 + (1.3 + 0.66) * 0.93, z: 0.55, r: 0.66 };
  for (const g of [big, small]) {
    scene.add(part(new THREE.CylinderGeometry(0.26, 0.3, 0.2, 48), mat.steel(), { position: [g.x, 0.38, g.z] }));
    scene.add(part(new THREE.CylinderGeometry(0.1, 0.1, 0.95, 32), mat.steel(), { position: [g.x, 0.75, g.z] }));
  }
  scene.add(part(gearGeometry({ teeth: 36, radius: big.r, depth: 0.22, bore: 0.1, windows: 5 }), mat.steel(), { position: [big.x, 0.6, big.z] }));
  scene.add(
    part(gearGeometry({ teeth: 18, radius: small.r, depth: 0.22, bore: 0.1 }), mat.blue(), {
      position: [small.x, 0.6, small.z],
      rotation: [0, Math.PI / 18, 0],
    }),
  );

  const pin = [big.x - 0.45, big.z - 0.78];
  const sliderX = 1.25;
  const railZ = -1.55;
  const crank = barBetween([big.x, big.z], pin, { y: 0.84, width: 0.24, height: 0.08 });
  scene.add(part(crank.geometry, mat.steel(), { position: crank.position.toArray(), rotation: [0, crank.rotation.y, 0] }));
  scene.add(part(new THREE.CylinderGeometry(0.075, 0.075, 0.24, 24), mat.steel(), { position: [pin[0], 0.9, pin[1]] }));
  scene.add(part(new RoundedBoxGeometry(5.4, 0.14, 0.26, 2, 0.04), mat.steel(), { position: [0.2, 0.35, railZ] }));
  for (const x of [-2.3, 2.7]) scene.add(part(new RoundedBoxGeometry(0.3, 0.2, 0.5, 2, 0.05), mat.dark(), { position: [x, 0.38, railZ] }));
  scene.add(part(new RoundedBoxGeometry(0.85, 0.36, 0.56, 3, 0.06), mat.blue(), { position: [sliderX, 0.6, railZ] }));
  scene.add(part(new THREE.CylinderGeometry(0.075, 0.075, 0.28, 24), mat.steel(), { position: [sliderX, 0.86, railZ] }));
  const rod = barBetween(pin, [sliderX, railZ], { y: 0.98, width: 0.16, height: 0.07 });
  scene.add(part(rod.geometry, mat.steel(), { position: rod.position.toArray(), rotation: [0, rod.rotation.y, 0] }));

  // Motion study: crank path, slider stroke and a ghosted design option at the end of stroke.
  scene.add(fatLine(circlePoints(big.x, 0.9, big.z, 0.9), { dashed: true, width: 4 }));
  scene.add(fatLine([[-1.6, 0.8, railZ + 0.42], [2.2, 0.8, railZ + 0.42]], { width: 4 }));
  for (const x of [-1.6, 2.2]) scene.add(fatLine([[x, 0.68, railZ + 0.42], [x, 0.92, railZ + 0.42]], { width: 4 }));
  const ghostGeo = new RoundedBoxGeometry(0.85, 0.36, 0.56, 3, 0.06);
  const ghost = new THREE.Mesh(ghostGeo, new THREE.MeshBasicMaterial({ color: '#3b74ff', transparent: true, opacity: 0.12, depthWrite: false }));
  ghost.position.set(-0.75, 0.6, railZ);
  ghost.add(edgeLines(ghostGeo, { color: BRAND_LIGHT, width: 2.6, opacity: 0.95 }));
  scene.add(ghost);

  // Load paths: input torque on the drive gear, output force at the slider.
  scene.add(fatLine(circlePoints(big.x, 1.32, big.z, 0.42, Math.PI * 0.15, Math.PI * 1.45), { color: AMBER, width: 6 }));
  const end = Math.PI * 1.45;
  const tipFrom = [big.x + Math.cos(end) * 0.42, 1.32, big.z + Math.sin(end) * 0.42];
  const tipTo = [tipFrom[0] + 0.24, 1.32, tipFrom[2] - 0.02];
  scene.add(arrow3d(tipFrom, tipTo, AMBER, 0.03));
  scene.add(arrow3d([sliderX + 0.5, 0.6, railZ], [sliderX + 1.35, 0.6, railZ], AMBER, 0.05));

  const hud = (g) =>
    hudPanel(g, {
      x: W - 90,
      y: 1000,
      anchor: 'right',
      title: 'LAYOUT STUDY',
      rows: [
        { icon: 'check', color: HUD.green, text: 'Motion range' },
        { icon: 'check', color: HUD.green, text: 'Load paths' },
        { icon: 'check', color: HUD.green, text: 'Assembly order' },
      ],
    });
  return { scene, camera, hud };
}

/**
 * 02 · 3D CAD Modeling — a structured assembly (flange, shaft, bearing, screws) with driving
 * parameters, the model tree and neutral export formats.
 */
function cadModeling() {
  const { scene, camera } = studio({ camera: [6.2, 5.4, 6.6], target: [0.35, 0.95, 0.2], fov: 30, glow: 4.5 });

  const grid = new THREE.GridHelper(16, 32, '#3a6ae0', '#1f3a7a');
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  grid.position.y = 0.003;
  scene.add(grid);

  const body = mat.aluminium();
  for (const g of flangeGeometries()) {
    const m = part(g, body);
    m.add(edgeLines(g, { color: '#0a1433', width: 2.4, angle: 28, opacity: 0.9 }));
    scene.add(m);
  }
  // Shaft, bearing and six cap screws make it an assembly.
  scene.add(part(new THREE.CylinderGeometry(0.42, 0.42, 2.1, 64), mat.steel(), { position: [0, 1.07, 0] }));
  scene.add(part(new THREE.TorusGeometry(0.49, 0.07, 24, 96), mat.blackOxide(), { position: [0, 1.4, 0], rotation: [Math.PI / 2, 0, 0] }));
  const seal = new THREE.RingGeometry(0.43, 0.55, 96);
  seal.rotateX(-Math.PI / 2);
  scene.add(part(seal, mat.blue(), { position: [0, 1.47, 0] }));
  const screw = capScrew(0.11);
  for (const [x, y] of boltCircle()) scene.add(part(screw, mat.blackOxide(), { position: [x, 0.38, -y] }));

  // Driving dimensions shown as editable parameters.
  const z = 2.35;
  scene.add(fatLine([[-1.8, 0.04, 0], [-1.8, 0.04, z + 0.15]], { width: 2.4, opacity: 0.8 }));
  scene.add(fatLine([[1.8, 0.04, 0], [1.8, 0.04, z + 0.15]], { width: 2.4, opacity: 0.8 }));
  scene.add(fatLine([[-1.8, 0.04, z], [1.8, 0.04, z]], { width: 3.2 }));
  for (const [x, s] of [
    [-1.8, 1],
    [1.8, -1],
  ])
    scene.add(fatLine([[x + s * 0.16, 0.04, z - 0.07], [x, 0.04, z], [x + s * 0.16, 0.04, z + 0.07]], { width: 3.2 }));
  const d1 = paramTag('D1 = Ø180');
  d1.position.set(0, 0.3, z + 0.02);
  scene.add(d1);

  const hx = 1.35;
  const hz = -1.35;
  scene.add(fatLine([[0.95, 1.35, 0], [hx + 0.12, 1.35, hz]], { width: 2.2, opacity: 0.75 }));
  scene.add(fatLine([[hx, 0, hz], [hx, 1.35, hz]], { width: 3.2 }));
  for (const [y, s] of [
    [0, 1],
    [1.35, -1],
  ])
    scene.add(fatLine([[hx - 0.07, y + s * 0.16, hz], [hx, y, hz], [hx + 0.07, y + s * 0.16, hz]], { width: 3.2 }));
  const h1 = paramTag('H1 = 66');
  h1.position.set(hx + 0.75, 0.72, hz);
  scene.add(h1);

  const hud = (g) => {
    hudPanel(g, {
      x: 90,
      y: 300,
      title: 'MODEL TREE',
      rows: [
        { icon: 'dot', color: BRAND_LIGHT, text: 'Base profile' },
        { icon: 'dot', color: BRAND_LIGHT, text: 'Hole pattern ×6' },
        { icon: 'dot', color: '#34d178', text: 'Shaft assembly' },
      ],
    });
    hudChips(g, [W - 90, 1240], 'EXPORT', ['STEP', 'IGES', 'STL'], { anchor: 'right' });
  };
  return { scene, camera, hud };
}

function paperSheet(g, w, h, { fill = '#f6f7fa', ink = '#1d2c52' } = {}) {
  g.fillStyle = fill;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = ink;
  g.fillStyle = ink;
  g.lineWidth = 6;
  g.strokeRect(40, 40, w - 80, h - 80);
  g.lineWidth = 2;
  g.strokeRect(62, 62, w - 124, h - 124);
}

function drawingHelpers(g, ink, faint) {
  const arrowLine = (x1, y1, x2, y2) => {
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    const ang = Math.atan2(y2 - y1, x2 - x1);
    for (const [x, y, a] of [
      [x1, y1, ang],
      [x2, y2, ang + Math.PI],
    ]) {
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a + 0.28) * 26, y + Math.sin(a + 0.28) * 26);
      g.lineTo(x + Math.cos(a - 0.28) * 26, y + Math.sin(a - 0.28) * 26);
      g.closePath();
      g.fill();
    }
  };
  const centerLine = (x1, y1, x2, y2) => {
    g.save();
    g.strokeStyle = faint;
    g.lineWidth = 2;
    g.setLineDash([40, 10, 6, 10]);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
    g.restore();
  };
  const text = (t, x, y, size = 30, align = 'center', weight = 600) => {
    g.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillStyle = ink;
    g.fillText(t, x, y);
  };
  return { arrowLine, centerLine, text };
}

function drawingSheetTexture() {
  return canvasTexture(2048, 1448, (g, w, h) => {
    const ink = '#1d2c52';
    const faint = 'rgba(29,44,82,0.55)';
    paperSheet(g, w, h, { ink });
    const { arrowLine, centerLine, text } = drawingHelpers(g, ink, faint);

    // Front view
    const s = 150;
    const cx = 470;
    const cy = 640;
    g.strokeStyle = ink;
    g.lineWidth = 4;
    for (const r of [1.8, 0.95]) {
      g.beginPath();
      g.arc(cx, cy, r * s, 0, Math.PI * 2);
      g.stroke();
    }
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, 0.56 * s, 0, Math.PI * 2);
    g.stroke();
    for (const [bx, by] of boltCircle()) {
      g.beginPath();
      g.arc(cx + bx * s, cy - by * s, 0.13 * s, 0, Math.PI * 2);
      g.stroke();
    }
    centerLine(cx - 330, cy, cx + 330, cy);
    centerLine(cx, cy - 330, cx, cy + 330);
    g.save();
    g.strokeStyle = faint;
    g.setLineDash([40, 10, 6, 10]);
    g.lineWidth = 2;
    g.beginPath();
    g.arc(cx, cy, 1.38 * s, 0, Math.PI * 2);
    g.stroke();
    g.restore();
    // Detail B marker around one bolt hole
    const [dbx, dby] = boltCircle()[0];
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx + dbx * s, cy - dby * s, 52, 0, Math.PI * 2);
    g.stroke();
    text('B', cx + dbx * s + 70, cy - dby * s - 52, 34, 'center', 700);

    g.lineWidth = 2.5;
    arrowLine(cx - 1.8 * s, cy + 350, cx + 1.8 * s, cy + 350);
    g.beginPath();
    g.moveTo(cx - 1.8 * s, cy + 40);
    g.lineTo(cx - 1.8 * s, cy + 370);
    g.moveTo(cx + 1.8 * s, cy + 40);
    g.lineTo(cx + 1.8 * s, cy + 370);
    g.stroke();
    text('Ø180 h9', cx, cy + 322, 32);
    text('6× Ø13 EQ SP ON PCD 138', cx + 40, cy - 350, 26, 'center', 500);

    // Section A–A
    const sx = 1110;
    const base = 900;
    const px = (u) => sx + u * s;
    const py = (v) => base - v * s;
    const hatch = (poly) => {
      g.save();
      g.beginPath();
      poly.forEach(([u, v], i) => (i ? g.lineTo(px(u), py(v)) : g.moveTo(px(u), py(v))));
      g.closePath();
      g.lineWidth = 4;
      g.strokeStyle = ink;
      g.stroke();
      g.clip();
      g.lineWidth = 2;
      g.strokeStyle = faint;
      for (let d = -600; d < 900; d += 22) {
        g.beginPath();
        g.moveTo(px(-2) + d, py(-0.2));
        g.lineTo(px(-2) + d + 400, py(-0.2) - 400);
        g.stroke();
      }
      g.restore();
    };
    for (const side of [-1, 1]) {
      hatch([
        [side * 0.56, 0],
        [side * 1.8, 0],
        [side * 1.8, 0.32],
        [side * 0.95, 0.32],
        [side * 0.95, 1.32],
        [side * 0.56, 1.32],
      ]);
    }
    centerLine(px(0), py(-0.25), px(0), py(1.6));
    g.lineWidth = 2.5;
    g.strokeStyle = ink;
    arrowLine(px(-2.15), py(0), px(-2.15), py(1.32));
    g.beginPath();
    g.moveTo(px(-0.95), py(1.32));
    g.lineTo(px(-2.3), py(1.32));
    g.moveTo(px(-1.8), py(0));
    g.lineTo(px(-2.3), py(0));
    g.stroke();
    text('66 ±0.1', px(-2.26), py(0.66), 30, 'right');
    arrowLine(px(-0.56), py(1.62), px(0.56), py(1.62));
    g.beginPath();
    g.moveTo(px(-0.56), py(1.36));
    g.lineTo(px(-0.56), py(1.75));
    g.moveTo(px(0.56), py(1.36));
    g.lineTo(px(0.56), py(1.75));
    g.stroke();
    text('Ø56 H7', px(0), py(1.86), 30);
    // Position tolerance frame
    const fx = px(0.75);
    const fy = py(1.86) - 30;
    g.lineWidth = 3;
    g.strokeRect(fx, fy, 250, 60);
    g.beginPath();
    g.moveTo(fx + 64, fy);
    g.lineTo(fx + 64, fy + 60);
    g.moveTo(fx + 196, fy);
    g.lineTo(fx + 196, fy + 60);
    g.stroke();
    g.beginPath();
    g.arc(fx + 32, fy + 30, 15, 0, Math.PI * 2);
    g.moveTo(fx + 12, fy + 30);
    g.lineTo(fx + 52, fy + 30);
    g.moveTo(fx + 32, fy + 10);
    g.lineTo(fx + 32, fy + 50);
    g.stroke();
    text('Ø0.05', fx + 130, fy + 31, 28, 'center', 600);
    text('A', fx + 223, fy + 31, 28, 'center', 700);
    // Datum A on the mounting face
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(px(1.3) - 20, py(0));
    g.lineTo(px(1.3) + 20, py(0));
    g.lineTo(px(1.3), py(0) + 30);
    g.closePath();
    g.fill();
    g.strokeRect(px(1.3) - 24, py(0) + 46, 48, 48);
    text('A', px(1.3), py(0) + 71, 28, 'center', 700);
    text('SECTION A–A', sx, base + 140, 34, 'center', 700);

    // Detail B (2:1): counterbored bolt hole
    const dx = 1720;
    const dy = 720;
    g.strokeStyle = ink;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(dx, dy, 190, 0, Math.PI * 2);
    g.stroke();
    g.save();
    g.beginPath();
    g.arc(dx, dy, 188, 0, Math.PI * 2);
    g.clip();
    const cb = [
      [-190, -60],
      [-78, -60],
      [-78, -10],
      [-40, -10],
      [-40, 90],
      [-190, 90],
    ];
    for (const side of [-1, 1]) {
      g.beginPath();
      cb.forEach(([u, v], i) => (i ? g.lineTo(dx + side * u, dy + v) : g.moveTo(dx + side * u, dy + v)));
      g.closePath();
      g.lineWidth = 4;
      g.stroke();
      g.save();
      g.clip();
      g.strokeStyle = faint;
      g.lineWidth = 2;
      for (let d = -500; d < 500; d += 22) {
        g.beginPath();
        g.moveTo(dx + d, dy + 200);
        g.lineTo(dx + d + 400, dy - 200);
        g.stroke();
      }
      g.restore();
    }
    g.restore();
    g.lineWidth = 2.5;
    arrowLine(dx - 78, dy - 110, dx + 78, dy - 110);
    text('Ø20', dx, dy - 140, 28);
    text('DETAIL B  (2:1)', dx, dy + 235, 30, 'center', 700);

    // Bill of materials
    const bx = 1320;
    const by = 110;
    const cols = [bx, bx + 90, bx + 380, bx + 470, w - 82];
    const rowsBom = [
      ['ITEM', 'DESCRIPTION', 'QTY', 'MATERIAL'],
      ['1', 'Bearing flange', '1', 'AL 6061-T6'],
      ['2', 'Drive shaft', '1', 'EN8 steel'],
      ['3', 'Bearing 6205', '1', 'Bought out'],
      ['4', 'M12 cap screw', '6', 'A2-70'],
    ];
    g.strokeStyle = ink;
    g.lineWidth = 3;
    g.strokeRect(bx, by, cols[4] - bx, rowsBom.length * 48);
    rowsBom.forEach((row, r) => {
      const y = by + r * 48;
      if (r) {
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(bx, y);
        g.lineTo(cols[4], y);
        g.stroke();
      } else {
        g.fillStyle = 'rgba(29,44,82,0.1)';
        g.fillRect(bx, y, cols[4] - bx, 48);
      }
      row.forEach((cell, c) => text(cell, cols[c] + 16, y + 25, r ? 23 : 21, 'left', r ? 500 : 700));
    });
    g.lineWidth = 1.5;
    for (const x of cols.slice(1, 4)) {
      g.beginPath();
      g.moveTo(x, by);
      g.lineTo(x, by + rowsBom.length * 48);
      g.stroke();
    }

    // Notes
    text('NOTES', 110, 1170, 30, 'left', 700);
    text('1. BREAK ALL SHARP EDGES 0.5 × 45°', 110, 1215, 25, 'left', 500);
    text('2. GENERAL TOLERANCE ISO 2768-mK', 110, 1255, 25, 'left', 500);
    text('3. ANODISE CLEAR, 15 µm', 110, 1295, 25, 'left', 500);

    // Title block
    const tbx = 1330;
    const tby = 1110;
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.strokeRect(tbx, tby, w - 62 - tbx, h - 62 - tby);
    g.lineWidth = 2;
    for (const y of [tby + 92, tby + 184]) {
      g.beginPath();
      g.moveTo(tbx, y);
      g.lineTo(w - 62, y);
      g.stroke();
    }
    for (const x of [tbx + 300, tbx + 430]) {
      g.beginPath();
      g.moveTo(x, tby + 92);
      g.lineTo(x, h - 62);
      g.stroke();
    }
    text('DIMENSHIFT', tbx + 26, tby + 46, 40, 'left', 800);
    text('FLANGE ASSEMBLY', w - 90, tby + 46, 30, 'right', 600);
    text('MATERIAL  AS BOM', tbx + 26, tby + 138, 24, 'left', 500);
    text('SCALE 1:2', tbx + 365, tby + 138, 24, 'center', 500);
    text('REV B', tbx + 452, tby + 138, 24, 'left', 500);
    text('DWG NO. DS-1042', tbx + 26, tby + 222, 24, 'left', 500);
    text('A3', tbx + 365, tby + 222, 24, 'center', 500);
    text('SHEET 1 OF 2', tbx + 452, tby + 222, 22, 'left', 500);
  });
}

function assemblySheetTexture() {
  return canvasTexture(2048, 1448, (g, w, h) => {
    const ink = '#1d2c52';
    const faint = 'rgba(29,44,82,0.5)';
    paperSheet(g, w, h, { fill: '#eef0f5', ink });
    const { centerLine, text } = drawingHelpers(g, ink, faint);
    // Exploded assembly outline with balloons along the left edge (the part of the sheet that shows).
    centerLine(360, 140, 360, 1000);
    g.strokeStyle = ink;
    g.lineWidth = 4;
    g.strokeRect(300, 180, 120, 420);
    g.strokeRect(180, 640, 360, 60);
    g.strokeRect(250, 740, 220, 110);
    g.strokeRect(290, 890, 140, 60);
    [
      [620, 380, 1],
      [620, 670, 2],
      [620, 795, 3],
      [620, 920, 4],
    ].forEach(([bx, by, n]) => {
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(430, by);
      g.lineTo(bx - 34, by);
      g.stroke();
      g.lineWidth = 3;
      g.beginPath();
      g.arc(bx, by, 34, 0, Math.PI * 2);
      g.stroke();
      text(String(n), bx, by + 1, 30, 'center', 700);
    });
    text('FLANGE ASSEMBLY · SHEET 2 OF 2', 110, 110, 30, 'left', 700);
  });
}

/**
 * 03 · Engineering Drawings — a supplier-ready sheet: front view, section A–A, detail B,
 * tolerances with GD&T, bill of materials, notes and title block, over its assembly sheet.
 */
function engineeringDrawings() {
  const { scene, camera } = studio({ camera: [0.35, 9.2, 6.4], target: [0.1, 0, 0.6], fov: 32, glow: 6.5 });
  const width = 7.4;
  const depth = width / 1.4142;

  const under = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: assemblySheetTexture(), color: '#cfd3db', roughness: 0.92, envMapIntensity: 0.2 }),
  );
  under.rotation.set(-Math.PI / 2, 0, 0.13);
  under.position.set(-0.55, 0.003, -0.1);
  under.receiveShadow = true;
  scene.add(under);

  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: drawingSheetTexture(), color: '#dfe2e8', roughness: 0.9, envMapIntensity: 0.25 }),
  );
  sheet.rotation.set(-Math.PI / 2, 0, 0.02);
  sheet.position.set(0.25, 0.008, 0.3);
  sheet.receiveShadow = true;
  scene.add(sheet);

  const pencil = new THREE.Group();
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: '#1f4fbf', metalness: 0.2, roughness: 0.35, clearcoat: 1 });
  pencil.add(part(new THREE.CylinderGeometry(0.075, 0.075, 3.0, 6), bodyMat));
  pencil.add(part(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 32), mat.steel(), { position: [0, 1.62, 0] }));
  pencil.add(part(new THREE.ConeGeometry(0.075, 0.3, 32), mat.steel(), { position: [0, -1.65, 0], rotation: [Math.PI, 0, 0] }));
  pencil.add(part(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12), mat.dark(), { position: [0, -1.86, 0] }));
  pencil.rotation.set(0, 0.12, Math.PI / 2);
  pencil.position.set(-1.0, 0.085, 3.3);
  scene.add(pencil);
  return { scene, camera };
}

/**
 * 04 · Design for Manufacturing — a moulded enclosure's manufacturability review: draft analysis
 * colours, numbered findings on the part and the review summary.
 */
function designForManufacturing() {
  const { scene, camera } = studio({ camera: [6.2, 7.2, 7.6], target: [0.45, 0.45, 0], fov: 30, glow: 5 });

  const pieces = [];
  const add = (geometry, [x, y, z] = [0, 0, 0]) => {
    geometry.translate(x, y, z);
    pieces.push(clean(geometry));
  };
  add(prism([4.0, 2.86], [4.2, 3.0], 1.3, { caps: false }));
  add(prism([3.76, 2.62], [3.96, 2.76], 1.16, { caps: false, invert: true }), [0, 0.14, 0]);
  const rimShape = roundedRect(4.2, 3.0, 0.001);
  rimShape.holes.push(roundedRect(3.96, 2.76, 0.001));
  const rim = new THREE.ShapeGeometry(rimShape);
  rim.rotateX(-Math.PI / 2);
  add(rim, [0, 1.3, 0]);
  const floor = new THREE.ShapeGeometry(roundedRect(3.76, 2.62, 0.001));
  floor.rotateX(-Math.PI / 2);
  add(floor, [0, 0.14, 0]);
  add(prism([3.3, 0.11], [3.3, 0.07], 0.78), [0, 0.14, -0.55]);
  add(prism([3.3, 0.11], [3.3, 0.07], 0.78), [0, 0.14, 0.55]);
  add(prism([0.11, 2.3], [0.07, 2.3], 0.78), [0, 0.14, 0]);
  for (const [x, z] of [
    [-1.55, -1.05],
    [1.55, -1.05],
    [-1.55, 1.05],
    [1.55, 1.05],
  ]) {
    add(new THREE.CylinderGeometry(0.2, 0.2, 1.0, 48, 1, true), [x, 0.64, z]);
    const top = new THREE.RingGeometry(0.08, 0.2, 48);
    top.rotateX(-Math.PI / 2);
    add(top, [x, 1.14, z]);
    const inner = new THREE.CircleGeometry(0.08, 32);
    inner.rotateX(-Math.PI / 2);
    add(inner, [x, 1.12, z]);
  }

  const housing = mergeGeometries(pieces);
  const normals = housing.attributes.normal;
  const colors = new Float32Array(normals.count * 3);
  const green = new THREE.Color('#1fb45a');
  const amber = new THREE.Color('#f29d12');
  const red = new THREE.Color('#e5484d');
  for (let i = 0; i < normals.count; i++) {
    const deg = (Math.asin(Math.min(1, Math.abs(normals.getY(i)))) * 180) / Math.PI;
    const c = deg >= 2 ? green : deg >= 0.5 ? amber : red;
    colors.set([c.r, c.g, c.b], i * 3);
  }
  housing.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = part(housing, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0, envMapIntensity: 0.6, side: THREE.DoubleSide }));
  mesh.add(edgeLines(housing, { color: '#0b1535', width: 1.6, angle: 35, opacity: 0.55 }));
  scene.add(mesh);

  scene.add(arrow3d([-3.3, 0.15, 0.7], [-3.3, 1.75, 0.7], BRAND_LIGHT, 0.04));
  const pull = label('PULL', { height: 0.28, color: BRAND_LIGHT, weight: 700 });
  pull.position.set(-3.3, 2.05, 0.7);
  scene.add(pull);

  const hud = (g, project) => {
    hudPin(g, project(1.55, 1.14, 1.05), 1, HUD.red);
    hudPin(g, project(0.9, 0.92, -0.55), 2, AMBER);
    hudPin(g, project(-1.2, 0.7, 1.47), 3, HUD.green, 90);
    hudPanel(g, {
      x: W - 70,
      y: 900,
      anchor: 'right',
      title: 'DFM REVIEW',
      rows: [
        { icon: 'num', n: 1, color: HUD.red, text: 'Bosses: add draft' },
        { icon: 'num', n: 2, color: AMBER, text: 'Ribs: more draft' },
        { icon: 'num', n: 3, color: HUD.green, text: 'Walls: draft OK' },
      ],
    });
  };
  return { scene, camera, hud };
}

/** Gear motor used for the development stages. `mode`: concept | prototype | final. */
function gearMotor(mode) {
  const group = new THREE.Group();
  const matFor = (role) => {
    if (mode === 'prototype') return mat.matte('#8f97a4');
    if (role === 'body') return mat.blue();
    if (role === 'dark') return mat.dark();
    return mat.steel();
  };
  const add = (geometry, role, position, rotation = [0, 0, 0]) => {
    if (mode === 'concept') {
      const m = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#3b74ff', transparent: true, opacity: 0.07, depthWrite: false }));
      m.position.set(...position);
      m.rotation.set(...rotation);
      m.add(edgeLines(geometry, { color: BRAND_LIGHT, width: 2.2, angle: 10, opacity: 0.9 }));
      group.add(m);
    } else {
      group.add(part(geometry, matFor(role), { position, rotation }));
    }
  };
  const horizontal = [0, 0, Math.PI / 2];
  const seg = mode === 'concept' ? 14 : 64;
  add(new THREE.CylinderGeometry(0.55, 0.55, 1.5, seg), 'body', [0, 0.72, 0], horizontal);
  const fins = mode === 'concept' ? [-0.5, 0, 0.5] : [-0.5, -0.25, 0, 0.25, 0.5];
  for (const x of fins) add(new THREE.CylinderGeometry(0.6, 0.6, 0.06, seg), 'body', [x, 0.72, 0], horizontal);
  add(new THREE.CylinderGeometry(0.5, 0.56, 0.24, seg), 'dark', [-0.87, 0.72, 0], horizontal);
  add(new THREE.CylinderGeometry(0.62, 0.62, 0.55, seg), 'steel', [1.02, 0.72, 0], horizontal);
  add(new RoundedBoxGeometry(0.14, 1.4, 1.4, 3, 0.04), 'steel', [1.36, 0.72, 0]);
  add(new THREE.CylinderGeometry(0.12, 0.12, 0.5, mode === 'concept' ? 10 : 32), 'steel', [1.68, 0.72, 0], horizontal);
  add(new RoundedBoxGeometry(1.3, 0.12, 1.0, 2, 0.03), 'dark', [0, 0.06, 0]);
  add(new RoundedBoxGeometry(0.3, 0.3, 0.2, 2, 0.04), 'dark', [0.1, 0.1 + 0.62, -0.62]);
  return group;
}

/**
 * 05 · Product Development — one product through the stage gates: concept wireframe (REV A),
 * prototype (REV B) and release-ready product (REV C) on rising plinths.
 */
function productDevelopment() {
  const { scene, camera } = studio({ camera: [0.6, 5.6, 15.2], target: [0, 1.25, 0], fov: 32, shadowSize: 10, glow: 7.5 });

  const stages = [
    { mode: 'concept', x: -3.5, z: -0.9, h: 0.3, gate: 'GATE 1 · CONCEPT', rev: 'REV A' },
    { mode: 'prototype', x: 0, z: 0, h: 0.6, gate: 'GATE 2 · PROTOTYPE', rev: 'REV B' },
    { mode: 'final', x: 3.5, z: 0.9, h: 0.9, gate: 'GATE 3 · RELEASE', rev: 'REV C' },
  ];
  for (const s of stages) {
    scene.add(part(new RoundedBoxGeometry(2.8, s.h, 2.3, 4, 0.08), mat.plinth(), { position: [s.x, s.h / 2, s.z] }));
    const motor = gearMotor(s.mode);
    motor.position.set(s.x - 0.3, s.h, s.z);
    motor.rotation.y = 0.5;
    scene.add(motor);
  }
  for (const [a, b] of [
    [stages[0], stages[1]],
    [stages[1], stages[2]],
  ]) {
    const mx = (a.x + b.x) / 2;
    const mz = (a.z + b.z) / 2 + 1.45;
    scene.add(fatLine([[mx - 0.18, 0.02, mz - 0.22], [mx + 0.14, 0.02, mz], [mx - 0.18, 0.02, mz + 0.22]], { width: 4, opacity: 0.9 }));
  }

  const hud = (g, project) => {
    stages.forEach((s, i) => {
      const [x, y] = project(s.x, s.h + 2.3, s.z);
      hudTag(g, [x, y], s.gate, s.rev, { accent: i === 2 ? HUD.green : BRAND_LIGHT });
    });
  };
  return { scene, camera, hud };
}

function legacyDrawingTexture() {
  return canvasTexture(1600, 1130, (g, w, h) => {
    g.fillStyle = '#e8dcbc';
    g.fillRect(0, 0, w, h);
    for (const [x, y, r, a] of [
      [300, 260, 380, 0.1],
      [1250, 820, 420, 0.12],
      [900, 200, 260, 0.06],
    ]) {
      const grad = g.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(140, 104, 48, ${a})`);
      grad.addColorStop(1, 'rgba(140, 104, 48, 0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    }
    const ink = 'rgba(58, 72, 96, 0.82)';
    g.strokeStyle = ink;
    g.fillStyle = ink;
    g.lineWidth = 5;
    g.strokeRect(34, 34, w - 68, h - 68);
    g.lineWidth = 4;
    // Front view of the bearing housing
    const cx = 520;
    g.strokeRect(cx - 340, 700, 680, 70);
    g.strokeRect(cx - 150, 520, 300, 180);
    g.beginPath();
    g.arc(cx, 420, 170, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.arc(cx, 420, 100, 0, Math.PI * 2);
    g.stroke();
    g.setLineDash([28, 10, 5, 10]);
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx, 200);
    g.lineTo(cx, 820);
    g.moveTo(cx - 250, 420);
    g.lineTo(cx + 250, 420);
    g.stroke();
    g.setLineDash([]);
    // Top view
    g.lineWidth = 4;
    g.strokeRect(1000, 360, 440, 170);
    for (const x of [1060, 1380]) {
      g.beginPath();
      g.arc(x, 445, 26, 0, Math.PI * 2);
      g.stroke();
    }
    g.strokeRect(1150, 390, 140, 110);
    g.font = 'italic 600 40px "Segoe UI", Arial, sans-serif';
    g.textBaseline = 'middle';
    g.fillText('BEARING HOUSING', 980, 880);
    g.font = 'italic 500 32px "Segoe UI", Arial, sans-serif';
    g.fillText('DWG 0217  ·  REV C', 980, 940);
    g.fillText('Ø 85', cx + 190, 250);
    g.fillText('170', cx - 60, 820);
  });
}

/**
 * 06 · CAD Conversion & Reverse Engineering — a legacy paper drawing and scan data rebuilt as an
 * editable solid model, split at the scan plane.
 */
function reverseEngineering() {
  const { scene, camera } = studio({ camera: [3.4, 3.9, 8.0], target: [-0.45, 1.0, -0.2], fov: 30, glow: 5.5 });

  const legacy = new THREE.Mesh(
    new THREE.PlaneGeometry(3.9, 3.9 / 1.416),
    new THREE.MeshStandardMaterial({ map: legacyDrawingTexture(), roughness: 0.95, envMapIntensity: 0.2, color: '#d9d3c4' }),
  );
  legacy.rotation.set(-Math.PI / 2, 0, 0.32);
  legacy.position.set(-3.05, 0.004, -1.25);
  legacy.receiveShadow = true;
  scene.add(legacy);

  const base = roundedRect(3.4, 1.3, 0.2);
  base.holes.push(hole(-1.3, 0, 0.15), hole(1.3, 0, 0.15));
  const baseGeo = slab(base, 0.35, 0.03);
  baseGeo.translate(0, 0.2, 0);
  const webGeo = new RoundedBoxGeometry(1.5, 0.9, 0.7, 3, 0.06);
  webGeo.translate(0, 0.8, 0);
  const outer = new THREE.CylinderGeometry(0.85, 0.85, 1.0, 96, 1, true);
  outer.rotateX(Math.PI / 2);
  outer.translate(0, 1.4, 0);
  const bore = invertNormals(new THREE.CylinderGeometry(0.5, 0.5, 1.0, 96, 1, true));
  bore.rotateX(Math.PI / 2);
  bore.translate(0, 1.4, 0);
  const front = new THREE.RingGeometry(0.5, 0.85, 96);
  front.translate(0, 1.4, 0.5);
  const back = new THREE.RingGeometry(0.5, 0.85, 96);
  back.rotateY(Math.PI);
  back.translate(0, 1.4, -0.5);
  const nipple = new THREE.CylinderGeometry(0.07, 0.09, 0.3, 24);
  nipple.translate(0, 2.35, 0);
  const pieces = [baseGeo, webGeo, outer, bore, front, back, nipple];

  const clip = [new THREE.Plane(new THREE.Vector3(1, 0, 0), 0)];
  const solid = new THREE.MeshPhysicalMaterial({ color: '#cfd5de', metalness: 1, roughness: 0.4, clippingPlanes: clip, clipShadows: true, side: THREE.DoubleSide });
  for (const g of pieces) {
    const m = part(g, solid);
    const edges = edgeLines(g, { color: '#0a1433', width: 2.2, angle: 30, opacity: 0.85 });
    edges.material.clippingPlanes = clip;
    m.add(edges);
    scene.add(m);
  }

  const merged = mergeGeometries(pieces.map((g) => clean(g)));
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build();
  const positions = [];
  const colors = [];
  const p = new THREE.Vector3();
  const low = new THREE.Color('#4f8dff');
  const high = new THREE.Color('#b8f1ff');
  const c = new THREE.Color();
  for (let i = 0; i < 140000; i++) {
    sampler.sample(p);
    if (p.x > -0.03) continue;
    const jitter = 0.006;
    positions.push(p.x + (Math.random() - 0.5) * jitter, p.y + (Math.random() - 0.5) * jitter, p.z + (Math.random() - 0.5) * jitter);
    c.copy(low).lerp(high, Math.min(1, p.y / 2.4));
    colors.push(c.r, c.g, c.b);
  }
  const cloud = new THREE.BufferGeometry();
  cloud.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  cloud.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  scene.add(new THREE.Points(cloud, new THREE.PointsMaterial({ size: 3.4, sizeAttenuation: false, vertexColors: true, toneMapped: false })));

  const curtainMap = canvasTexture(256, 512, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
  });
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 3.2),
    new THREE.MeshBasicMaterial({ map: curtainMap, color: '#4f8dff', transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  );
  curtain.rotation.y = Math.PI / 2;
  curtain.position.set(0, 1.35, 0);
  scene.add(curtain);
  scene.add(
    fatLine(
      [
        [0, 0.01, -1.3],
        [0, 2.95, -1.3],
        [0, 2.95, 1.3],
        [0, 0.01, 1.3],
        [0, 0.01, -1.3],
      ],
      { color: '#9cc4ff', width: 3, opacity: 0.8 },
    ),
  );

  const hud = (g) =>
    hudPanel(g, {
      x: W - 70,
      y: 330,
      anchor: 'right',
      title: 'SOURCE → CAD',
      rows: [
        { icon: 'dot', color: '#e3c98a', text: 'Legacy 2D drawing' },
        { icon: 'dot', color: '#7fb6ff', text: 'Scan data' },
        { icon: 'check', color: HUD.green, text: 'Editable 3D model' },
      ],
    });
  return { scene, camera, hud };
}

/**
 * 07 · Design Optimization — the original bolted three-part bracket beside its one-piece optimised
 * form, with the mounting interfaces carried over unchanged.
 */
function designOptimization() {
  const { scene, camera } = studio({ camera: [0.4, 4.6, 12.2], target: [0, 1.25, 0], fov: 33, shadowSize: 10, glow: 7 });

  const interfaceRing = () => new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.022, 12, 64), mat.glow(BRAND_LIGHT));

  const bracket = (optimised) => {
    const group = new THREE.Group();
    const material = optimised ? mat.blue() : mat.cast();
    const gap = optimised ? 0 : 0.02;

    const baseShape = roundedRect(2.4, 1.8, 0.12);
    for (const [x, y] of [
      [0.75, -0.55],
      [0.75, 0.55],
    ])
      baseShape.holes.push(hole(x, y, 0.13));
    if (optimised) baseShape.holes.push(slotHole(-0.15, 0, 1.0, 0.95));
    const baseGeo = slab(baseShape, 0.28, 0.025);
    baseGeo.translate(0, 0.165, 0);
    const baseMesh = part(baseGeo, material);
    group.add(baseMesh);

    const wallShape = roundedRect(1.8, 2.3, 0.12);
    for (const y of [0.5, -0.1]) wallShape.holes.push(hole(0.55, y + 0.3, 0.12), hole(-0.55, y + 0.3, 0.12));
    if (optimised) wallShape.holes.push(slotHole(0, -0.55, 1.05, 0.62));
    const wallGeo = extrude(wallShape, 0.28, 0.025);
    wallGeo.rotateY(Math.PI / 2);
    wallGeo.translate(-1.06 - gap, 1.45 + gap, 0);
    const wallMesh = part(wallGeo, material);
    group.add(wallMesh);

    for (const [x, z] of [
      [0.75, -0.55],
      [0.75, 0.55],
    ]) {
      const ring = interfaceRing();
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.32, z);
      group.add(ring);
    }

    if (optimised) {
      for (const z of [-0.62, 0.62]) {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.92, 2.05, z),
          new THREE.Vector3(-0.2, 1.2, z * 0.92),
          new THREE.Vector3(0.95, 0.33, z),
        ]);
        group.add(part(new THREE.TubeGeometry(curve, 64, 0.1, 24, false), material));
        for (const pt of [curve.getPoint(0), curve.getPoint(1)]) group.add(part(new THREE.SphereGeometry(0.15, 32, 24), material, { position: pt.toArray() }));
      }
      const tie = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.2, 1.2, -0.57), new THREE.Vector3(-0.2, 1.2, 0.57)]);
      group.add(part(new THREE.TubeGeometry(tie, 8, 0.07, 16, false), material));
    } else {
      // Separate welded-on gusset and bolted joints: three parts, six fasteners.
      const gusset = new THREE.Shape();
      gusset.moveTo(-0.9, 0.32);
      gusset.lineTo(1.03, 0.32);
      gusset.lineTo(-0.9, 2.33);
      gusset.closePath();
      const gussetGeo = extrude(gusset, 0.34, 0.02);
      group.add(part(gussetGeo, material));
      for (const g of [baseGeo, wallGeo, gussetGeo]) group.add(edgeLines(g, { color: '#050a18', width: 2.6, angle: 30, opacity: 0.9 }));
      const bolt = boltGeometry(0.1);
      for (const z of [-0.55, 0.55]) group.add(part(bolt, mat.steel(), { position: [-0.55, 0.31, z] }));
      for (const [y, z] of [
        [0.8, -0.55],
        [0.8, 0.55],
        [1.4, -0.55],
        [1.4, 0.55],
      ])
        group.add(part(bolt, mat.steel(), { position: [-0.9, y + 0.3, z], rotation: [0, 0, -Math.PI / 2] }));
    }
    return group;
  };

  const before = bracket(false);
  before.position.set(-2.6, 0, 0);
  before.rotation.y = -0.5;
  const after = bracket(true);
  after.position.set(2.6, 0, 0);
  after.rotation.y = -0.5;
  scene.add(before, after);

  scene.add(fatLine([[-0.25, 0.02, 1.25], [0.2, 0.02, 1.55], [-0.25, 0.02, 1.85]], { width: 4.5 }));
  scene.add(fatLine([[0.15, 0.02, 1.25], [0.6, 0.02, 1.55], [0.15, 0.02, 1.85]], { width: 4.5, opacity: 0.55 }));

  const hud = (g, project) => {
    hudTag(g, project(-2.6, 3.35, 0), 'BEFORE', '3 parts · 6 fasteners', { accent: '#9aa3b2' });
    hudTag(g, project(2.6, 3.35, 0), 'AFTER', '1 part · interfaces kept', { accent: BRAND_LIGHT });
  };
  return { scene, camera, hud };
}

/* ================================================================= capture */

const scenes = {
  'mechanical-product-design': mechanicalProductDesign,
  '3d-cad-modeling': cadModeling,
  'engineering-drawings': engineeringDrawings,
  'design-for-manufacturing': designForManufacturing,
  'product-development': productDevelopment,
  'cad-conversion-reverse-engineering': reverseEngineering,
  'design-optimization': designOptimization,
};

function disposeScene(scene) {
  scene.traverse((o) => {
    o.geometry?.dispose();
    const materials = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of materials) {
      for (const value of Object.values(m)) if (value?.isTexture) value.dispose();
      m.dispose();
    }
  });
  if (scene.background?.isTexture) scene.background.dispose();
}

async function capture(name, hud) {
  let source = renderer.domElement;
  if (hud) {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.drawImage(renderer.domElement, 0, 0);
    hud(g);
    source = c;
  }
  const blob = await new Promise((resolve) => source.toBlob(resolve, 'image/png'));
  const res = await fetch(`${RECEIVER}/?name=${name}.png`, { method: 'POST', body: blob });
  return res.json();
}

window.renderService = async (name) => {
  const build = scenes[name];
  if (!build) throw new Error(`Unknown scene: ${name}`);
  await fontsReady;
  const started = performance.now();
  const { scene, camera, hud } = build();
  renderer.render(scene, camera);
  const v = new THREE.Vector3();
  const project = (x, y, z) => {
    v.set(x, y, z).project(camera);
    return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H];
  };
  const saved = await capture(name, hud && ((g) => hud(g, project)));
  disposeScene(scene);
  return { ...saved, ms: Math.round(performance.now() - started) };
};
window.serviceSceneNames = Object.keys(scenes);
window.sceneToolReady = true;
