import { create } from 'zustand';
import { ENEMY_LINEUP, HEROES, SKILLS, Skill, Team, UnitDef } from './data';

export interface Unit {
  uid: string;
  def: UnitDef;
  team: Team;
  slot: number;
  hp: number;
  maxHp: number;
  atk: number;
  spd: number;
  gauge: number; // ถึง 100 = ได้เทิร์น
  mp: number; // Focus
  shield: number;
  alive: boolean;
}

export type AnimKind = 'melee' | 'cast' | 'hit' | 'ko';
export interface Anim {
  kind: AnimKind;
  t0: number; // วินาที (performance.now()/1000)
  k: number; // ความเร็วเกม ณ ตอนเริ่ม
  target?: [number, number];
}
export type Phase = 'selectAction' | 'selectTarget' | 'enemyTurn' | 'animating' | 'won' | 'lost';

interface Floater { id: number; uid: string; text: string; color: string; pos: [number, number] }
interface Burst { id: number; pos: [number, number, number]; color: string }
interface Shot { id: number; from: [number, number, number]; to: [number, number, number]; color: string; t0: number; dur: number }

interface Game {
  units: Unit[];
  activeUid: string | null;
  phase: Phase;
  pending: Skill | null;
  anims: Record<string, Anim>;
  floaters: Floater[];
  bursts: Burst[];
  shots: Shot[];
  camFocus: [number, number] | null;
  shake: number;
  speed: 1 | 2;
  log: string[];
  turn: number;
  newBattle: () => void;
  setSpeed: (s: 1 | 2) => void;
  pickSkill: (id: string) => void;
  pickTarget: (uid: string) => void;
  cancel: () => void;
}

export const MAX_FOCUS = 5;
export const homeOf = (u: { team: Team; slot: number }): [number, number] => [u.team === 'hero' ? -3.6 : 3.6, (u.slot - 1) * 2.6];

let seq = 1;
let battleId = 0;
const nowS = () => performance.now() / 1000;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const wait = (ms: number) => sleep(ms / useGame.getState().speed);
const pick = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

function makeUnits(): Unit[] {
  const mk = (d: UnitDef, slot: number): Unit => ({
    uid: `${d.team}-${d.id}-${slot}`, def: d, team: d.team, slot,
    hp: d.hp, maxHp: d.hp, atk: d.atk, spd: d.spd, gauge: d.spd * 1.5, mp: 1, shield: 0, alive: true,
  });
  return [...HEROES.map(mk), ...ENEMY_LINEUP.map(mk)];
}

/** ทำนายลำดับเทิร์นถัดไป (ใช้แสดง Timeline) */
export function preview(units: Unit[], n = 8): string[] {
  const c = units.filter((u) => u.alive).map((u) => ({ uid: u.uid, spd: u.spd, g: u.gauge }));
  const out: string[] = [];
  for (let i = 0; i < n && c.length; i++) {
    let best = c[0];
    let bt = Infinity;
    for (const u of c) {
      const t = (100 - u.g) / u.spd;
      if (t < bt - 1e-9 || (Math.abs(t - bt) <= 1e-9 && u.spd > best.spd)) { bt = t; best = u; }
    }
    const t = Math.max(0, bt);
    c.forEach((u) => { u.g += u.spd * t; });
    best.g -= 100;
    out.push(best.uid);
  }
  return out;
}

export function validTargets(s: Pick<Game, 'phase' | 'pending' | 'units' | 'activeUid'>): string[] {
  if (s.phase !== 'selectTarget' || !s.pending) return [];
  const a = s.units.find((u) => u.uid === s.activeUid);
  if (!a) return [];
  const team = s.pending.target === 'ally' ? a.team : a.team === 'hero' ? 'enemy' : 'hero';
  return s.units.filter((u) => u.alive && u.team === team).map((u) => u.uid);
}

export const useGame = create<Game>((set, get) => ({
  units: [], activeUid: null, phase: 'enemyTurn', pending: null, anims: {}, floaters: [], bursts: [], shots: [],
  camFocus: null, shake: 0, speed: 1, log: [], turn: 0,

  newBattle: () => {
    battleId++;
    set({ units: makeUnits(), activeUid: null, pending: null, anims: {}, floaters: [], bursts: [], shots: [], camFocus: null, log: ['การต่อสู้เริ่มขึ้น'], turn: 0 });
    advance();
  },
  setSpeed: (speed) => set({ speed }),
  pickSkill: (id) => {
    const s = get();
    if (s.phase !== 'selectAction') return;
    const a = s.units.find((u) => u.uid === s.activeUid);
    const sk = SKILLS[id];
    if (!a || !sk || sk.cost > a.mp) return;
    if (sk.target === 'allFoes') {
      const foes = s.units.filter((u) => u.alive && u.team !== a.team).map((u) => u.uid);
      void perform(a.uid, sk, foes);
    } else set({ pending: sk, phase: 'selectTarget' });
  },
  pickTarget: (uid) => {
    const s = get();
    if (!s.activeUid || !s.pending || !validTargets(s).includes(uid)) return;
    void perform(s.activeUid, s.pending, [uid]);
  },
  cancel: () => {
    if (get().phase === 'selectTarget') set({ pending: null, phase: 'selectAction' });
  },
}));

const set = useGame.setState;
const get = useGame.getState;

/** หาตัวที่ได้เทิร์นถัดไปตาม gauge/speed */
function advance() {
  const s = get();
  const alive = s.units.filter((u) => u.alive);
  let best = alive[0];
  let bt = Infinity;
  for (const u of alive) {
    const t = (100 - u.gauge) / u.spd;
    if (t < bt - 1e-9 || (Math.abs(t - bt) <= 1e-9 && u.spd > best.spd)) { bt = t; best = u; }
  }
  const t = Math.max(0, bt);
  const units = s.units.map((u) => (u.alive ? { ...u, gauge: u.gauge + u.spd * t - (u.uid === best.uid ? 100 : 0) } : u));
  set({ units, activeUid: best.uid, turn: s.turn + 1, camFocus: null, pending: null, phase: best.team === 'hero' ? 'selectAction' : 'enemyTurn' });
  if (best.team === 'enemy') void aiTurn(best.uid);
}

async function aiTurn(uid: string) {
  const id = battleId;
  await wait(800);
  if (id !== battleId) return;
  const s = get();
  const a = s.units.find((u) => u.uid === uid)!;
  const heroes = s.units.filter((u) => u.team === 'hero' && u.alive);
  const usable = a.def.skills.map((k) => SKILLS[k]).filter((k) => k.cost <= a.mp);
  const specials = usable.filter((k) => k.cost > 0);
  const skill = specials.length && Math.random() < 0.55 ? pick(specials) : SKILLS[a.def.skills[0]];
  const weakest = [...heroes].sort((x, y) => x.hp - y.hp)[0];
  const targets = skill.target === 'allFoes' ? heroes : [Math.random() < 0.6 ? weakest : pick(heroes)];
  void perform(uid, skill, targets.map((t) => t.uid));
}

/** รันหนึ่งแอ็กชัน: เล่นแอนิเมชัน → ถึงจังหวะ impact ค่อยคำนวณผล → จบเทิร์น */
async function perform(actorUid: string, skill: Skill, targetUids: string[]) {
  const id = battleId;
  const ok = () => id === battleId;
  const actor = get().units.find((u) => u.uid === actorUid)!;
  const targets = targetUids.map((t) => get().units.find((u) => u.uid === t)!);
  const ah = homeOf(actor);
  const th = targets.map(homeOf);
  const center: [number, number] = [th.reduce((a, p) => a + p[0], 0) / th.length, th.reduce((a, p) => a + p[1], 0) / th.length];

  set((s) => ({
    phase: 'animating', pending: null,
    camFocus: [(ah[0] + center[0]) / 2, (ah[1] + center[1]) / 2],
    units: s.units.map((u) => (u.uid === actorUid ? { ...u, mp: Math.max(0, Math.min(MAX_FOCUS, u.mp - skill.cost + skill.gain)) } : u)),
    log: [...s.log.slice(-5), `${actor.def.name} ใช้ ${skill.name}`],
  }));

  const setAnim = (a: Anim) => set((s) => ({ anims: { ...s.anims, [actorUid]: a } }));
  if (skill.anim === 'melee') {
    setAnim({ kind: 'melee', t0: nowS(), k: get().speed, target: center });
    await wait(600); // ถึงเป้าหมาย = จังหวะ impact
    if (!ok()) return;
    applyEffect(skill, actorUid, targetUids);
    await wait(800);
  } else {
    setAnim({ kind: 'cast', t0: nowS(), k: get().speed });
    await wait(500); // ปล่อยพลัง
    if (!ok()) return;
    if (skill.kind === 'damage') {
      const dur = 0.4 / get().speed;
      const shots = targets.map((t, i): Shot => ({ id: seq++, from: [ah[0], 1.5, ah[1]], to: [th[i][0], 1.1, th[i][1]], color: skill.color, t0: nowS(), dur }));
      set((s) => ({ shots: [...s.shots, ...shots] }));
      setTimeout(() => set((s) => ({ shots: s.shots.filter((x) => !shots.includes(x)) })), dur * 1000 + 100);
      await wait(400);
    } else await wait(150);
    if (!ok()) return;
    applyEffect(skill, actorUid, targetUids);
    await wait(650);
  }
  if (!ok()) return;

  const us = get().units;
  if (!us.some((u) => u.team === 'enemy' && u.alive)) set((s) => ({ phase: 'won', activeUid: null, camFocus: null, log: [...s.log.slice(-5), 'ชนะ!'] }));
  else if (!us.some((u) => u.team === 'hero' && u.alive)) set((s) => ({ phase: 'lost', activeUid: null, camFocus: null, log: [...s.log.slice(-5), 'พ่ายแพ้…'] }));
  else advance();
}

function applyEffect(skill: Skill, actorUid: string, targetUids: string[]) {
  const s = get();
  const actor = s.units.find((u) => u.uid === actorUid)!;
  const anims = { ...s.anims };
  const floaters: Floater[] = [];
  const bursts: Burst[] = [];
  const units = s.units.map((u) => {
    if (!targetUids.includes(u.uid)) return u;
    const h = homeOf(u);
    const n = { ...u };
    let text = '';
    let color = '#fff';
    if (skill.kind === 'damage') {
      const crit = Math.random() < 0.1;
      let dmg = Math.round(actor.atk * skill.power * (0.9 + Math.random() * 0.2) * (crit ? 1.5 : 1));
      const absorbed = Math.min(n.shield, dmg);
      n.shield -= absorbed;
      dmg -= absorbed;
      n.hp = Math.max(0, n.hp - dmg);
      text = (crit ? 'CRIT ' : '') + (dmg > 0 ? `-${dmg}` : 'BLOCK');
      color = crit ? '#ffd166' : '#ff6b81';
      if (n.hp <= 0) { n.alive = false; anims[u.uid] = { kind: 'ko', t0: nowS(), k: s.speed }; }
      else anims[u.uid] = { kind: 'hit', t0: nowS(), k: s.speed };
    } else if (skill.kind === 'heal') {
      const before = n.hp;
      n.hp = Math.min(n.maxHp, n.hp + Math.round(actor.atk * skill.power));
      text = `+${n.hp - before}`;
      color = '#7dffb2';
    } else {
      const v = Math.round(actor.atk * skill.power);
      n.shield += v;
      text = `เกราะ ${v}`;
      color = '#6ee7ff';
    }
    floaters.push({ id: seq++, uid: u.uid, text, color, pos: h });
    bursts.push({ id: seq++, pos: [h[0], 1.1, h[1]], color: skill.color });
    return n;
  });
  set((st) => ({ units, anims, floaters: [...st.floaters, ...floaters], bursts: [...st.bursts, ...bursts], shake: skill.kind === 'damage' ? nowS() : st.shake }));
  const ids = new Set([...floaters, ...bursts].map((x) => x.id));
  setTimeout(() => set((st) => ({ floaters: st.floaters.filter((f) => !ids.has(f.id)), bursts: st.bursts.filter((b) => !ids.has(b.id)) })), 1400);
}
