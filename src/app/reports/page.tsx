import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import type { Category, Transaction } from "@/lib/types";
import { card, heading, link, pageWrap, sectionLabel, subheading } from "@/lib/ui";
import { ExpenseByCategoryPie, MonthlyTrendBar } from "./charts";
import { UserFilter } from "./user-filter";

const TREND_MONTHS = 6;

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function monthLabel(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ user?: string }>;
}) {
  const { user: userFilter } = await searchParams;

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const supabase = await createClient();

  const rangeStart = new Date();
  rangeStart.setDate(1);
  rangeStart.setMonth(rangeStart.getMonth() - (TREND_MONTHS - 1));
  const rangeStartStr = rangeStart.toISOString().slice(0, 10);

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().slice(0, 10);

  let transactionsQuery = supabase
    .from("transactions")
    .select("*")
    .eq("household_id", household.id)
    .gte("occurred_on", rangeStartStr);
  if (userFilter) transactionsQuery = transactionsQuery.eq("user_id", userFilter);

  const [{ data: members }, { data: categories }, { data: transactions }] =
    await Promise.all([
      supabase
        .from("household_members")
        .select("user_id, display_name")
        .eq("household_id", household.id),
      supabase
        .from("categories")
        .select("*")
        .or(`household_id.is.null,household_id.eq.${household.id}`),
      transactionsQuery,
    ]);

  const typedTransactions = (transactions ?? []) as Transaction[];
  const typedCategories = (categories ?? []) as Category[];
  const categoryById = new Map(typedCategories.map((c) => [c.id, c]));

  const pieData = Array.from(
    typedTransactions
      .filter((t) => t.type === "expense" && t.occurred_on >= monthStartStr)
      .reduce((map, t) => {
        const name = categoryById.get(t.category_id)?.name ?? "ไม่ระบุหมวดหมู่";
        map.set(name, (map.get(name) ?? 0) + Number(t.amount));
        return map;
      }, new Map<string, number>()),
  ).map(([name, value]) => ({ name, value }));

  const trendMap = new Map<string, { รายรับ: number; รายจ่าย: number }>();
  for (let i = 0; i < TREND_MONTHS; i++) {
    const d = new Date(rangeStart);
    d.setMonth(d.getMonth() + i);
    trendMap.set(d.toISOString().slice(0, 7), { รายรับ: 0, รายจ่าย: 0 });
  }
  for (const t of typedTransactions) {
    const key = monthKey(t.occurred_on);
    const bucket = trendMap.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.รายรับ += Number(t.amount);
    else bucket.รายจ่าย += Number(t.amount);
  }
  const trendData = Array.from(trendMap.entries()).map(([month, totals]) => ({
    month: monthLabel(month),
    ...totals,
  }));

  return (
    <div className={pageWrap}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className={heading}>รายงาน</h1>
          <p className={subheading}>สรุปรายจ่ายและแนวโน้ม</p>
        </div>
        <Link href="/" className={`text-sm ${link}`}>
          กลับหน้าหลัก
        </Link>
      </header>

      <UserFilter members={members ?? []} selected={userFilter} />

      <section className={card}>
        <h2 className={`mb-3 ${sectionLabel}`}>รายจ่ายตามหมวดหมู่ (เดือนนี้)</h2>
        <ExpenseByCategoryPie data={pieData} />
      </section>

      <section className={card}>
        <h2 className={`mb-3 ${sectionLabel}`}>แนวโน้มย้อนหลัง {TREND_MONTHS} เดือน</h2>
        <MonthlyTrendBar data={trendData} />
      </section>
    </div>
  );
}
