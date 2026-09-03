"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function addTransaction(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const type = String(formData.get("type"));
  const amount = Number(formData.get("amount"));
  const categoryId = String(formData.get("category_id"));
  const occurredOn = String(formData.get("occurred_on"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!["income", "expense"].includes(type) || !(amount > 0) || !categoryId || !occurredOn) {
    redirect(`/?error=${encodeURIComponent("กรอกข้อมูลไม่ครบ")}`);
  }

  const { error } = await supabase.from("transactions").insert({
    household_id: household.id,
    category_id: categoryId,
    user_id: user!.id,
    type,
    amount,
    occurred_on: occurredOn,
    note,
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
}
