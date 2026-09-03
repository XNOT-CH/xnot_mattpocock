"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const token = String(formData.get("token") ?? "").trim();
  if (!token)
    redirect(
      `/onboarding?error=${encodeURIComponent("กรุณากรอกลิงก์เชิญ")}`,
    );

  const { data: invite, error: inviteError } = await supabase
    .from("household_invites")
    .select("household_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteError || !invite) {
    redirect(
      `/onboarding?error=${encodeURIComponent("ลิงก์เชิญไม่ถูกต้องหรือหมดอายุ")}`,
    );
  }

  if (invite!.expires_at && new Date(invite!.expires_at) < new Date()) {
    redirect(
      `/onboarding?error=${encodeURIComponent("ลิงก์เชิญหมดอายุแล้ว")}`,
    );
  }

  const { error: memberError } = await supabase
    .from("household_members")
    .insert({ household_id: invite!.household_id, user_id: user!.id });

  if (memberError) {
    redirect(`/onboarding?error=${encodeURIComponent(memberError.message)}`);
  }

  redirect("/");
}
