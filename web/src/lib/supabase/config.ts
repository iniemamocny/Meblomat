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
    return parsed;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      throw error;
    }
    throw new SupabaseConfigError(
      'Nieprawidłowy format zmiennej NEXT_PUBLIC_SITE_URL. Upewnij się, że zawiera pełny adres strony, np. https://twojadomena.pl.',
    );
  }
}

function normalizeSiteUrl(url: URL) {
  const normalized = url.toString();
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

export function requireSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  if (!rawSiteUrl) {
    if (nodeEnv !== 'development') {
      throw new SupabaseConfigError(
        'Brak zmiennej NEXT_PUBLIC_SITE_URL. Podaj publiczny adres wdrożonej aplikacji, aby Supabase mógł wysyłać poprawne linki logowania.',
      );
    }
    return DEFAULT_SITE_URL;
  }

  const parsed = validateSiteUrl(rawSiteUrl);
  const isLocalhost =
    parsed.hostname === 'localhost' ||
    parsed.hostname === '127.0.0.1' ||
    parsed.hostname.endsWith('.localhost') ||
    parsed.hostname.endsWith('.local');

  if (isLocalhost && nodeEnv !== 'development') {
    throw new SupabaseConfigError(
      'NEXT_PUBLIC_SITE_URL wskazuje na adres localhost. W środowisku produkcyjnym skonfiguruj pełny publiczny adres aplikacji, aby Supabase mógł poprawnie przekierowywać użytkowników.',
    );
  }

  return normalizeSiteUrl(parsed);
}

export function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!rawSiteUrl) {
    return DEFAULT_SITE_URL;
  }
  return normalizeSiteUrl(validateSiteUrl(rawSiteUrl));
}
