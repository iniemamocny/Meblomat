import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseConfigOrThrow } from "./env";

export function createSupabaseServerClient() {
  const { url, anonKey } = getSupabaseConfigOrThrow();

  return createServerClient(url, anonKey, {
    cookies: {
      async get(name: string) {
        const cookieStore = await cookies();
        return cookieStore.get(name)?.value;
      },
      async set(name: string, value: string, options: CookieOptions = {}) {
        try {
          const cookieStore = await cookies();
          cookieStore.set(name, value, options);
        } catch {
          // The cookies API can be read-only in some Next.js rendering phases.
        }
      },
      async remove(name: string, options: CookieOptions = {}) {
        try {
          const cookieStore = await cookies();
          cookieStore.delete({ name, ...options });
        } catch {
          // Ignore removal errors when cookies are read-only.
        }
      },
    },
  });
}
