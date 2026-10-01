// Development-only: renders the worm-gear reducer in each inspection step from several angles.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SECTION_UNCUT, WIRE_EDGE_WEIGHT, WIRE_SOLID_BOOST, parts } from '../../src/components/three/wormAssembly';
import { buildGeometries, edgeThreshold } from '../../src/components/three/wormGeometry';
import { CAD_METALNESS, CAD_ROUGHNESS, createPartMaterial } from '../../src/components/three/materials';

const W = 960;
const H = 600;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H, false);
renderer.localClippingEnabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);

const geoms = buildGeometries('high');
// Same studio lighting as the site viewer (MechanismCanvas).
const env = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const clip = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function scene(explode: number, wire: boolean, section: boolean, focusBom?: string) {
  const s = new THREE.Scene();
  s.background = new THREE.Color('#e9edf3');
  s.environment = env;
  s.environmentIntensity = 0.8;
  s.add(new THREE.AmbientLight('#ffffff', 0.2));
  const key = new THREE.DirectionalLight('#f4f7ff', 1.9);
  key.position.set(5, 7, 6);
  s.add(key);
  const rim = new THREE.DirectionalLight('#bcd2ff', 1.3);
  rim.position.set(-6, 2.5, -5);
  s.add(rim);
  clip.constant = section ? 0 : 10;
  for (const def of parts) {
    const { material, data } = createPartMaterial(def.material, SECTION_UNCUT.includes(def.group) ? [] : [clip]);
    data.cap.value = section ? 1 : 0;
    if (focusBom && def.bom !== focusBom) {
      // Same fade the viewer applies to everything except the selected part.
      material.transparent = true;
      material.opacity = 0.24;
      material.depthWrite = false;
    }
    if (wire) {
      material.transparent = true;
      material.opacity = 0.08 + (WIRE_SOLID_BOOST[def.group] ?? 0);
      material.color.copy(data.cad);
      material.metalness = CAD_METALNESS;
      material.roughness = CAD_ROUGHNESS;
      material.depthWrite = false;
    }
    const g = new THREE.Group();
    const e = def.explode;
    const t = ease(Math.min(1, Math.max(0, (explode - e.delay) / e.duration)));
    g.position.set(def.position[0] + e.offset[0] * t, def.position[1] + e.offset[1] * t, def.position[2] + e.offset[2] * t);
    const r0 = def.rotation ?? [0, 0, 0];
    const r1 = e.rotation ?? [0, 0, 0];
    g.rotation.set(r0[0] + r1[0] * t, r0[1] + r1[1] * t, r0[2] + r1[2] * t);
    g.add(new THREE.Mesh(geoms[def.geometry], material));
    if (wire) {
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geoms[def.geometry], edgeThreshold[def.geometry] ?? 25), new THREE.LineBasicMaterial({ color: '#1f5bd8', transparent: true, depthWrite: false, opacity: 0.9 * (WIRE_EDGE_WEIGHT[def.group] ?? 0.5) })));
    }
    s.add(g);
  }
  return s;
}

async function shot(name: string, explode: number, wire: boolean, section: boolean, camPos: [number, number, number], target: [number, number, number], fov = 30, pitch = 0, focusBom?: string) {
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 80);
  cam.position.set(...camPos);
  cam.lookAt(...target);
  const sc = scene(explode, wire, section, focusBom);
  if (pitch) {
    // Same tilt as Mechanism: about the camera's horizontal axis, pivot at the housing middle.
    const holder = new THREE.Group();
    holder.position.y = -0.15;
    const inner = new THREE.Group();
    inner.position.y = 0.15;
    for (const child of [...sc.children]) if (child.type === 'Group') inner.add(child);
    holder.add(inner);
    sc.add(holder);
    const axis = new THREE.Vector3(camPos[2] - target[2], 0, target[0] - camPos[0]).normalize();
    holder.quaternion.setFromAxisAngle(axis, pitch);
  }
  renderer.render(sc, cam);
  const blob: Blob = await new Promise((r) => renderer.domElement.toBlob((b) => r(b!), 'image/png'));
  await fetch(`http://127.0.0.1:5199/?name=${name}.png`, { method: 'POST', body: blob });
}

(window as unknown as { renderAll: () => Promise<string> }).renderAll = async () => {
  await shot('shaded-front', 0, false, false, [5.8, 3.5, 6.4], [0, -0.25, 0]);
  await shot('shaded-back', 0, false, false, [-5.8, 3.0, -6.4], [0, -0.25, 0]);
  await shot('exploded', 1, false, false, [6.5, 4.6, 7.1], [0.2, 0.55, 0.2], 30);
  await shot('exploded-back', 1, false, false, [-6.1, 4.6, -7.5], [0.2, 0.55, 0.2], 30);
  await shot('exploded-side', 1, false, false, [9.4, 4.6, -1.5], [0.2, 0.55, 0.2], 30);
  await shot('wireframe', 0, true, false, [5.8, 3.5, 6.4], [0, -0.25, 0]);
  await shot('section', 0, false, true, [7.4, 1.9, 3.1], [0, -0.3, 0.05]);
  await shot('wireframe-back', 0, true, false, [-5.8, 3.0, -6.4], [0, -0.25, 0]);
  await shot('section-close', 0, false, true, [5.2, 1.2, 2.2], [0, -0.3, 0.05]);
  await shot('tilt-down', 0, false, false, [5.8, 3.5, 6.4], [0, -0.25, 0], 30, 1.2);
  await shot('tilt-up', 0, false, false, [5.8, 3.5, 6.4], [0, -0.25, 0], 30, -1.57);
  await shot('tilt-exploded', 1, false, false, [6.5, 4.6, 7.1], [0.2, 0.55, 0.2], 30, -0.9);
  await shot('focus-wheel', 0, false, false, [5.8, 3.5, 6.4], [0, -0.25, 0], 30, 0, 'worm-wheel');
  await shot('focus-bearing', 0, false, false, [5.8, 3.5, 6.4], [0, -0.25, 0], 30, 0, 'bearing-output');
  await shot('side-input', 0, false, false, [0.4, 0.6, 7.5], [0, -0.25, 0]);
  return 'done';
};
