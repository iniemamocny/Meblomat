import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

type CookieStore = ReturnType<typeof cookies>;

function createCookieAdapter(cookieStore: CookieStore) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: Parameters<CookieStore['set']>[0]) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name: string, options: Parameters<CookieStore['set']>[0]) {
      cookieStore.set({ name, value: '', ...options, expires: new Date(0) });
    },
  };
}

export function createSupabaseServerClient(cookieStore?: CookieStore): SupabaseClient {
  const store = cookieStore ?? cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: createCookieAdapter(store),
  });
}
