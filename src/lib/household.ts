import { createClient, getSessionUser } from "@/lib/supabase/server";
import type { Household } from "@/lib/types";

export async function getCurrentHousehold(): Promise<Household | null> {
  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) return null;

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, households(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  return membership.households as unknown as Household;
}
