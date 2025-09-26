import { cookies } from 'next/headers';
import type { CookieOptions } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigError, requireSupabaseCredentials } from './config';

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
  try {
    const { url, anonKey } = requireSupabaseCredentials();
    return createServerClient(url, anonKey, {
      cookies: createCookieAdapter(cookieStore),
    });
  } catch (error) {
    throw new SupabaseConfigError(
      `Nie udało się utworzyć klienta Supabase: ${(error as Error)?.message ?? 'nieznany błąd'}`,
      { cause: error instanceof Error ? error : undefined },
    );
  }
}

export function resolveSupabaseServerClient(cookieStore: CookieStore): {
  client: SupabaseClient | null;
  error: string | null;
} {
  try {
    const client = createSupabaseServerClient(cookieStore);
    return { client, error: null };
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.warn('[Supabase] Pominięto inicjalizację klienta na serwerze:', error.message);
      return { client: null, error: error.message };
    }
    throw error;
  }
}
