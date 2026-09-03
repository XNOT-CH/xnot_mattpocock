# บัญชีรายรับรายจ่ายครอบครัว

เว็บแอป Next.js สำหรับบันทึกรายรับ-รายจ่ายที่แชร์กับครอบครัว/คู่สมรส
สเปกเต็ม ๆ อยู่ที่ [Issue #1](https://github.com/XNOT-CH/xnot_mattpocock/issues/1)

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Auth) — คนละ login, เห็นข้อมูล household เดียวกัน
- Vercel สำหรับ deploy

## Setup

1. สร้างโปรเจกต์ที่ [supabase.com](https://supabase.com)
2. รัน SQL ใน `supabase/migrations/0001_init.sql` ผ่าน Supabase SQL editor (หรือ Supabase CLI)
3. คัดลอก `.env.local.example` เป็น `.env.local` แล้วใส่ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` จากหน้า Project Settings → API
4. `npm run dev` แล้วเปิด [http://localhost:3000](http://localhost:3000)

## สถานะ

สิ่งที่ทำแล้ว: ล็อกอิน/สมัครสมาชิก, สร้าง/เข้าร่วมบัญชีครอบครัวด้วยลิงก์เชิญ, เพิ่มรายการรายรับ-รายจ่าย, สรุปยอดรายเดือนแบบง่าย

สิ่งที่ยังไม่ทำ (ดู decisions ใน issue #1): กราฟรายงาน (วงกลม/แท่ง), งบประมาณรายหมวดหมู่ + แจ้งเตือน, การเตือนรายการที่เกิดซ้ำรายเดือน, หน้าจัดการลิงก์เชิญ/สมาชิก, แนบรูปใบเสร็จ
