import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { card, errorBanner, heading, input, primaryButton, secondaryButton, sectionLabel } from "@/lib/ui";
import { createHousehold, joinHousehold } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; token?: string }>;
}) {
  const { error, token } = await searchParams;

  const household = await getCurrentHousehold();
  if (household) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className={heading}>เริ่มต้นใช้งาน</h1>

      {error && <p className={errorBanner}>{error}</p>}

      <section className={`flex flex-col gap-3 ${card}`}>
        <h2 className={sectionLabel}>สร้างบัญชีครอบครัวใหม่</h2>
        <form className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="เช่น บ้านสมิท"
            required
            className={input}
          />
          <button formAction={createHousehold} className={primaryButton}>
            สร้างบัญชี
          </button>
        </form>
      </section>

      <section className={`flex flex-col gap-3 ${card}`}>
        <h2 className={sectionLabel}>เข้าร่วมบัญชีครอบครัวที่มีอยู่แล้ว</h2>
        <form className="flex flex-col gap-3">
          <input
            name="token"
            placeholder="วางลิงก์เชิญที่นี่"
            defaultValue={token ?? ""}
            required
            className={input}
          />
          <button formAction={joinHousehold} className={secondaryButton}>
            เข้าร่วม
          </button>
        </form>
      </section>
    </div>
  );
}
