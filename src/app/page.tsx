import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { currentMonthStart, getMonthlySpendByCategory } from "@/lib/budgets";
import type { Budget, Category, RecurringReminder, Transaction } from "@/lib/types";
import {
  card,
  errorBanner,
  heading,
  infoBanner,
  input,
  link,
  pageWrap,
  primaryButton,
  sectionLabel,
  subheading,
  warnBanner,
} from "@/lib/ui";
import { signOut } from "./login/actions";
import { addTransaction } from "./transaction-actions";

function formatBaht(amount: number) {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const supabase = await createClient();

  const monthStartStr = currentMonthStart();

  const [
    { data: categories },
    { data: transactions },
    { data: budgets },
    spendByCategory,
    { data: reminders },
    { data: monthCategoryRows },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .or(`household_id.is.null,household_id.eq.${household.id}`)
      .order("type"),
    supabase
      .from("transactions")
      .select("*")
      .eq("household_id", household.id)
      .gte("occurred_on", monthStartStr)
      .order("occurred_on", { ascending: false })
      .limit(20),
    supabase
      .from("budgets")
      .select("*")
      .eq("household_id", household.id)
      .eq("month", monthStartStr),
    getMonthlySpendByCategory(household.id, monthStartStr),
    supabase
      .from("recurring_reminders")
      .select("*")
      .eq("household_id", household.id)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select("category_id")
      .eq("household_id", household.id)
      .gte("occurred_on", monthStartStr),
  ]);

  const typedTransactions = (transactions ?? []) as Transaction[];
  const typedCategories = (categories ?? []) as Category[];
  const typedBudgets = (budgets ?? []) as Budget[];
  const typedReminders = (reminders ?? []) as RecurringReminder[];
  const categoryById = new Map(typedCategories.map((c) => [c.id, c]));

  const categoriesLoggedThisMonth = new Set(
    (monthCategoryRows ?? []).map((r) => r.category_id),
  );
  const today = new Date().getDate();
  const pendingReminders = typedReminders.filter(
    (r) => r.day_of_month <= today && !categoriesLoggedThisMonth.has(r.category_id),
  );

  const budgetAlerts = typedBudgets
    .filter((b) => Number(b.amount) > 0)
    .map((b) => ({
      category: categoryById.get(b.category_id),
      budget: Number(b.amount),
      spent: spendByCategory.get(b.category_id) ?? 0,
    }))
    .filter((a) => a.category && a.spent / a.budget >= 0.9);

  const receiptSignedUrls = await Promise.all(
    typedTransactions
      .filter((t) => t.receipt_url)
      .map(async (t) => {
        const { data } = await supabase.storage
          .from("receipts")
          .createSignedUrl(t.receipt_url!, 60 * 60);
        return [t.id, data?.signedUrl ?? null] as const;
      }),
  );
  const receiptUrlByTransaction = new Map(receiptSignedUrls);

  const income = typedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = typedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className={pageWrap}>
      <header className="flex items-start justify-between">
        <div>
          <h1 className={heading}>{household.name}</h1>
          <p className={subheading}>สรุปเดือนนี้</p>
        </div>
        <nav className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
          <Link href="/reports" className={link}>
            รายงาน
          </Link>
          <Link href="/budgets" className={link}>
            งบประมาณ
          </Link>
          <Link href="/recurring" className={link}>
            รายการซ้ำ
          </Link>
          <Link href="/members" className={link}>
            สมาชิก
          </Link>
          <form>
            <button formAction={signOut} className="text-slate-400 hover:text-rose-600">
              ออกจากระบบ
            </button>
          </form>
        </nav>
      </header>

      {error && <p className={errorBanner}>{error}</p>}

      {budgetAlerts.length > 0 && (
        <section className="flex flex-col gap-2">
          {budgetAlerts.map((a) => (
            <p
              key={a.category!.id}
              className={a.spent >= a.budget ? errorBanner : warnBanner}
            >
              {a.spent >= a.budget
                ? `เกินงบ "${a.category!.name}" แล้ว (${formatBaht(a.spent)} / ${formatBaht(a.budget)})`
                : `ใกล้เต็มงบ "${a.category!.name}" แล้ว (${formatBaht(a.spent)} / ${formatBaht(a.budget)})`}
            </p>
          ))}
        </section>
      )}

      {pendingReminders.length > 0 && (
        <section className="flex flex-col gap-2">
          {pendingReminders.map((r) => (
            <form
              key={r.id}
              className={`flex items-center justify-between gap-3 ${infoBanner}`}
            >
              <span>อย่าลืมกรอกรายการ &quot;{r.label}&quot; ของเดือนนี้</span>
              <input type="hidden" name="type" value={r.type} />
              <input type="hidden" name="category_id" value={r.category_id} />
              <input
                type="hidden"
                name="amount"
                value={r.amount ? String(r.amount) : ""}
              />
              <input
                type="hidden"
                name="occurred_on"
                value={new Date().toISOString().slice(0, 10)}
              />
              <input type="hidden" name="note" value={r.label} />
              {r.amount ? (
                <button
                  formAction={addTransaction}
                  className="shrink-0 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                  บันทึกเลย
                </button>
              ) : (
                <Link href="/" className={`shrink-0 text-xs ${link}`}>
                  กรอกด้านล่าง
                </Link>
              )}
            </form>
          ))}
        </section>
      )}

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className={card}>
          <p className="text-xs text-slate-500">รายรับ</p>
          <p className="text-lg font-semibold text-emerald-600">
            {formatBaht(income)}
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-slate-500">รายจ่าย</p>
          <p className="text-lg font-semibold text-rose-600">
            {formatBaht(expense)}
          </p>
        </div>
        <div className={card}>
          <p className="text-xs text-slate-500">คงเหลือ</p>
          <p className="text-lg font-semibold text-slate-900">
            {formatBaht(income - expense)}
          </p>
        </div>
      </section>

      <section className={card}>
        <h2 className={`mb-3 ${sectionLabel}`}>เพิ่มรายการ</h2>
        <form className="grid grid-cols-2 gap-3" encType="multipart/form-data">
          <select name="type" required className={`col-span-2 ${input}`}>
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
          <select name="category_id" required className={`col-span-2 ${input}`}>
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
            min="0.01"
            placeholder="จำนวนเงิน"
            required
            className={input}
          />
          <input
            name="occurred_on"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={input}
          />
          <input
            name="note"
            placeholder="โน้ต (ไม่บังคับ)"
            className={`col-span-2 ${input}`}
          />
          <label className="col-span-2 flex flex-col gap-1 text-xs text-slate-500">
            แนบรูปใบเสร็จ (ไม่บังคับ)
            <input
              name="receipt"
              type="file"
              accept="image/*"
              className={`${input} text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-blue-700`}
            />
          </label>
          <button formAction={addTransaction} className={`col-span-2 ${primaryButton}`}>
            บันทึก
          </button>
        </form>
      </section>

      <section>
        <h2 className={`mb-3 ${sectionLabel}`}>รายการล่าสุด</h2>
        <ul className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/60">
          {typedTransactions.length === 0 && (
            <li className="p-4 text-sm text-slate-500">ยังไม่มีรายการเดือนนี้</li>
          )}
          {typedTransactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium text-slate-900">
                  {categoryById.get(t.category_id)?.name ?? "ไม่ระบุหมวดหมู่"}
                </p>
                <p className="text-xs text-slate-500">
                  {t.occurred_on}
                  {t.note ? ` · ${t.note}` : ""}
                  {receiptUrlByTransaction.get(t.id) && (
                    <>
                      {" · "}
                      <a
                        href={receiptUrlByTransaction.get(t.id)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={link}
                      >
                        ใบเสร็จ
                      </a>
                    </>
                  )}
                </p>
              </div>
              <p
                className={
                  t.type === "income"
                    ? "font-medium text-emerald-600"
                    : "font-medium text-rose-600"
                }
              >
                {t.type === "income" ? "+" : "-"}
                {formatBaht(Number(t.amount))}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
