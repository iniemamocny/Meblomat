import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfigOrThrow } from "./env";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = getSupabaseConfigOrThrow();
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
