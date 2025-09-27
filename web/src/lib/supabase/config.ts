export class SupabaseConfigError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SupabaseConfigError';
  }
}

function readEnv(name: string) {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new SupabaseConfigError(
      `Brak wymaganej zmiennej środowiskowej ${name}. Uzupełnij konfigurację Supabase w pliku .env.local.`,
    );
  }
  return value.trim();
}

function validateSupabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new SupabaseConfigError(
        'Nieprawidłowy protokół w zmiennej NEXT_PUBLIC_SUPABASE_URL. Użyj adresu rozpoczynającego się od https://.',
      );
    }
    return url;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      throw error;
    }
    throw new SupabaseConfigError(
      'Nieprawidłowy format zmiennej NEXT_PUBLIC_SUPABASE_URL. Skopiuj dokładny adres z zakładki API w Supabase.',
    );
  }
}

function validateSupabaseAnonKey(key: string) {
  if (!key.includes('.')) {
    throw new SupabaseConfigError(
      'Nieprawidłowy format zmiennej NEXT_PUBLIC_SUPABASE_ANON_KEY. Skopiuj pełny klucz anonimowy JWT z panelu Supabase.',
    );
  }
  return key;
}

export function requireSupabaseCredentials() {
  const url = validateSupabaseUrl(readEnv('NEXT_PUBLIC_SUPABASE_URL'));
  const anonKey = validateSupabaseAnonKey(readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  return { url, anonKey } as const;
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_SITE_URL = 'http://localhost:3000';

function validateSiteUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new SupabaseConfigError(
        'Nieprawidłowy protokół w zmiennej NEXT_PUBLIC_SITE_URL. Użyj adresu rozpoczynającego się od https://.',
      );
    }
    return url;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      throw error;
    }
    throw new SupabaseConfigError(
      'Nieprawidłowy format zmiennej NEXT_PUBLIC_SITE_URL. Upewnij się, że zawiera pełny adres strony, np. https://twojadomena.pl.',
    );
  }
}

export function requireSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
      throw new SupabaseConfigError(
        'Brak wymaganej zmiennej NEXT_PUBLIC_SITE_URL. Skonfiguruj adres strony w pliku .env, aby dokończyć rejestrację użytkowników.',
      );
    }
    return DEFAULT_SITE_URL;
  }

  return validateSiteUrl(siteUrl);
}

export function getSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    return DEFAULT_SITE_URL;
  }
  return validateSiteUrl(siteUrl);
}
