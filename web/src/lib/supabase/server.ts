import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieSetter = (options: { name: string; value: string } & CookieOptions) => void;

type MutableCookieStore = CookieStore & {
  set?: CookieSetter;
};

function persistCookie(
  cookieStore: CookieStore,
  name: string,
  value: string,
  options: CookieOptions | undefined,
) {
  const mutableStore = cookieStore as MutableCookieStore;
  if (typeof mutableStore.set !== 'function') {
    return;
  }

  try {
    mutableStore.set({ name, value, ...(options ?? {}) });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Nie udało się zaktualizować ciasteczka Supabase.', error);
    }
  }
}

function createSupabaseClient(cookieStore: CookieStore): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        persistCookie(cookieStore, name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        persistCookie(cookieStore, name, '', {
          ...(options ?? {}),
          maxAge: 0,
          expires: new Date(0),
        });
      },
    },
  });
}

export function createSupabaseServerClient(cookieStore: CookieStore): SupabaseClient {
  return createSupabaseClient(cookieStore);
}

export async function createSupabaseServerActionClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createSupabaseClient(cookieStore);
}
