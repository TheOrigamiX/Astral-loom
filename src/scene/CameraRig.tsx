import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGame } from '../game/store';

/** กล้อง: มุมกว้างตอนเลือก → ซูมเข้าหาแอ็กชัน + สั่นตอน impact */
export function CameraRig() {
  const camera = useThree((s) => s.camera);
  const v = useMemo(() => ({ pos: new THREE.Vector3(0, 6.5, 11.5), look: new THREE.Vector3(0, 0.8, 0), tp: new THREE.Vector3(), tl: new THREE.Vector3() }), []);
  useFrame((_, dt) => {
    const s = useGame.getState();
    const f = s.camFocus;
    if (f) { v.tp.set(f[0] * 0.5, 4, 8); v.tl.set(f[0] * 0.8, 1, f[1] * 0.6); }
    else { v.tp.set(0, 6.5, 11.5); v.tl.set(0, 0.8, 0); }
    const k = 1 - Math.exp(-dt * 3.5);
    v.pos.lerp(v.tp, k);
    v.look.lerp(v.tl, k);
    const t = performance.now() / 1000 - s.shake;
    const a = t < 0.3 ? (1 - t / 0.3) * 0.18 : 0;
    camera.position.set(v.pos.x + Math.sin(t * 90) * a, v.pos.y + Math.cos(t * 70) * a, v.pos.z);
    camera.lookAt(v.look);
  });
  return null;
}
