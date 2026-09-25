import { errorBanner, heading, infoBanner, input, primaryButton, secondaryButton } from "@/lib/ui";
import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl text-white">
          ฿
        </div>
        <h1 className={heading}>บัญชีรายรับรายจ่ายครอบครัว</h1>
      </div>

      {message && <p className={infoBanner}>{message}</p>}
      {error && <p className={errorBanner}>{error}</p>}

      <form className="flex flex-col gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm shadow-slate-200/60 dark:shadow-none">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
          อีเมล
          <input name="email" type="email" required className={input} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
          รหัสผ่าน
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className={input}
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button formAction={signIn} className={`flex-1 ${primaryButton}`}>
            เข้าสู่ระบบ
          </button>
          <button formAction={signUp} className={`flex-1 ${secondaryButton}`}>
            สมัครสมาชิก
          </button>
        </div>
      </form>
    </div>
  );
}
