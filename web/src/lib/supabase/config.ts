export class SupabaseConfigError extends Error {
  constructor(
    message =
      'Brak konfiguracji Supabase. Dodaj zmienne NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY w pliku .env.local lub w ustawieniach środowiska.',
  ) {
    super(message);
    this.name = 'SupabaseConfigError';
  }
}

type SupabaseCredentials = {
  url: string;
  anonKey: string;
};

export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSupabaseCredentials(): SupabaseCredentials | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function requireSupabaseCredentials(): SupabaseCredentials {
  const credentials = getSupabaseCredentials();
  if (!credentials) {
    throw new SupabaseConfigError();
  }
  return credentials;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseCredentials() !== null;
}

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
