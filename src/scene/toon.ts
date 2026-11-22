import * as THREE from 'three';

/** gradient 3 ขั้น ให้เงาแบบการ์ตูน */
export const gradient = (() => {
  const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
})();

export const toon = (color: string) => new THREE.MeshToonMaterial({ color, gradientMap: gradient });

/** เส้นขอบแบบ inverted hull */
export const OUTLINE = new THREE.MeshBasicMaterial({ color: '#17122b', side: THREE.BackSide });
