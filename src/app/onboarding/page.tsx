import { redirect } from "next/navigation";
import { getCurrentHousehold } from "@/lib/household";
import { createHousehold, joinHousehold } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const household = await getCurrentHousehold();
  if (household) redirect("/");

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-8 px-4">
      <h1 className="text-2xl font-semibold">เริ่มต้นใช้งาน</h1>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-600">สร้างบัญชีครอบครัวใหม่</h2>
        <form className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="เช่น บ้านสมิท"
            required
            className="rounded-md border px-3 py-2"
          />
          <button
            formAction={createHousehold}
            className="rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            สร้างบัญชี
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-600">
          เข้าร่วมบัญชีครอบครัวที่มีอยู่แล้ว
        </h2>
        <form className="flex flex-col gap-3">
          <input
            name="token"
            placeholder="วางลิงก์เชิญที่นี่"
            required
            className="rounded-md border px-3 py-2"
          />
          <button
            formAction={joinHousehold}
            className="rounded-md border px-3 py-2 text-sm font-medium"
          >
            เข้าร่วม
          </button>
        </form>
      </section>
    </div>
  );
}
