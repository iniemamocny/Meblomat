import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieAccessor = () => CookieStore;

function createCookieAdapter(accessCookies: CookieAccessor) {
  return {
    get(name: string) {
      return accessCookies().get(name)?.value;
    },
    set(name: string, value: string, options: CookieOptions) {
      accessCookies().set({ name, value, ...options });
    },
    remove(name: string, options: CookieOptions) {
      accessCookies().set({ name, value: '', ...options, expires: new Date(0) });
    },
  };
}

function createSupabaseClient(accessCookies: CookieAccessor): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: createCookieAdapter(accessCookies),
  });
}

export function createSupabaseServerClient(cookieStore: CookieStore): SupabaseClient {
  return createSupabaseClient(() => cookieStore);
}

export async function createSupabaseServerActionClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createSupabaseClient(() => cookieStore);
}
