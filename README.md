# บัญชีรายรับรายจ่ายครอบครัว

เว็บแอป Next.js สำหรับบันทึกรายรับ-รายจ่ายที่แชร์กับครอบครัว/คู่สมรส
สเปกเต็ม ๆ อยู่ที่ [Issue #1](https://github.com/XNOT-CH/xnot_mattpocock/issues/1)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth) — คนละ login, เห็นข้อมูล household เดียวกัน
- Vercel สำหรับ deploy

## Setup

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. รัน SQL ใน `supabase/migrations/` ตามลำดับ (0001, 0002, 0003) ผ่าน Supabase SQL editor (หรือ Supabase CLI)
3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` จากหน้า Project Settings → API
4. `npm run dev` แล้วเปิด [http://localhost:3000](http://localhost:3000)

## สถานะ

สิ่งที่ทำแล้ว (ครบตามสเปกใน issue #1): ล็อกอิน/สมัครสมาชิก, สร้าง/เข้าร่วมบัญชีครอบครัวด้วยลิงก์เชิญ, เพิ่มรายการรายรับ-รายจ่าย, สรุปยอดรายเดือนแบบง่าย, ตั้งงบประมาณรายหมวดหมู่ + แจ้งเตือนในแอปเมื่อใกล้/เกินงบ, กราฟรายงาน (วงกลมตามหมวดหมู่ + แท่งแนวโน้มย้อนหลัง) กรองดูรายคนได้, ตั้งรายการเตือนซ้ำรายเดือน (ไม่บันทึกอัตโนมัติ), หน้าจัดการสมาชิก/สร้าง-ยกเลิกลิงก์เชิญ, แนบรูปใบเสร็จ (เก็บใน Supabase Storage)

นอกสโคป MVP: นำเข้าข้อมูลอัตโนมัติ/OCR ใบเสร็จ (ดู issue #7)
