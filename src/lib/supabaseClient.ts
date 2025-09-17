import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseBrowserConfigOrThrow } from "./envClient";

let client: SupabaseClient | undefined;

export function createSupabaseBrowserClient() {
  if (!client) {
    const { url, anonKey } = getSupabaseBrowserConfigOrThrow();
    client = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return client;
}
