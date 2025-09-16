import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

function requireEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`${key} is not set`);
  }

  return value;
}

const supabaseUrl = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  "NEXT_PUBLIC_SUPABASE_URL",
);
const supabaseAnonKey = requireEnv(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
);

export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch {
          // The cookies API can be read-only in some Next.js rendering phases.
        }
      },
      remove(name: string) {
        try {
          cookieStore.delete(name);
        } catch {
          // Ignore removal errors when cookies are read-only.
        }
      },
    },
  });
}
