import * as THREE from 'three';
import type { DimensionSpec, Vec3 } from './wormAssembly';

const v = (p: Vec3) => new THREE.Vector3(...p);

function labelTexture(text: string) {
  const fontSize = 64;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const font = `700 ${fontSize}px "Satoshi", ui-sans-serif, system-ui, sans-serif`;
  ctx.font = font;
  const width = Math.ceil(ctx.measureText(text).width) + 24;
  canvas.width = width;
  canvas.height = fontSize + 20;
  ctx.font = font;
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 12, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return { texture, aspect: canvas.width / canvas.height };
}

export interface AnnotationSet {
  object: THREE.Group;
  lineMaterial: THREE.LineBasicMaterial;
  labelMaterials: THREE.SpriteMaterial[];
  dispose: () => void;
}

/** Dimension lines drafted to convention: extension lines, oblique ticks and a centered value. */
export function buildDimensionSet(specs: DimensionSpec[], color: string): AnnotationSet {
  const group = new THREE.Group();
  const positions: number[] = [];
  const push = (a: THREE.Vector3, b: THREE.Vector3) => positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const lineMaterial = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthTest: false });
  const labelMaterials: THREE.SpriteMaterial[] = [];
  const textures: THREE.Texture[] = [];

  for (const spec of specs) {
    const a = v(spec.from);
    const b = v(spec.to);
    const off = v(spec.offset);
    const offDir = off.clone().normalize();
    const a2 = a.clone().add(off);
    const b2 = b.clone().add(off);
    const overshoot = offDir.clone().multiplyScalar(0.06);
    const gap = offDir.clone().multiplyScalar(0.05);
    push(a.clone().add(gap), a2.clone().add(overshoot));
    push(b.clone().add(gap), b2.clone().add(overshoot));
    push(a2, b2);
    const along = b2.clone().sub(a2).normalize();
    const tick = along.clone().add(offDir).normalize().multiplyScalar(0.05);
    push(a2.clone().sub(tick), a2.clone().add(tick));
    push(b2.clone().sub(tick), b2.clone().add(tick));

    const { texture, aspect } = labelTexture(spec.label);
    textures.push(texture);
    const mat = new THREE.SpriteMaterial({ map: texture, color, transparent: true, opacity: 0, depthTest: false });
    labelMaterials.push(mat);
    const sprite = new THREE.Sprite(mat);
    const h = 0.15;
    sprite.scale.set(h * aspect, h, 1);
    sprite.position.copy(a2.clone().lerp(b2, 0.5).add(offDir.clone().multiplyScalar(0.14)));
    sprite.renderOrder = 10;
    group.add(sprite);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const lines = new THREE.LineSegments(geometry, lineMaterial);
  lines.renderOrder = 10;
  group.add(lines);

  return {
    object: group,
    lineMaterial,
    labelMaterials,
    dispose: () => {
      geometry.dispose();
      lineMaterial.dispose();
      labelMaterials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
    },
  };
}

/** Dash-dot style centerlines marking the assembly axes. */
export function buildAxes(axes: { from: Vec3; to: Vec3 }[], color: string) {
  const material = new THREE.LineDashedMaterial({
    color,
    dashSize: 0.22,
    gapSize: 0.07,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const group = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  for (const axis of axes) {
    const g = new THREE.BufferGeometry().setFromPoints([v(axis.from), v(axis.to)]);
    geometries.push(g);
    const line = new THREE.Line(g, material);
    line.computeLineDistances();
    group.add(line);
  }
  return {
    object: group,
    material,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      material.dispose();
    },
  };
}

export function buildContactShadow() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.85)');
  gradient.addColorStop(0.45, 'rgba(0,0,0,0.4)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, opacity: 0 });
  const geometry = new THREE.PlaneGeometry(6, 3.6).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  return {
    mesh,
    material,
    dispose: () => {
      texture.dispose();
      material.dispose();
      geometry.dispose();
    },
  };
}
