import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { currentMonthStart, getMonthlySpendByCategory } from "@/lib/budgets";
import type { Budget, Category } from "@/lib/types";
import { card, errorBanner, heading, input, link, pageWrap, primaryButton, subheading } from "@/lib/ui";
import { setBudget } from "./actions";

function formatBaht(amount: number) {
  return amount.toLocaleString("th-TH", { minimumFractionDigits: 2 });
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const supabase = await createClient();
  const monthStart = currentMonthStart();

  const [{ data: categories }, { data: budgets }, spendByCategory] =
    await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .or(`household_id.is.null,household_id.eq.${household.id}`)
        .eq("type", "expense")
        .order("name"),
      supabase
        .from("budgets")
        .select("*")
        .eq("household_id", household.id)
        .eq("month", monthStart),
      getMonthlySpendByCategory(household.id, monthStart),
    ]);

  const typedCategories = (categories ?? []) as Category[];
  const typedBudgets = (budgets ?? []) as Budget[];
  const budgetByCategory = new Map(
    typedBudgets.map((b) => [b.category_id, Number(b.amount)]),
  );

  return (
    <div className={pageWrap}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className={heading}>งบประมาณ</h1>
          <p className={subheading}>ตั้งงบรายเดือนแยกตามหมวดหมู่</p>
        </div>
        <Link href="/" className={`text-sm ${link}`}>
          กลับหน้าหลัก
        </Link>
      </header>

      {error && <p className={errorBanner}>{error}</p>}

      <ul className="flex flex-col gap-3">
        {typedCategories.map((category) => {
          const budget = budgetByCategory.get(category.id) ?? 0;
          const spent = spendByCategory.get(category.id) ?? 0;
          const ratio = budget > 0 ? spent / budget : 0;
          const barColor =
            ratio >= 1 ? "bg-rose-600" : ratio >= 0.9 ? "bg-amber-500" : "bg-blue-600";

          return (
            <li key={category.id} className={card}>
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium text-slate-900">{category.name}</p>
                <p className="text-xs text-slate-500">
                  ใช้ไป {formatBaht(spent)}
                  {budget > 0 ? ` / ${formatBaht(budget)}` : ""}
                </p>
              </div>

              {budget > 0 && (
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full ${barColor}`}
                    style={{ width: `${Math.min(ratio, 1) * 100}%` }}
                  />
                </div>
              )}

              <form className="flex gap-2">
                <input type="hidden" name="category_id" value={category.id} />
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="งบต่อเดือน"
                  defaultValue={budget > 0 ? budget : ""}
                  className={`flex-1 ${input}`}
                />
                <button formAction={setBudget} className={primaryButton}>
                  บันทึก
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
