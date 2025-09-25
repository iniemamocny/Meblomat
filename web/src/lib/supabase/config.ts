function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Brak wymaganej zmiennej środowiskowej ${name}. Uzupełnij konfigurację Supabase w pliku .env.local.`,
    );
  }
  return value;
}

export const SUPABASE_URL = readEnv('NEXT_PUBLIC_SUPABASE_URL');
export const SUPABASE_ANON_KEY = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
}
