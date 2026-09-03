"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function addReminder(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type"));
  const categoryId = String(formData.get("category_id"));
  const dayOfMonth = Number(formData.get("day_of_month"));
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const amount = amountRaw === "" ? null : Number(amountRaw);

  if (
    !label ||
    !["income", "expense"].includes(type) ||
    !categoryId ||
    !(dayOfMonth >= 1 && dayOfMonth <= 28)
  ) {
    redirect(`/recurring?error=${encodeURIComponent("กรอกข้อมูลไม่ครบ")}`);
  }

  const { error } = await supabase.from("recurring_reminders").insert({
    household_id: household.id,
    category_id: categoryId,
    type,
    amount,
    label,
    day_of_month: dayOfMonth,
  });

  if (error) {
    redirect(`/recurring?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/recurring");
  revalidatePath("/");
}

export async function toggleReminder(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const isActive = String(formData.get("is_active")) === "true";

  await supabase
    .from("recurring_reminders")
    .update({ is_active: !isActive })
    .eq("id", id);

  revalidatePath("/recurring");
  revalidatePath("/");
}
