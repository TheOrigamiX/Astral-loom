# Astral Loom v0.1 (Battle Prototype)

เกม 3D turn-based บนเว็บ สไตล์ anime ดูแผนทั้งหมดที่ [docs/DESIGN.md](docs/DESIGN.md)

## รันบนเครื่อง
ต้องมี Node.js 20+

```bash
npm install
npm run dev        # เปิด http://localhost:5173
npm run typecheck
npm run build
```

## วิธีเล่น
- ถึงเทิร์นฮีโร่: กด 1/2/3 หรือคลิกสกิล แล้วคลิกเป้าหมายในฉาก (Esc ยกเลิก)
- โจมตีพื้นฐานได้ Focus +1 สกิลแรงใช้ Focus (จุดฟ้า)
- แถบวงกลมด้านบน = ลำดับเทิร์น ปุ่ม "เร็ว x2" เร่งแอนิเมชัน

## เชื่อม GitHub
```bash
git init && git add . && git commit -m "v0.1 battle prototype"
git branch -M main
git remote add origin https://github.com/<you>/astral-loom.git
git push -u origin main
```
1. หลัง `npm install` ครั้งแรก ให้ commit ไฟล์ `package-lock.json` ด้วย (CI ใช้ `npm ci`)
2. GitHub → Settings → Pages → Source: **GitHub Actions**
3. push แล้วรอ workflow `CI & Deploy` เกมจะอยู่ที่ `https://<you>.github.io/astral-loom/`

## Supabase
v0.1 **ยังไม่ต้องตั้งค่า** (เล่นแบบ guest) เริ่มใช้ใน v0.3 คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าตอนนั้น
