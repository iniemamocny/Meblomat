import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from './config';

const SERVICE_ROLE_ERROR_MESSAGE =
  'Skonfiguruj zmienną SUPABASE_SERVICE_ROLE_KEY, aby wysyłać zaproszenia z poziomu panelu.';

export function assertServiceRoleKey(): asserts SUPABASE_SERVICE_ROLE_KEY {
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(SERVICE_ROLE_ERROR_MESSAGE);
  }
}

export function createSupabaseAdminClient(): SupabaseClient {
  assertServiceRoleKey();
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export { SERVICE_ROLE_ERROR_MESSAGE };
