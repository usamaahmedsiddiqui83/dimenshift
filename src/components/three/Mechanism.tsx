import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { motion } from '../../config/motion';
import { pointer, trackPointer } from '../../lib/pointer';
import {
  AXES,
  DIM,
  SECTION_UNCUT,
  WIRE_EDGE_WEIGHT,
  WIRE_SOLID_BOOST,
  dimensionSets,
  parts,
  type PartDef,
} from './wormAssembly';
import { buildAxes, buildContactShadow, buildDimensionSet } from './annotations';
import { aspectFit, cameraPresets } from './cameraPresets';
import { buildEnvelope, buildGeometries, edgeThreshold, type Detail } from './wormGeometry';
import {
  CAD_METALNESS,
  CAD_ROUGHNESS,
  createPartMaterial,
  scenePalette,
  scenePaletteLight,
  type PartMaterialData,
} from './materials';
import { PITCH_LIMIT, clamp01, type MixedState } from './visualState';

export interface DragState {
  /** Turn about the vertical axis (horizontal drag). */
  angle: number;
  velocity: number;
  /** Tilt toward or away from the viewer (vertical drag), limited to straight above and below. */
  pitch: number;
  pitchVelocity: number;
  dragging: boolean;
}

/** Tilt pivot: the middle of the housing, so the model turns in place. */
const PIVOT_Y = -0.15;

export interface MechanismProps {
  getState: () => MixedState;
  detail: Detail;
  reducedMotion: boolean;
  parallax: boolean;
  drag?: RefObject<DragState>;
  onReady?: () => void;
  /** Surface the canvas sits on; tunes annotation colors for contrast. */
  tone?: 'dark' | 'light';
}

interface PartRuntime {
  def: PartDef;
  material: THREE.MeshStandardMaterial;
  data: PartMaterialData;
  edgeMaterial: THREE.LineBasicMaterial;
  highlight: number;
  group: THREE.Group | null;
  mesh: THREE.Mesh | null;
  edges: THREE.LineSegments | null;
}

const TAU = Math.PI * 2;
const NUMERIC = [
  'explode',
  'wire',
  'finish',
  'section',
  'concept',
  'envelopeWire',
  'drawing',
  'axes',
  'shadow',
  'turntable',
  'drive',
] as const;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const dampK = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt);
const cloneState = (s: MixedState): MixedState => ({
  ...s,
  dims: { ...s.dims },
});

export function Mechanism({ getState, detail, reducedMotion, parallax, drag, onReady, tone = 'dark' }: MechanismProps) {
  const palette = tone === 'light' ? scenePaletteLight : scenePalette;
  const geometries = useMemo(() => buildGeometries(detail), [detail]);
  const edges = useMemo(() => {
    const out = {} as Record<keyof typeof geometries, THREE.EdgesGeometry>;
    for (const key of Object.keys(geometries) as (keyof typeof geometries)[]) {
      out[key] = new THREE.EdgesGeometry(geometries[key], edgeThreshold[key] ?? 25);
    }
    return out;
  }, [geometries]);
  const envelope = useMemo(() => buildEnvelope(detail), [detail]);

  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 10), []);

  const scene = useMemo(() => {
    const runtime: PartRuntime[] = parts.map((def) => {
      // Gears, shafts, bearings and fasteners stay whole in the section view, as in a drafting section.
      const cut = !SECTION_UNCUT.includes(def.group);
      const planes = cut ? [clipPlane] : [];
      const { material, data } = createPartMaterial(def.material, planes);
      return {
        def,
        material,
        data,
        edgeMaterial: new THREE.LineBasicMaterial({
          color: scenePalette.datum,
          transparent: true,
          opacity: 0,
          depthWrite: false,
          clippingPlanes: planes,
        }),
        highlight: 0,
        group: null,
        mesh: null,
        edges: null,
      };
    });
    return {
      runtime,
      envelopeMaterial: new THREE.MeshStandardMaterial({
        color: scenePalette.clay,
        roughness: 0.82,
        metalness: 0,
        transparent: true,
        opacity: 0,
      }),
      envelopeLineMaterial: new THREE.LineBasicMaterial({
        color: scenePalette.datum,
        transparent: true,
        opacity: 0,
      }),
      dims: {
        envelope: buildDimensionSet(dimensionSets.envelope, scenePalette.datum),
        engineer: buildDimensionSet(dimensionSets.engineer, scenePalette.datum),
      },
      axes: buildAxes(AXES, scenePalette.axis),
      shadow: buildContactShadow(),
    };
  }, [clipPlane]);

  useEffect(
    () => () => {
      Object.values(geometries).forEach((g) => g.dispose());
    },
    [geometries],
  );
  useEffect(
    () => () => {
      Object.values(edges).forEach((g) => g.dispose());
    },
    [edges],
  );
  useEffect(
    () => () => {
      envelope.solid.dispose();
      envelope.outline.dispose();
    },
    [envelope],
  );
  useEffect(
    () => () => {
      scene.runtime.forEach((rt) => {
        rt.material.dispose();
        rt.edgeMaterial.dispose();
      });
      scene.envelopeMaterial.dispose();
      scene.envelopeLineMaterial.dispose();
      scene.dims.envelope.dispose();
      scene.dims.engineer.dispose();
      scene.axes.dispose();
      scene.shadow.dispose();
    },
    [scene],
  );

  useEffect(() => {
    if (parallax) trackPointer();
  }, [parallax]);

  const root = useRef<THREE.Group>(null);
  const spin = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const envelopeMesh = useRef<THREE.Mesh>(null);
  const envelopeLines = useRef<THREE.LineSegments>(null);
  const current = useRef<MixedState | null>(null);
  const angles = useRef({ drive: 0, turntable: 0 });
  /** Ramps up while a part is selected, to fade everything else back. */
  const focus = useRef(0);
  const readyCalled = useRef(false);

  const temp = useMemo(
    () => ({
      edge: new THREE.Color(),
      datum: new THREE.Color(palette.datum),
      drawing: new THREE.Color(palette.drawing),
      axis: new THREE.Color(palette.axis),
      ghost: new THREE.Color(palette.ghost),
      camPos: new THREE.Vector3(),
      camPosB: new THREE.Vector3(),
      camTarget: new THREE.Vector3(),
      camTargetB: new THREE.Vector3(),
      look: new THREE.Vector3(),
      tiltAxis: new THREE.Vector3(),
    }),
    [palette],
  );

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.1);
    const target = getState();
    const snap = current.current === null || reducedMotion;
    const c = current.current ?? (current.current = cloneState(target));
    const k = snap ? 1 : dampK(motion.sceneDamping, dt);

    for (const key of NUMERIC) c[key] += (target[key] - c[key]) * k;
    c.dims.envelope += (target.dims.envelope - c.dims.envelope) * k;
    c.dims.engineer += (target.dims.engineer - c.dims.engineer) * k;

    /* ---- Motion: drive train, turntable, user drag, pointer parallax ---- */
    const ang = angles.current;
    if (!reducedMotion) ang.drive += c.drive * dt;
    if (!reducedMotion && c.turntable > 0.01) {
      ang.turntable += c.turntable * dt;
    } else {
      const home = Math.round(ang.turntable / TAU) * TAU;
      ang.turntable += (home - ang.turntable) * (snap ? 1 : dampK(1.6, dt));
    }
    let dragAngle = 0;
    let pitch = 0;
    const d = drag?.current;
    if (d) {
      if (!d.dragging) {
        d.angle += d.velocity * dt;
        d.velocity *= Math.exp(-4 * dt);
        d.pitch += d.pitchVelocity * dt;
        d.pitchVelocity *= Math.exp(-4 * dt);
      }
      if (Math.abs(d.pitch) > PITCH_LIMIT) {
        d.pitch = Math.sign(d.pitch) * PITCH_LIMIT;
        d.pitchVelocity = 0;
      }
      dragAngle = d.angle;
      pitch = d.pitch;
    }
    if (spin.current) spin.current.rotation.y = ang.turntable + dragAngle;
    if (tilt.current) {
      // Tilt about the camera's horizontal axis, so dragging down always brings the top toward the viewer.
      const cam = state.camera.position;
      temp.tiltAxis.set(cam.z - temp.look.z, 0, temp.look.x - cam.x);
      if (temp.tiltAxis.lengthSq() < 1e-6) temp.tiltAxis.set(1, 0, 0);
      tilt.current.quaternion.setFromAxisAngle(temp.tiltAxis.normalize(), pitch);
    }
    if (root.current) {
      const weight = parallax && !reducedMotion ? 1 - c.drawing : 0;
      const kp = dampK(2.5, dt);
      root.current.rotation.y += (pointer.x * motion.pointerParallax * 2 * weight - root.current.rotation.y) * kp;
      root.current.rotation.x += (-pointer.y * motion.pointerParallax * weight - root.current.rotation.x) * kp;
    }

    /* ---- Parts ---- */
    const solid = (1 - c.wire * 0.92) * (1 - c.concept);
    const edgeBase = c.wire * 0.9 * (1 - c.concept);
    temp.edge.copy(temp.datum).lerp(temp.drawing, c.drawing);
    const capOn = c.section > 0.01 ? 1 : 0;
    const h = target.highlight;
    const kh = snap ? 1 : dampK(8, dt);
    focus.current += ((h ? 1 : 0) - focus.current) * kh;
    const fade = 1 - focus.current * 0.76;

    for (const rt of scene.runtime) {
      const def = rt.def;
      if (!rt.group || !rt.mesh || !rt.edges) continue;
      const e = def.explode;
      const t = easeInOut(clamp01((c.explode - e.delay) / e.duration));
      const r0 = def.rotation;
      const r1 = e.rotation;
      rt.group.position.set(
        def.position[0] + e.offset[0] * t,
        def.position[1] + e.offset[1] * t,
        def.position[2] + e.offset[2] * t,
      );
      rt.group.rotation.set(
        (r0?.[0] ?? 0) + (r1?.[0] ?? 0) * t,
        (r0?.[1] ?? 0) + (r1?.[1] ?? 0) * t,
        (r0?.[2] ?? 0) + (r1?.[2] ?? 0) * t + (def.spin ? ang.drive * def.spin : 0),
      );

      const m = rt.material;
      m.color
        .copy(rt.data.cad)
        .lerp(rt.data.finished, c.finish)
        .lerp(temp.ghost, c.drawing * 0.7);
      m.metalness = CAD_METALNESS + (rt.data.metalness - CAD_METALNESS) * c.finish;
      m.roughness = CAD_ROUGHNESS + (rt.data.roughness - CAD_ROUGHNESS) * c.finish;
      // Wireframe keeps a light fill on the gear train so it reads through the ghosted casing.
      const match = h !== null && (def.id === h || def.group === h || def.bom === h);
      const partSolid =
        Math.min(1, solid + c.wire * (WIRE_SOLID_BOOST[def.group] ?? 0) * (1 - c.concept)) * (match ? 1 : fade);
      m.opacity = partSolid;
      m.transparent = partSolid < 0.995;
      m.depthWrite = partSolid > 0.5;
      rt.mesh.visible = partSolid > 0.004;
      rt.data.cap.value = capOn;

      rt.highlight += ((match ? target.highlightAmount : 0) - rt.highlight) * kh;
      m.emissive.copy(temp.datum).multiplyScalar(rt.highlight * 0.42);

      const partEdge = edgeBase * (WIRE_EDGE_WEIGHT[def.group] ?? 0.5) * (match ? 1 : fade);
      const edgeOpacity = Math.max(partEdge, rt.highlight * 0.85 * (1 - c.concept));
      rt.edgeMaterial.opacity = edgeOpacity;
      rt.edgeMaterial.color.copy(rt.highlight > partEdge ? temp.datum : temp.edge);
      rt.edges.visible = edgeOpacity > 0.004;
    }

    /* ---- Concept envelope ---- */
    const clay = c.concept * clamp01((1 - c.envelopeWire) / 0.7);
    scene.envelopeMaterial.opacity = clay;
    scene.envelopeMaterial.transparent = clay < 0.995;
    scene.envelopeMaterial.depthWrite = clay > 0.5;
    if (envelopeMesh.current) envelopeMesh.current.visible = clay > 0.004;
    scene.envelopeLineMaterial.opacity = c.envelopeWire * 0.9;
    scene.envelopeLineMaterial.color.copy(temp.edge);
    if (envelopeLines.current) envelopeLines.current.visible = c.envelopeWire > 0.004;

    /* ---- Annotations ---- */
    for (const key of ['envelope', 'engineer'] as const) {
      const set = scene.dims[key];
      const o = c.dims[key];
      set.object.visible = o > 0.004;
      set.lineMaterial.opacity = o * 0.9;
      set.lineMaterial.color.copy(temp.edge);
      for (const lm of set.labelMaterials) {
        lm.opacity = o;
        lm.color.copy(temp.edge);
      }
    }
    const axisOpacity = c.axes * 0.6 * (1 - c.concept);
    scene.axes.material.opacity = axisOpacity;
    scene.axes.material.color.copy(temp.axis).lerp(temp.drawing, c.drawing);
    scene.axes.object.visible = axisOpacity > 0.004;

    // The contact shadow only makes sense while the model stands on its feet.
    const shadowOpacity = c.shadow * 0.7 * (1 - c.wire * 0.6) * clamp01(1 - Math.abs(pitch) / 0.35);
    scene.shadow.material.opacity = shadowOpacity;
    scene.shadow.mesh.visible = shadowOpacity > 0.004;
    // The feet are cast into the housing, which never moves, so the shadow stays put.
    scene.shadow.mesh.position.y = DIM.housingBottom - 0.006;

    clipPlane.constant = 6 * (1 - easeInOut(clamp01(c.section)));

    /* ---- Camera ---- */
    const camera = state.camera as THREE.PerspectiveCamera;
    const A = cameraPresets[target.camera];
    const B = cameraPresets[target.cameraTo];
    const km = target.cameraMix;
    temp.camTarget.fromArray(A.target).lerp(temp.camTargetB.fromArray(B.target), km);
    temp.camPos.fromArray(A.position).lerp(temp.camPosB.fromArray(B.position), km);
    temp.camPos
      .sub(temp.camTarget)
      .multiplyScalar(aspectFit(state.size.width / state.size.height))
      .add(temp.camTarget);
    const fov = A.fov + (B.fov - A.fov) * km;
    const kc = snap ? 1 : dampK(motion.cameraDamping, dt);
    camera.position.lerp(temp.camPos, kc);
    temp.look.lerp(temp.camTarget, kc);
    camera.lookAt(temp.look);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov += (fov - camera.fov) * kc;
      camera.updateProjectionMatrix();
    }

    if (!readyCalled.current) {
      readyCalled.current = true;
      onReady?.();
    }
  });

  return (
    <group ref={root}>
      <group ref={tilt} position={[0, PIVOT_Y, 0]}>
        <group position={[0, -PIVOT_Y, 0]}>
          <group ref={spin}>
            {scene.runtime.map((rt) => (
              <group
                key={rt.def.id}
                name={rt.def.id}
                ref={(el) => {
                  rt.group = el;
                }}
                position={rt.def.position}
                rotation={rt.def.rotation ?? [0, 0, 0]}
              >
                <mesh
                  ref={(el) => {
                    rt.mesh = el;
                  }}
                  geometry={geometries[rt.def.geometry]}
                  material={rt.material}
                />
                <lineSegments
                  ref={(el) => {
                    rt.edges = el;
                  }}
                  geometry={edges[rt.def.geometry]}
                  material={rt.edgeMaterial}
                />
              </group>
            ))}
            <mesh ref={envelopeMesh} geometry={envelope.solid} material={scene.envelopeMaterial} />
            <lineSegments ref={envelopeLines} geometry={envelope.outline} material={scene.envelopeLineMaterial} />
            <primitive object={scene.axes.object} />
            <primitive object={scene.dims.envelope.object} />
            <primitive object={scene.dims.engineer.object} />
            <primitive object={scene.shadow.mesh} />
          </group>
        </group>
      </group>
    </group>
  );
}
