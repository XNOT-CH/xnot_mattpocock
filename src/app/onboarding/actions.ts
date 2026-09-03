"use server";

import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  if (!name)
    redirect(
      `/onboarding?error=${encodeURIComponent("กรุณาตั้งชื่อบัญชีครอบครัว")}`,
    );

  const { error } = await supabase.rpc("create_household", {
    household_name: name,
  });

  if (error) {
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/");
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const rawInput = String(formData.get("token") ?? "").trim();
  if (!rawInput)
    redirect(
      `/onboarding?error=${encodeURIComponent("กรุณากรอกลิงก์เชิญ")}`,
    );

  let token = rawInput;
  try {
    const url = new URL(rawInput);
    token = url.searchParams.get("token") ?? rawInput;
  } catch {
    // not a URL, treat the input as a raw token
  }

  const { error: joinError } = await supabase.rpc("join_household_by_invite", {
    invite_token: token,
  });

  if (joinError) {
    redirect(`/onboarding?error=${encodeURIComponent(joinError.message)}`);
  }

  redirect("/");
}
