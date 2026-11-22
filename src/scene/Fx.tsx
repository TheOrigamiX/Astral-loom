import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGame } from '../game/store';

function Burst({ pos, color }: { pos: [number, number, number]; color: string }) {
  const m = useRef<THREE.Mesh>(null!);
  const born = useRef(performance.now());
  useFrame(() => {
    const p = Math.min(1, (performance.now() - born.current) / 500);
    m.current.scale.setScalar(0.3 + p * 1.6);
    (m.current.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - p);
  });
  return (
    <mesh ref={m} position={pos}>
      <icosahedronGeometry args={[0.6, 1]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} depthWrite={false} />
    </mesh>
  );
}

function Shot({ from, to, color, t0, dur }: { from: [number, number, number]; to: [number, number, number]; color: string; t0: number; dur: number }) {
  const m = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const p = Math.min(1, Math.max(0, (performance.now() / 1000 - t0) / dur));
    m.current.position.set(from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p + Math.sin(p * Math.PI) * 0.8, from[2] + (to[2] - from[2]) * p);
    m.current.scale.setScalar(0.8 + Math.sin(p * Math.PI) * 0.5);
  });
  return (
    <mesh ref={m} position={from}>
      <sphereGeometry args={[0.28, 16, 16]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export function Fx() {
  const floaters = useGame((s) => s.floaters);
  const bursts = useGame((s) => s.bursts);
  const shots = useGame((s) => s.shots);
  return (
    <>
      {floaters.map((f) => (
        <Html key={f.id} position={[f.pos[0], 2.3, f.pos[1]]} center style={{ pointerEvents: 'none' }}>
          <div className="floater" style={{ color: f.color }}>{f.text}</div>
        </Html>
      ))}
      {bursts.map((b) => <Burst key={b.id} pos={b.pos} color={b.color} />)}
      {shots.map((s) => <Shot key={s.id} {...s} />)}
    </>
  );
}
