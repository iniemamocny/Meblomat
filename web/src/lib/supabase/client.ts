import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseCredentials } from './config';

let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = requireSupabaseCredentials();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
