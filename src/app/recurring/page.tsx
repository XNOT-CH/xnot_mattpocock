import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Category, RecurringReminder } from "@/lib/types";
import {
  card,
  errorBanner,
  heading,
  input,
  link,
  pageWrap,
  primaryButton,
  secondaryButton,
  sectionLabel,
  subheading,
} from "@/lib/ui";
import { addReminder, toggleReminder } from "./actions";

export default async function RecurringPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const supabase = await createClient();

  const [{ data: reminders }, { data: categories }] = await Promise.all([
    supabase
      .from("recurring_reminders")
      .select("*")
      .eq("household_id", household.id)
      .order("day_of_month"),
    supabase
      .from("categories")
      .select("*")
      .or(`household_id.is.null,household_id.eq.${household.id}`)
      .order("type"),
  ]);

  const typedReminders = (reminders ?? []) as RecurringReminder[];
  const typedCategories = (categories ?? []) as Category[];
  const categoryById = new Map(typedCategories.map((c) => [c.id, c]));

  return (
    <div className={pageWrap}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className={heading}>รายการที่เกิดซ้ำ</h1>
          <p className={subheading}>เตือนให้กรอกทุกเดือน (ไม่บันทึกอัตโนมัติ)</p>
        </div>
        <Link href="/" className={`text-sm ${link}`}>
          กลับหน้าหลัก
        </Link>
      </header>

      {error && <p className={errorBanner}>{error}</p>}

      <section className={card}>
        <h2 className={`mb-3 ${sectionLabel}`}>เพิ่มรายการเตือน</h2>
        <form className="grid grid-cols-2 gap-3">
          <input
            name="label"
            placeholder="ชื่อรายการ เช่น ค่าเช่าบ้าน"
            required
            className={`col-span-2 ${input}`}
          />
          <select name="type" required className={input}>
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
          <select name="category_id" required className={input}>
            {typedCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type === "income" ? "รายรับ" : "รายจ่าย"})
              </option>
            ))}
          </select>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="จำนวนเงิน (ไม่บังคับ)"
            className={input}
          />
          <input
            name="day_of_month"
            type="number"
            min="1"
            max="28"
            placeholder="วันที่ของเดือน (1-28)"
            required
            className={input}
          />
          <button formAction={addReminder} className={`col-span-2 ${primaryButton}`}>
            บันทึก
          </button>
        </form>
      </section>

      <section>
        <h2 className={`mb-3 ${sectionLabel}`}>รายการทั้งหมด</h2>
        <ul className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          {typedReminders.length === 0 && (
            <li className="p-4 text-sm text-slate-500">ยังไม่มีรายการเตือน</li>
          )}
          {typedReminders.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate font-medium ${r.is_active ? "text-slate-900" : "text-slate-400 line-through"}`}
                >
                  {r.label}
                </p>
                <p className="truncate text-xs text-slate-500">
                  ทุกวันที่ {r.day_of_month} · {categoryById.get(r.category_id)?.name ?? "-"}
                  {r.amount ? ` · ${Number(r.amount).toLocaleString("th-TH")} บาท` : ""}
                </p>
              </div>
              <form className="shrink-0">
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="is_active" value={String(r.is_active)} />
                <button
                  formAction={toggleReminder}
                  className={`${secondaryButton} px-3 py-1 text-xs`}
                >
                  {r.is_active ? "ปิดการเตือน" : "เปิดการเตือน"}
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
