import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requireSupabaseCredentials } from './config';

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
  return (
    error instanceof Error &&
    (error.name === 'ReadonlyRequestCookiesError' ||
      error.message.includes('ReadonlyRequestCookiesError'))
  );
}

export function createSupabaseServerClient(cookieStore: CookieStore): SupabaseClient {
  const { url, anonKey } = requireSupabaseCredentials();
  return createServerClient(url, anonKey, {
    cookies: createCookieAdapter(cookieStore),
  });
}

export { SupabaseConfigError } from './config';
