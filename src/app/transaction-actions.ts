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

  let receiptUrl: string | null = null;
  const receipt = formData.get("receipt");
  if (receipt instanceof File && receipt.size > 0) {
    const path = `${household.id}/${crypto.randomUUID()}-${receipt.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, receipt, { contentType: receipt.type });

    if (uploadError) {
      redirect(`/?error=${encodeURIComponent(uploadError.message)}`);
    }
    receiptUrl = path;
  }

  const { error } = await supabase.from("transactions").insert({
    household_id: household.id,
    category_id: categoryId,
    user_id: user!.id,
    type,
    amount,
    occurred_on: occurredOn,
    note,
    receipt_url: receiptUrl,
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
}
