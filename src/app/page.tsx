import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Category, Transaction } from "@/lib/types";
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

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  const [{ data: categories }, { data: transactions }] = await Promise.all([
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
  ]);

  const typedTransactions = (transactions ?? []) as Transaction[];
  const typedCategories = (categories ?? []) as Category[];
  const categoryById = new Map(typedCategories.map((c) => [c.id, c]));

  const income = typedTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = typedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold">{household.name}</h1>
        <p className="text-sm text-gray-500">สรุปเดือนนี้</p>
      </header>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border p-4">
          <p className="text-xs text-gray-500">รายรับ</p>
          <p className="text-lg font-semibold text-green-700">
            {formatBaht(income)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-gray-500">รายจ่าย</p>
          <p className="text-lg font-semibold text-red-700">
            {formatBaht(expense)}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs text-gray-500">คงเหลือ</p>
          <p className="text-lg font-semibold">{formatBaht(income - expense)}</p>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-sm font-medium text-gray-600">เพิ่มรายการ</h2>
        <form className="grid grid-cols-2 gap-3">
          <select name="type" required className="col-span-2 rounded-md border px-3 py-2">
            <option value="expense">รายจ่าย</option>
            <option value="income">รายรับ</option>
          </select>
          <select name="category_id" required className="col-span-2 rounded-md border px-3 py-2">
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
            className="rounded-md border px-3 py-2"
          />
          <input
            name="occurred_on"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border px-3 py-2"
          />
          <input
            name="note"
            placeholder="โน้ต (ไม่บังคับ)"
            className="col-span-2 rounded-md border px-3 py-2"
          />
          <button
            formAction={addTransaction}
            className="col-span-2 rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            บันทึก
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-gray-600">รายการล่าสุด</h2>
        <ul className="flex flex-col divide-y rounded-lg border">
          {typedTransactions.length === 0 && (
            <li className="p-4 text-sm text-gray-500">ยังไม่มีรายการเดือนนี้</li>
          )}
          {typedTransactions.map((t) => (
            <li key={t.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">
                  {categoryById.get(t.category_id)?.name ?? "ไม่ระบุหมวดหมู่"}
                </p>
                <p className="text-xs text-gray-500">
                  {t.occurred_on}
                  {t.note ? ` · ${t.note}` : ""}
                </p>
              </div>
              <p
                className={
                  t.type === "income" ? "font-medium text-green-700" : "font-medium text-red-700"
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
