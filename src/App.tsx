import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useShallow } from 'zustand/react/shallow';
import { useGame } from './game/store';
import { Arena } from './scene/Arena';
import { CameraRig } from './scene/CameraRig';
import { Fx } from './scene/Fx';
import { UnitView } from './scene/UnitView';
import { Hud } from './ui/Hud';

export default function App() {
  const uids = useGame(useShallow((s) => s.units.map((u) => u.uid)));
  useEffect(() => { useGame.getState().newBattle(); }, []);
  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 6.5, 11.5], fov: 40 }}>
        <color attach="background" args={['#120d2b']} />
        <fog attach="fog" args={['#120d2b', 18, 40]} />
        <Arena />
        {uids.map((id) => <UnitView key={id} uid={id} />)}
        <Fx />
        <CameraRig />
      </Canvas>
      <Hud />
    </>
  );
}
