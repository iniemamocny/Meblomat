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
      try {
        cookieStore.set({ name, value, ...options });
      } catch (error) {
        if (!isReadonlyRequestCookiesError(error)) {
          throw error;
        }
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.set({
          name,
          value: '',
          ...options,
          expires: new Date(0),
        });
      } catch (error) {
        if (!isReadonlyRequestCookiesError(error)) {
          throw error;
        }
      }
    },
  };
}

function isReadonlyRequestCookiesError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const constructorName = error.constructor?.name;
  if (constructorName === 'ReadonlyRequestCookiesError') {
    return true;
  }

  return error.message.includes(
    'Cookies can only be modified in a Server Action or Route Handler',
  );
}

export function createSupabaseServerClient(cookieStore: CookieStore): SupabaseClient {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: createCookieAdapter(cookieStore),
  });
}
