import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { gradient } from './toon';

export function Arena() {
  const crystals = useMemo(
    () => Array.from({ length: 9 }, (_, i) => ({ a: (i / 9) * Math.PI * 2, r: 10 + (i % 3) * 1.5, h: 2 + (i % 4), s: 0.35 + (i % 3) * 0.15 })),
    [],
  );
  const g = useRef<THREE.Group>(null!);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    g.current.children.forEach((c, i) => {
      c.position.y = crystals[i].h + Math.sin(t * 0.8 + i) * 0.4;
      c.rotation.y = t * 0.5 + i;
    });
  });
  return (
    <>
      <hemisphereLight args={['#bcd2ff', '#2a1b4d', 0.7]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 10, 6]} intensity={1.7} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshToonMaterial color="#2b2a55" gradientMap={gradient} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[9.6, 10, 64]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      {[-1, 1].map((d) => (
        <mesh key={d} rotation-x={-Math.PI / 2} position={[d * 3.6, 0.01, 0]}>
          <planeGeometry args={[2.6, 8]} />
          <meshBasicMaterial color={d < 0 ? '#3b82f6' : '#ef4444'} transparent opacity={0.14} />
        </mesh>
      ))}
      <group ref={g}>
        {crystals.map((c, i) => (
          <mesh key={i} position={[Math.cos(c.a) * c.r, c.h, Math.sin(c.a) * c.r - 3]} scale={c.s}>
            <octahedronGeometry args={[1, 0]} />
            <meshToonMaterial color="#8a6bff" gradientMap={gradient} emissive="#4b3bd0" emissiveIntensity={0.6} />
          </mesh>
        ))}
      </group>
    </>
  );
}
