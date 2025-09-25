import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function createCookieAdapter(cookieStore: CookieStore) {
  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      cookieStore.set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      cookieStore.set({ name, value: '', ...options, expires: new Date(0) });
    },
  };
}

export function createSupabaseServerClient(cookieStore: CookieStore): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: createCookieAdapter(cookieStore),
  });
}
