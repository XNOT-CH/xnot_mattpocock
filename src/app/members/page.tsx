import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getCurrentHousehold } from "@/lib/household";
import {
  card,
  errorBanner,
  heading,
  input,
  link,
  pageWrap,
  primaryButton,
  sectionLabel,
  subheading,
} from "@/lib/ui";
import { createInvite, revokeInvite, updateDisplayName } from "./actions";
import { CopyInviteLink } from "./copy-invite-link";

type Member = {
  user_id: string;
  display_name: string | null;
  created_at: string;
};

type Invite = {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
};

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const household = await getCurrentHousehold();
  if (!household) redirect("/onboarding");

  const supabase = await createClient();

  const user = await getSessionUser(supabase);
  if (!user) redirect("/login");

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, display_name, created_at")
      .eq("household_id", household.id)
      .order("created_at"),
    supabase
      .from("household_invites")
      .select("id, token, created_at, expires_at")
      .eq("household_id", household.id)
      .order("created_at", { ascending: false }),
  ]);

  const typedMembers = (members ?? []) as Member[];
  const typedInvites = (invites ?? []) as Invite[];
  const me = typedMembers.find((m) => m.user_id === user.id);

  const host = (await headers()).get("host");
  const origin = host ? `${host.startsWith("localhost") ? "http" : "https"}://${host}` : "";

  return (
    <div className={pageWrap}>
      <header className="flex items-center justify-between">
        <div>
          <h1 className={heading}>สมาชิกและลิงก์เชิญ</h1>
          <p className={subheading}>{household.name}</p>
        </div>
        <Link href="/" className={`text-sm ${link}`}>
          กลับหน้าหลัก
        </Link>
      </header>

      {error && <p className={errorBanner}>{error}</p>}

      <section className={card}>
        <h2 className={`mb-3 ${sectionLabel}`}>ชื่อของฉัน</h2>
        <form className="flex gap-2">
          <input
            name="display_name"
            placeholder="ชื่อที่แสดงในรายงาน"
            defaultValue={me?.display_name ?? ""}
            required
            className={`flex-1 ${input}`}
          />
          <button formAction={updateDisplayName} className={primaryButton}>
            บันทึก
          </button>
        </form>
      </section>

      <section>
        <h2 className={`mb-3 ${sectionLabel}`}>สมาชิกในบัญชี</h2>
        <ul className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm shadow-slate-200/60 dark:shadow-none">
          {typedMembers.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between p-3 text-sm">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {m.display_name ?? "ไม่ระบุชื่อ"}
                {m.user_id === user.id ? " (คุณ)" : ""}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เข้าร่วมเมื่อ {new Date(m.created_at).toLocaleDateString("th-TH")}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className={sectionLabel}>ลิงก์เชิญ</h2>
          <form>
            <button
              formAction={createInvite}
              className={`${primaryButton} px-3 py-1.5 text-xs`}
            >
              สร้างลิงก์เชิญใหม่
            </button>
          </form>
        </div>

        <ul className="flex flex-col gap-2">
          {typedInvites.length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">ยังไม่มีลิงก์เชิญ</li>
          )}
          {typedInvites.map((invite) => {
            const inviteUrl = `${origin}/onboarding?token=${invite.token}`;
            return (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs"
              >
                <code className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{inviteUrl}</code>
                <div className="flex shrink-0 items-center gap-3">
                  <CopyInviteLink url={inviteUrl} />
                  <form>
                    <input type="hidden" name="id" value={invite.id} />
                    <button
                      formAction={revokeInvite}
                      className="font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300"
                    >
                      ยกเลิก
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
