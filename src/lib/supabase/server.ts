import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll called from a Server Component; ignore when middleware
            // is refreshing the session instead.
          }
        },
      },
    },
  );
}

// The middleware already calls auth.getUser() (a network round trip to
// Supabase) to verify the session on every matched request. Downstream code
// in the same request can trust that cookie and read it locally instead of
// paying for a second round trip.
export async function getSessionUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}
