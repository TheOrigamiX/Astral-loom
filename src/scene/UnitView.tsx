import { ReactNode, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { homeOf, useGame, validTargets } from '../game/store';
import { OUTLINE, toon } from './toon';

type V3 = [number, number, number];
const ease = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const GREY = new THREE.Color('#555566');

function Part({ geo, mat, pos = [0, 0, 0], scale = [1, 1, 1], rot = [0, 0, 0], outline = true }: {
  geo: ReactNode; mat: THREE.Material; pos?: V3; scale?: V3; rot?: V3; outline?: boolean;
}) {
  return (
    <group position={pos} scale={scale} rotation={rot}>
      <mesh material={mat} castShadow>{geo}</mesh>
      {outline && <mesh material={OUTLINE} scale={1.07}>{geo}</mesh>}
    </group>
  );
}

export function UnitView({ uid }: { uid: string }) {
  const u = useGame((s) => s.units.find((x) => x.uid === uid)!);
  const active = useGame((s) => s.activeUid === uid);
  const targetable = useGame((s) => validTargets(s).includes(uid));
  const pickTarget = useGame((s) => s.pickTarget);
  const look = u.def.look;
  const [hx, hz] = homeOf(u);
  const dir = u.team === 'hero' ? 1 : -1;
  const phase = useMemo(() => Math.random() * 6, []);

  const mats = useMemo(() => {
    const m = { main: toon(look.main), accent: toon(look.accent), hair: toon(look.hair), skin: toon(look.skin) };
    const list = (Object.values(m) as THREE.MeshToonMaterial[]).map((mt) => ({ mt, base: mt.color.clone() }));
    return { ...m, list };
  }, [look]);
  const eye = useMemo(() => new THREE.MeshBasicMaterial({ color: '#1b1430' }), []);
  const white = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff' }), []);

  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const wpn = useRef<THREE.Group>(null!);
  const ring = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const T = clock.elapsedTime;
    const s = useGame.getState();
    const a = s.anims[uid];
    let px = 0, py = Math.sin(T * 1.6 + phase) * 0.05, pz = 0;
    let rx = 0, sy = 1 + Math.sin(T * 2.2 + phase) * 0.02, wr = 0.35, flash = 0, ry = dir * (Math.PI / 2);
    if (!u.alive) py = 0;

    if (a) {
      const t = (performance.now() / 1000 - a.t0) * a.k;
      if (a.kind === 'melee' && a.target) {
        const ddx = a.target[0] - hx, ddz = a.target[1] - hz;
        const dist = Math.hypot(ddx, ddz) || 1;
        const ux = ddx / dist, uz = ddz / dist;
        const gx = (dist - 1.7) * ux, gz = (dist - 1.7) * uz;
        let k = 0;
        ry = Math.atan2(ux, uz);
        if (t < 0.35) { const p = ease(t / 0.35); k = -0.12 * p; rx = -0.25 * p; sy = 1 - 0.1 * p; wr = 0.35 - 1.2 * p; } // anticipation
        else if (t < 0.6) { const p = easeOut((t - 0.35) / 0.25); k = -0.12 + 1.12 * p; rx = -0.25 + 0.55 * p; py += Math.sin(p * Math.PI) * 0.4; wr = -0.85 + 0.4 * p; } // dash
        else if (t < 0.8) { const p = (t - 0.6) / 0.2; k = 1; rx = 0.3 - 0.2 * ease(p); wr = -0.45 + 1.9 * easeOut(p * 1.5); } // impact
        else if (t < 1.3) { const p = ease((t - 0.8) / 0.5); k = 1 - p; rx = 0.1 * (1 - p); wr = 1.45 - 1.1 * p; } // return
        else ry = dir * (Math.PI / 2);
        px = gx * k; pz = gz * k;
      } else if (a.kind === 'cast') {
        if (t < 0.5) { const p = ease(t / 0.5); py += 0.35 * p; rx = -0.18 * p; sy = 1 + 0.04 * p; wr = 0.35 + 0.9 * p; } // charge
        else if (t < 0.75) { const p = ease((t - 0.5) / 0.25); py += 0.35 * (1 - p * 0.6); rx = -0.18 + 0.5 * p; wr = 1.25 - 1.6 * p; } // release
        else if (t < 1.2) { const p = ease((t - 0.75) / 0.45); py += 0.14 * (1 - p); rx = 0.32 * (1 - p); wr = -0.35 * (1 - p) + 0.35 * p; }
      } else if (a.kind === 'hit' && t < 0.5) {
        const p = t / 0.5, w = Math.sin(p * Math.PI);
        px = -dir * 0.4 * w; pz = Math.sin(t * 70) * 0.07 * (1 - p); sy = 1 - 0.12 * w; rx = -0.2 * w; flash = 1 - p;
      } else if (a.kind === 'ko') {
        const p = easeOut(t / 0.9);
        rx = -1.45 * p; py = 0.12 * p; flash = Math.max(0, 1 - t * 2);
      }
    }

    root.current.position.set(hx + px, py, hz + pz);
    root.current.rotation.y = ry;
    body.current.rotation.x = rx;
    body.current.scale.set(1 + (1 - sy) * 0.5, sy, 1 + (1 - sy) * 0.5);
    if (wpn.current) wpn.current.rotation.x = wr;
    const dead = u.alive ? 0 : 0.75;
    for (const { mt, base } of mats.list) {
      mt.color.copy(base).lerp(GREY, dead);
      mt.emissive.setScalar(flash * 0.8);
    }
    if (ring.current) { ring.current.visible = active || targetable; ring.current.scale.setScalar(1 + Math.sin(T * 6) * 0.07); }
  });

  const hpPct = (u.hp / u.maxHp) * 100;
  const isImp = look.kind === 'imp';
  const isKnight = look.kind === 'knight';
  const headY = 1.62;

  return (
    <>
      {/* วงใต้เท้า + แถบ HP (อยู่กับที่ ไม่ขยับตามแอนิเมชัน) */}
      <group position={[hx, 0.03, hz]} scale={look.scale}>
        <mesh ref={ring} rotation-x={-Math.PI / 2} visible={false}>
          <ringGeometry args={[0.8, 0.98, 40]} />
          <meshBasicMaterial color={targetable ? '#ff6b81' : '#ffd166'} />
        </mesh>
      </group>
      <Html position={[hx, 2.2 * look.scale + 0.5, hz]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`tag ${u.team} ${u.alive ? '' : 'dead'}`}>
          <b>{u.def.name}</b>
          <div className="bar"><i style={{ width: `${hpPct}%` }} />{u.shield > 0 && <em style={{ width: `${Math.min(100, (u.shield / u.maxHp) * 100)}%` }} />}</div>
          <span>{u.hp}/{u.maxHp}{u.shield > 0 ? ` +${u.shield}` : ''}</span>
        </div>
      </Html>

      <group
        ref={root}
        scale={look.scale}
        onClick={(e) => { if (targetable) { e.stopPropagation(); pickTarget(uid); } }}
        onPointerOver={() => { if (targetable) document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'auto'; }}
      >
        <group ref={body}>
          {/* ขา */}
          <Part geo={<capsuleGeometry args={[0.13, 0.35, 4, 10]} />} mat={mats.accent} pos={[-0.17, 0.3, 0]} />
          <Part geo={<capsuleGeometry args={[0.13, 0.35, 4, 10]} />} mat={mats.accent} pos={[0.17, 0.3, 0]} />
          {/* ลำตัว + ผ้าพันคอ */}
          <Part geo={<capsuleGeometry args={[0.36, 0.45, 6, 14]} />} mat={mats.main} pos={[0, 0.95, 0]} />
          <Part geo={<torusGeometry args={[0.3, 0.09, 8, 20]} />} mat={mats.accent} pos={[0, 1.35, 0]} rot={[Math.PI / 2, 0, 0]} outline={false} />
          {/* แขน */}
          <Part geo={<capsuleGeometry args={[0.1, 0.4, 4, 8]} />} mat={mats.main} pos={[-0.5, 1.0, 0.05]} rot={[0, 0, 0.25]} />
          {/* หัว */}
          <Part geo={<sphereGeometry args={[isImp ? 0.46 : 0.38, 20, 16]} />} mat={mats.skin} pos={[0, headY, 0]} />
          {/* ผม / หมวก / เขา */}
          {!isImp && <Part geo={<sphereGeometry args={[0.42, 18, 14]} />} mat={mats.hair} pos={[0, headY + 0.1, -0.05]} scale={[1, 0.85, 1.05]} />}
          {look.kind === 'blade' && [-0.2, 0, 0.2].map((x, i) => (
            <Part key={i} geo={<coneGeometry args={[0.1, 0.4, 8]} />} mat={mats.hair} pos={[x, headY + 0.45, 0.02]} rot={[-0.3, 0, -x * 2.2]} />
          ))}
          {look.kind === 'mage' && <Part geo={<capsuleGeometry args={[0.1, 0.7, 4, 8]} />} mat={mats.hair} pos={[0, 1.2, -0.42]} rot={[0.35, 0, 0]} />}
          {isImp && [-0.25, 0.25].map((x, i) => (
            <Part key={i} geo={<coneGeometry args={[0.1, 0.4, 8]} />} mat={mats.accent} pos={[x, headY + 0.5, 0]} rot={[0, 0, -x * 1.2]} />
          ))}
          {isKnight && [-1, 1].map((d) => (
            <Part key={d} geo={<coneGeometry args={[0.1, 0.55, 8]} />} mat={mats.accent} pos={[d * 0.4, headY + 0.35, 0]} rot={[0, 0, -d * 0.8]} />
          ))}
          {/* ตา anime */}
          {[-0.14, 0.14].map((x) => (
            <group key={x}>
              <mesh material={eye} position={[x, headY - 0.02, isImp ? 0.42 : 0.34]} scale={[1, 1.5, 0.4]}><sphereGeometry args={[0.075, 12, 12]} /></mesh>
              <mesh material={white} position={[x - 0.02, headY + 0.03, isImp ? 0.46 : 0.38]}><sphereGeometry args={[0.025, 8, 8]} /></mesh>
            </group>
          ))}
          {/* อาวุธ (หมุนที่มือขวา) */}
          <group ref={wpn} position={[0.52, 1.0, 0.15]}>
            {(look.kind === 'blade' || isKnight) && <Part geo={<boxGeometry args={[0.09, isKnight ? 1.5 : 1.1, 0.04]} />} mat={mats.accent} pos={[0, 0.5, 0.2]} rot={[Math.PI / 2 - 0.1, 0, 0]} />}
            {look.kind === 'mage' && (
              <>
                <Part geo={<cylinderGeometry args={[0.04, 0.04, 1.4, 8]} />} mat={mats.accent} pos={[0, 0.3, 0.1]} />
                <mesh position={[0, 1.05, 0.1]}><sphereGeometry args={[0.14, 12, 12]} /><meshBasicMaterial color="#9fd0ff" /></mesh>
              </>
            )}
            {look.kind === 'guard' && <Part geo={<boxGeometry args={[0.1, 0.5, 0.1]} />} mat={mats.accent} pos={[0, 0.2, 0.2]} rot={[Math.PI / 2, 0, 0]} />}
            {isImp && <Part geo={<coneGeometry args={[0.07, 0.35, 6]} />} mat={mats.accent} pos={[0, 0.1, 0.25]} rot={[Math.PI / 2, 0, 0]} />}
          </group>
          {look.kind === 'guard' && <Part geo={<cylinderGeometry args={[0.45, 0.45, 0.1, 20]} />} mat={mats.accent} pos={[-0.62, 1.0, 0.2]} rot={[0, 0, Math.PI / 2]} />}
        </group>
      </group>
    </>
  );
}
