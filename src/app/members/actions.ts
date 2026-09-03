"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";

export async function updateDisplayName(formData: FormData) {
  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!displayName) {
    redirect(`/members?error=${encodeURIComponent("กรุณากรอกชื่อ")}`);
  }

  const { error } = await supabase
    .from("household_members")
    .update({ display_name: displayName })
    .eq("household_id", household.id)
    .eq("user_id", user.id);

  if (error) {
    redirect(`/members?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/members");
  revalidatePath("/reports");
}

export async function createInvite() {
  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const { error } = await supabase
    .from("household_invites")
    .insert({ household_id: household.id, created_by: user.id });

  if (error) {
    redirect(`/members?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/members");
}

export async function revokeInvite(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id"));

  await supabase.from("household_invites").delete().eq("id", id);

  revalidatePath("/members");
}
