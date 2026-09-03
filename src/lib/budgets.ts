import { createClient } from "@/lib/supabase/server";

export function currentMonthStart(): string {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export async function getMonthlySpendByCategory(
  householdId: string,
  monthStart: string,
): Promise<Map<string, number>> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("transactions")
    .select("category_id, amount")
    .eq("household_id", householdId)
    .eq("type", "expense")
    .gte("occurred_on", monthStart);

  const spendByCategory = new Map<string, number>();
  for (const row of data ?? []) {
    const prev = spendByCategory.get(row.category_id) ?? 0;
    spendByCategory.set(row.category_id, prev + Number(row.amount));
  }
  return spendByCategory;
}
