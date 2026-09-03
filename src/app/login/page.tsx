import { signIn, signUp } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">บัญชีรายรับรายจ่ายครอบครัว</h1>

      {message && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          อีเมล
          <input
            name="email"
            type="email"
            required
            className="rounded-md border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          รหัสผ่าน
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border px-3 py-2"
          />
        </label>

        <div className="mt-2 flex gap-2">
          <button
            formAction={signIn}
            className="flex-1 rounded-md bg-black px-3 py-2 text-sm font-medium text-white"
          >
            เข้าสู่ระบบ
          </button>
          <button
            formAction={signUp}
            className="flex-1 rounded-md border px-3 py-2 text-sm font-medium"
          >
            สมัครสมาชิก
          </button>
        </div>
      </form>
    </div>
  );
}
