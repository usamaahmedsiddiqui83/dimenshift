import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Mechanism, type MechanismProps } from './Mechanism';

export interface MechanismCanvasProps extends MechanismProps {
  /** When false the render loop stops entirely (canvas off-screen). */
  active: boolean;
}

/** Procedural studio reflections — no HDR download required. */
function StudioLighting() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const env = pmrem.fromScene(room, 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.8;
    return () => {
      scene.environment = null;
      env.dispose();
      room.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 7, 6]} intensity={1.9} color="#f4f7ff" />
      <directionalLight position={[-6, 2.5, -5]} intensity={1.3} color="#bcd2ff" />
    </>
  );
}

/** Steps the pixel ratio down when the device cannot hold a smooth frame rate. */
function AdaptiveResolution({ max }: { max: number }) {
  const setDpr = useThree((s) => s.setDpr);
  const sample = useRef({ time: 0, frames: 0, dpr: Math.min(window.devicePixelRatio || 1, max) });

  useFrame((_, delta) => {
    const s = sample.current;
    if (delta > 0.25) {
      s.time = 0;
      s.frames = 0;
      return;
    }
    s.time += delta;
    s.frames += 1;
    if (s.time < 1.5) return;
    const fps = s.frames / s.time;
    s.time = 0;
    s.frames = 0;
    if (fps < 42 && s.dpr > 1) {
      s.dpr = Math.max(1, s.dpr - 0.25);
      setDpr(s.dpr);
    }
  });
  return null;
}

export default function MechanismCanvas({ active, ...props }: MechanismCanvasProps) {
  const maxDpr = props.detail === 'high' ? 1.75 : 1.5;
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={[1, maxDpr]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false }}
      camera={{ fov: 30, near: 0.1, far: 80, position: [5.4, 3, 6.6] }}
      onCreated={({ gl }) => {
        gl.localClippingEnabled = true;
        gl.setClearColor(0x000000, 0);
      }}
      style={{ touchAction: props.drag ? 'pan-y' : 'auto' }}
    >
      <StudioLighting />
      <Mechanism {...props} />
      <AdaptiveResolution max={maxDpr} />
    </Canvas>
  );
}
