"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import { currentMonthStart } from "@/lib/budgets";

export async function setBudget(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const categoryId = String(formData.get("category_id"));
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw === "" ? 0 : Number(amountRaw);

  if (!categoryId || !(amount >= 0)) {
    redirect(`/budgets?error=${encodeURIComponent("กรอกจำนวนเงินไม่ถูกต้อง")}`);
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      household_id: household.id,
      user_id: user.id,
      category_id: categoryId,
      month: currentMonthStart(),
      amount,
    },
    { onConflict: "household_id,user_id,category_id,month" },
  );

  if (error) {
    redirect(`/budgets?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/budgets");
  revalidatePath("/");
}
