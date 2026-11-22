# Astral Loom — Game & System Blueprint

> สถานะ: v0.1 เสร็จ (ดูรายละเอียดที่ README) · ข้อสมมติที่ผมเลือกเองมีป้าย **[สมมติ]** แก้ได้ทุกข้อ

## 1. แนวคิดเกม

**ธีม:** ดวงดาวร่วงเป็น "ด้าย" (Thread) ผู้เล่นเป็น Weaver ทอด้ายเป็นพลัง นำทีม 3 ตัวออกสำรวจรอยแยกที่ Void Knight กำลังกัดกิน
**สไตล์ภาพ:** anime toon (เงา 3 ขั้น + เส้นขอบ) ตัวละครออริจินัลของเกมนี้ ไม่อิงงานใคร
**กลุ่มเป้าหมาย:** คนทั่วไป เล่นจริงจัง เซสชันสั้น 3–10 นาที กลับมาเล่นได้ทุกวัน
**เป้าความรู้สึก:** สนุก ไม่น่าเบื่อ ทุกเทิร์นมีทางเลือก ทุกครั้งที่กลับมามีของรออยู่

### Core Loop
```
ออกสำรวจ (Expedition) → ต่อสู้ Turn-Based → ได้ Thread / Relic / Shard
        ↑                                              ↓
   รับรางวัลตอนออฟไลน์  ←  จัด Build ให้ทีม  ←  อัปเกรด/ปลดล็อก
```
- **เล่นข้ามเวลา:** (1) Expedition ทำงานตอนออฟไลน์ สะสมรางวัลสูงสุด 12 ชม. **[สมมติ]** (2) Arena แบบ Async: ทีมป้องกันของเราถูกท้าทายตอนเราไม่อยู่ (3) Daily Rift รีเซ็ตทุกวัน
- **Build ของตัวเอง:** ฮีโร่ 1 ตัว = คลาส + 3 ช่อง Thread (สกิล/ตัวปรับสกิล) + 2 ช่อง Relic (พาสซีฟ) + Tag Synergy

## 2. กลไก Turn-Based

| เรื่อง | การออกแบบ |
|---|---|
| รูปแบบ | 3 v 3 บนอารีนา (แถวตามแกน z) ลำดับเทิร์นแบบ **Timeline** ตาม Speed |
| ลำดับเทิร์น | ทุกตัวมี gauge เพิ่มตาม SPD ถึง 100 ได้เทิร์น (สูตรใน `store.ts` ฟังก์ชัน `advance`) แสดงทำนาย 8 เทิร์นข้างหน้า |
| ทรัพยากร | **Focus** 0–5: โจมตีพื้นฐาน +1 สกิลเด่นใช้ Focus → ต้องวางจังหวะ ไม่กดสกิลแรงซ้ำ |
| ชนะ/แพ้ | ศัตรูตายหมด = ชนะ · ทีมเราตายหมด = แพ้ |
| ภายหลัง | สถานะ (Burn/Shock/Taunt), Tag Synergy, Break gauge, Ultimate ร่วมทีม |

**State machine ของเทิร์น**
```
advance → [hero] selectAction → (selectTarget) → animating → checkEnd → advance
        → [enemy] enemyTurn(AI) ───────────────→ animating → checkEnd → advance
                                                   ↘ won / lost
```

## 3. 3D Motion Animation Pipeline

ชั้นที่ซ้อนกัน (อัปเกรดทีละชั้นโดยไม่รื้อชั้นล่าง):

1. **Procedural Rig (v0.1)** — ตัวละครประกอบจากเรขาคณิต ขยับด้วยฟังก์ชันเวลา: idle breathing/floating, melee (anticipation → dash → impact → return), cast (charge → release → settle), hit (knockback + squash + flash), KO
2. **Sync กับดาเมจ** — แต่ละแอนิเมชันมี "จุด impact" ที่ตายตัว (melee 0.6 วิ, cast 0.5 วิ + กระสุน 0.4 วิ) ผลคำนวณถูกใช้ตอนถึงจุดนั้น พร้อมกล้องสั่น เลขลอย และ burst
3. **ActionTimeline (v0.4)** — เปลี่ยนจาก `wait()` เป็นรายการอีเวนต์ `[{t, type: 'impact'|'fx'|'camera'|'sfx'}]` ต่อสกิล เขียนในข้อมูล ไม่ฝังโค้ด
4. **GLTF Skeletal (v0.9)** — ใช้ `useAnimations` ตั้งชื่อคลิปมาตรฐาน `Idle, Move, Windup, Strike, Cast, Hit, KO, Victory` ใช้ crossFade และใช้ ActionTimeline ชุดเดิม
5. **Post/Toon polish (v0.9)** — เส้นขอบแบบ post-process, bloom ที่เอฟเฟกต์สกิล

## 4. สถาปัตยกรรม

```
Browser (Vite + React + R3F + zustand)
   │  pure TS battle-core (deterministic, seeded RNG)  ← ใช้โค้ดเดียวกันบน Edge Function
   ▼
Supabase: Auth · Postgres (RLS) · Edge Functions · Realtime
   ▲
GitHub: repo + Actions (typecheck/build/deploy Pages, ภายหลัง deploy functions + migrations)
```
**หลักสำคัญ:** logic การต่อสู้ต้องแยกจาก UI (ย้ายออกเป็น `battle-core` ใน v0.2) เพื่อให้ server ตรวจซ้ำได้ ป้องกันโกง ไม่เชื่อค่าที่ client ส่งมา

### ตาราง Supabase (โครงคร่าวๆ ลงมือจริงตามเวอร์ชัน)
| ตาราง | หน้าที่ | RLS |
|---|---|---|
| `profiles` | ชื่อ, เลเวลบัญชี, สกุลเงิน, `last_seen` | อ่าน/แก้ได้เฉพาะเจ้าของ (อ่านชื่อสาธารณะผ่าน view) |
| `heroes_owned` | ฮีโร่ที่มี, เลเวล, ดาว | เจ้าของ |
| `inventory` | Thread/Relic ที่มี | เจ้าของ |
| `builds` | ชุด Build ต่อฮีโร่ (slot → item) | เจ้าของ |
| `runs` | บันทึกด่าน/ผลสู้ (seed, actions, result) | เจ้าของอ่าน, **เขียนผ่าน Edge Function เท่านั้น** |
| `expeditions` | เริ่มเมื่อไร, ทีมไหน, พื้นที่ไหน | เจ้าของอ่าน, เขียนผ่าน function |
| `arena_defense` | ทีมป้องกัน + rating | เจ้าของแก้, ทุกคนอ่านแบบจำกัดคอลัมน์ |
| `leaderboard` (view) | จัดอันดับ | อ่านสาธารณะ |

**Edge Functions:** `claim-expedition` (คำนวณรางวัลจากเวลาฝั่ง server), `resolve-run` (replay seed+actions ด้วย battle-core), `arena-challenge`

## 5. โครงสร้างโฟลเดอร์
```
astral-loom/
├─ .github/workflows/ci.yml        typecheck + build + deploy Pages
├─ docs/DESIGN.md                  ไฟล์นี้
├─ supabase/
│  ├─ migrations/                  SQL ทีละเวอร์ชัน (v0.3+)
│  └─ functions/                   Edge Functions (v0.7+)
├─ src/
│  ├─ game/        data.ts · store.ts   (→ v0.2 แยก battle-core/ ที่ไม่พึ่ง React)
│  ├─ scene/       Arena · UnitView · Fx · CameraRig · toon
│  ├─ ui/          Hud (→ เพิ่ม Build, Map, Login)
│  └─ net/         supabase client (v0.3+)
└─ public/         โมเดล .glb, เสียง (v0.9)
```

## 6. Roadmap (ทุกเวอร์ชันเล่นได้จริง)

ขนาดงาน **[สมมติ]**: นักพัฒนาเดี่ยว + AI ช่วย พาร์ตไทม์ ~ 3–4 เดือนถึง v1.0

### v0.1 — Battle Prototype ✅
- **Playable:** เปิดเว็บแล้วสู้ 3v3 จบเป็นชนะ/แพ้ กดเล่นซ้ำได้ ไม่ต้องล็อกอิน
- **Systems & Motion:** Timeline, Focus, 9 สกิล, AI ศัตรู, แอนิเมชัน procedural ครบชุด, กล้องซูม/สั่น, เลขลอย, ความเร็ว x2
- **GitHub/Supabase:** Repo + CI Pages · Supabase ยังไม่ต้องทำอะไร
- **DoD:** `npm run build` ผ่าน · สู้จบทั้งชนะและแพ้ · กด 1–3/Esc ได้ · มือถือกดได้ · เล่นซ้ำไม่ค้าง

### v0.2 — Stage Run & Local Save
- **Playable:** วิ่งหลายด่าน (3 wave + บอส) ได้รางวัลหลังจบ เก็บเซฟในเครื่อง
- **Systems:** แยก `battle-core` (pure TS + seeded RNG), ระบบ Wave, สถานะแรก (Shield decay, Burn), หน้าสรุปผล
- **GitHub/Supabase:** เพิ่ม unit test (Vitest) ของ battle-core ใน CI · Supabase: สร้างโปรเจกต์ + เก็บ URL/Key ใน GitHub Secrets
- **DoD:** seed เดียวกัน + action เดียวกัน = ผลเดียวกันทุกครั้ง (test ผ่าน) · รีเฟรชแล้วเซฟยังอยู่

### v0.3 — Account & Cloud Save
- **Playable:** ล็อกอิน (อีเมล/Google/Guest) แล้วเซฟตามบัญชี เล่นต่อได้ทุกเครื่อง
- **Systems:** Auth UI, ซิงก์เซฟ, ตัวจัดการ offline/online
- **GitHub/Supabase:** Migration `profiles`, `heroes_owned`, `inventory` + RLS · Auth providers · `.env` ผ่าน Secrets
- **DoD:** ผู้ใช้ A อ่านข้อมูล B ไม่ได้ (ทดสอบ RLS) · Guest แปลงเป็นบัญชีจริงแล้วข้อมูลไม่หาย

### v0.4 — Motion & Status Pass
- **Playable:** สกิลแต่ละอันมีท่าและเอฟเฟกต์เฉพาะ เห็นสถานะบนตัวละคร
- **Systems & Motion:** ActionTimeline (data-driven), hit-stop, camera cut ต่อสกิล, สถานะ Burn/Shock/Taunt, เสียง SFX พื้นฐาน
- **GitHub/Supabase:** ไม่มีการเปลี่ยน schema · เพิ่มสคริปต์ตรวจขนาด bundle ใน CI
- **DoD:** ทุกสกิลมี timeline · FPS ≥ 50 บนมือถือระดับกลาง · ปิดแอนิเมชันได้ (reduced motion)

### v0.5 — Threads & Build
- **Playable:** จัดสกิล/Relic ให้ฮีโร่ สร้างทีมตามสไตล์ตัวเอง เห็น Synergy ทันที
- **Systems:** ช่อง Thread/Relic, Tag Synergy (Burn/Chain/Guard/Surge), หน้าจัด Build, ของดรอปสุ่ม
- **GitHub/Supabase:** Migration `builds`, ตารางข้อมูลไอเทม · RLS เจ้าของ
- **DoD:** Build ต่างกันให้ผลต่างกันจริง (test) · เซฟ/โหลด Build ข้ามเครื่องได้

### v0.6 — Roster & Progression
- **Playable:** ได้ฮีโร่ใหม่จากการเล่น (ไม่มีกาชา) ปลดล็อกและเลเวลอัป
- **Systems:** ฮีโร่เพิ่ม 3–5 ตัว, XP/เลเวล, Mastery tree เล็ก, แผนที่ด่าน
- **GitHub/Supabase:** Migration `runs`, `progress` · Edge Function `resolve-run` (ตรวจผลด้วย battle-core)
- **DoD:** ส่งผลปลอมแล้วถูกปฏิเสธ · เล่นจากด่าน 1 ถึงด่านท้ายได้โดยไม่มีทางตัน

### v0.7 — Expedition (เล่นข้ามเวลา)
- **Playable:** ส่งทีมออกสำรวจ ปิดเว็บ กลับมารับของ
- **Systems:** Expedition หลายพื้นที่/ระยะเวลา, รางวัลตามเวลา (cap 12 ชม.), แจ้งเตือนในเกม
- **GitHub/Supabase:** Migration `expeditions` · Edge Function `claim-expedition` (ใช้เวลา server เท่านั้น) · ตั้ง `pg_cron` ถ้าต้องการ
- **DoD:** แก้นาฬิกาเครื่องแล้วโกงไม่ได้ · เคลมซ้ำไม่ได้ · ทดสอบ 1 นาที/1 ชม./เกิน cap

### v0.8 — Async Arena & Leaderboard
- **Playable:** ตั้งทีมป้องกัน ท้าทายทีมคนอื่น ขึ้นอันดับ
- **Systems:** Matchmaking ตาม rating, ผลสู้แบบ replay, ฤดูกาล
- **GitHub/Supabase:** Migration `arena_defense`, `leaderboard` view · Edge Function `arena-challenge` · Realtime สำหรับแจ้งผล
- **DoD:** ท้าทายตัวเองไม่ได้ · rating คำนวณถูก · ไม่มีใครเห็นข้อมูลส่วนตัวของคนอื่น

### v0.9 — Anime Polish (GLTF + Post)
- **Playable:** ตัวละครโมเดลจริง ฉากสวย ใช้ลื่นบนมือถือ
- **Systems & Motion:** โหลด .glb + `useAnimations`, เส้นขอบ/bloom, LOD/คุณภาพปรับได้, ตัวโหลดแบบ progressive
- **GitHub/Supabase:** Supabase Storage หรือ CDN สำหรับโมเดล · CI ตรวจขนาดไฟล์
- **DoD:** โหลดครั้งแรก < 5 วินาที (เครือข่ายปานกลาง) · ตกกลับไป procedural ได้ถ้าโหลดโมเดลไม่ขึ้น

### v1.0 — Launch
- **Playable:** เกมสมบูรณ์ มีสอนเล่น ปรับบาลานซ์แล้ว พร้อมเปิดสาธารณะ
- **Systems:** Tutorial, ปรับบาลานซ์จากข้อมูลจริง, i18n (ไทย/อังกฤษ), analytics แบบเคารพความเป็นส่วนตัว, หน้านโยบายความเป็นส่วนตัว
- **GitHub/Supabase:** Environment แยก staging/prod · Backup/PITR · Rate limit Edge Functions · Release tag + changelog
- **DoD:** ผ่าน checklist ความปลอดภัย (RLS ครบทุกตาราง) · ทดสอบโหลด · คนนอกเล่นจบด่านแรกโดยไม่ต้องถามใคร
