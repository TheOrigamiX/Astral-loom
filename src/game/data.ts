export type Team = 'hero' | 'enemy';
export type Target = 'foe' | 'allFoes' | 'ally';

export interface Skill {
  id: string;
  name: string;
  desc: string;
  cost: number; // Focus ที่ใช้
  gain: number; // Focus ที่ได้หลังใช้
  target: Target;
  kind: 'damage' | 'heal' | 'shield';
  power: number; // ตัวคูณ ATK
  anim: 'melee' | 'cast';
  color: string;
}

export interface Look {
  kind: 'blade' | 'mage' | 'guard' | 'imp' | 'knight';
  main: string;
  accent: string;
  hair: string;
  skin: string;
  scale: number;
}

export interface UnitDef {
  id: string;
  name: string;
  title: string;
  team: Team;
  hp: number;
  atk: number;
  spd: number;
  skills: string[]; // ตัวแรก = โจมตีพื้นฐาน
  look: Look;
}

export const SKILLS: Record<string, Skill> = {
  slash: { id: 'slash', name: 'Slash', desc: 'ฟันเดี่ยว ได้ Focus +1', cost: 0, gain: 1, target: 'foe', kind: 'damage', power: 1.0, anim: 'melee', color: '#ff9a6b' },
  crimson: { id: 'crimson', name: 'Crimson Dance', desc: 'พุ่งฟันแรง x2.3', cost: 2, gain: 0, target: 'foe', kind: 'damage', power: 2.3, anim: 'melee', color: '#ff3d6e' },
  blazing: { id: 'blazing', name: 'Blazing Arc', desc: 'คลื่นไฟโดนศัตรูทุกตัว', cost: 3, gain: 0, target: 'allFoes', kind: 'damage', power: 1.4, anim: 'cast', color: '#ff7a3d' },
  starbolt: { id: 'starbolt', name: 'Star Bolt', desc: 'ยิงดาวเดี่ยว ได้ Focus +1', cost: 0, gain: 1, target: 'foe', kind: 'damage', power: 1.0, anim: 'cast', color: '#7fb2ff' },
  meteor: { id: 'meteor', name: 'Meteor Rain', desc: 'อุกกาบาตโดนทุกตัว', cost: 3, gain: 0, target: 'allFoes', kind: 'damage', power: 1.3, anim: 'cast', color: '#a98bff' },
  starlight: { id: 'starlight', name: 'Starlight', desc: 'ฟื้น HP เพื่อน', cost: 2, gain: 0, target: 'ally', kind: 'heal', power: 1.8, anim: 'cast', color: '#7dffb2' },
  bash: { id: 'bash', name: 'Shield Bash', desc: 'ทุบด้วยโล่ ได้ Focus +1', cost: 0, gain: 1, target: 'foe', kind: 'damage', power: 1.0, anim: 'melee', color: '#ffd166' },
  bulwark: { id: 'bulwark', name: 'Bulwark', desc: 'ให้เกราะเพื่อน', cost: 2, gain: 0, target: 'ally', kind: 'shield', power: 2.6, anim: 'cast', color: '#6ee7ff' },
  slam: { id: 'slam', name: 'Judgement Slam', desc: 'ทุบหนัก x2.6', cost: 3, gain: 0, target: 'foe', kind: 'damage', power: 2.6, anim: 'melee', color: '#ffd166' },
  claw: { id: 'claw', name: 'Claw', desc: 'ข่วน', cost: 0, gain: 1, target: 'foe', kind: 'damage', power: 1.0, anim: 'melee', color: '#b06cff' },
  spite: { id: 'spite', name: 'Spite', desc: 'ยิงพลังมืด', cost: 2, gain: 0, target: 'foe', kind: 'damage', power: 1.6, anim: 'cast', color: '#d05cff' },
  cleave: { id: 'cleave', name: 'Cleave', desc: 'ฟันกว้าง', cost: 0, gain: 1, target: 'foe', kind: 'damage', power: 1.1, anim: 'melee', color: '#ff4d4d' },
  dread: { id: 'dread', name: 'Dread Wave', desc: 'คลื่นมืดโดนทั้งทีม', cost: 3, gain: 0, target: 'allFoes', kind: 'damage', power: 1.1, anim: 'cast', color: '#8a2be2' },
};

export const HEROES: UnitDef[] = [
  { id: 'kaede', name: 'Kaede', title: 'Blade Weaver', team: 'hero', hp: 120, atk: 18, spd: 14, skills: ['slash', 'crimson', 'blazing'],
    look: { kind: 'blade', main: '#e8453c', accent: '#ffd166', hair: '#ff8a3d', skin: '#ffe0cc', scale: 1 } },
  { id: 'mira', name: 'Mira', title: 'Starcaller', team: 'hero', hp: 90, atk: 20, spd: 12, skills: ['starbolt', 'meteor', 'starlight'],
    look: { kind: 'mage', main: '#5b6cff', accent: '#bfe3ff', hair: '#b98cff', skin: '#ffe6d6', scale: 1 } },
  { id: 'toma', name: 'Toma', title: 'Aegis Guard', team: 'hero', hp: 160, atk: 12, spd: 9, skills: ['bash', 'bulwark', 'slam'],
    look: { kind: 'guard', main: '#2fa86b', accent: '#e8f1ff', hair: '#3b2a1e', skin: '#f2c9a8', scale: 1.08 } },
];

const IMP: UnitDef = { id: 'imp', name: 'Shade Imp', title: 'เงาซน', team: 'enemy', hp: 70, atk: 12, spd: 13, skills: ['claw', 'spite'],
  look: { kind: 'imp', main: '#6b3fa0', accent: '#ff5da2', hair: '#2a1646', skin: '#8e5fd0', scale: 0.8 } };
const KNIGHT: UnitDef = { id: 'knight', name: 'Void Knight', title: 'อัศวินว่างเปล่า', team: 'enemy', hp: 220, atk: 16, spd: 8, skills: ['cleave', 'dread'],
  look: { kind: 'knight', main: '#2b2f4a', accent: '#8a6bff', hair: '#1a1c30', skin: '#4a4f78', scale: 1.3 } };

// ลำดับตามช่อง (slot 0,1,2 = หน้า→หลังแนวตั้ง)
export const ENEMY_LINEUP: UnitDef[] = [IMP, KNIGHT, IMP];
