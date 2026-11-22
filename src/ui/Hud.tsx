import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { SKILLS } from '../game/data';
import { MAX_FOCUS, preview, useGame } from '../game/store';

export function Hud() {
  const { units, activeUid, phase, pending, log, speed, turn } = useGame(
    useShallow((s) => ({ units: s.units, activeUid: s.activeUid, phase: s.phase, pending: s.pending, log: s.log, speed: s.speed, turn: s.turn })),
  );
  const { pickSkill, cancel, newBattle, setSpeed } = useGame.getState();
  const active = units.find((u) => u.uid === activeUid);
  const order = useMemo(() => preview(units, 8), [units]);
  const byUid = (id: string) => units.find((u) => u.uid === id)!;
  const myTurn = !!active && active.team === 'hero' && (phase === 'selectAction' || phase === 'selectTarget');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
      const n = Number(e.key);
      if (n >= 1 && n <= 3) {
        const a = useGame.getState().units.find((u) => u.uid === useGame.getState().activeUid);
        if (a && a.team === 'hero') pickSkill(a.def.skills[n - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancel, pickSkill]);

  return (
    <div className="hud">
      <header className="top">
        <h1>Astral Loom</h1>
        <div className="timeline" aria-label="ลำดับเทิร์น">
          {active && <span className={`chip now ${active.team}`} title="เทิร์นปัจจุบัน">{active.def.name[0]}</span>}
          {order.map((id, i) => <span key={i} className={`chip ${byUid(id).team}`} title={byUid(id).def.name}>{byUid(id).def.name[0]}</span>)}
        </div>
        <button className="ghost" onClick={() => setSpeed(speed === 1 ? 2 : 1)}>เร็ว x{speed}</button>
      </header>

      <aside className="log">{log.map((l, i) => <p key={i}>{l}</p>)}</aside>

      {myTurn && active && (
        <section className="panel">
          <div className="who">
            <b>{active.def.name}</b> <small>{active.def.title}</small>
            <span className="pips" aria-label={`Focus ${active.mp}`}>
              {Array.from({ length: MAX_FOCUS }, (_, i) => <i key={i} className={i < active.mp ? 'on' : ''} />)}
            </span>
          </div>
          <div className="skills">
            {active.def.skills.map((id, i) => {
              const sk = SKILLS[id];
              const off = sk.cost > active.mp;
              return (
                <button key={id} disabled={off} className={pending?.id === id ? 'sel' : ''} onClick={() => pickSkill(id)}>
                  <span className="key">{i + 1}</span>
                  <strong>{sk.name}</strong>
                  <small>{sk.cost > 0 ? `ใช้ Focus ${sk.cost}` : 'ฟรี'} · {sk.desc}</small>
                </button>
              );
            })}
          </div>
          {phase === 'selectTarget' && <p className="hint">แตะเป้าหมายในฉาก <button className="ghost" onClick={cancel}>ยกเลิก (Esc)</button></p>}
        </section>
      )}
      {phase === 'enemyTurn' && <p className="banner">ศัตรูกำลังเคลื่อนไหว…</p>}

      {(phase === 'won' || phase === 'lost') && (
        <div className="result">
          <div>
            <h2>{phase === 'won' ? 'ชนะแล้ว!' : 'พ่ายแพ้'}</h2>
            <p>ใช้ {turn} เทิร์น</p>
            <button onClick={newBattle}>เล่นอีกครั้ง</button>
          </div>
        </div>
      )}
    </div>
  );
}
