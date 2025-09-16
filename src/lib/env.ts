export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function readEnv(name: string): string | undefined {
  const value = process.env[name];

  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = readEnv(SUPABASE_URL_ENV);
  const anonKey = readEnv(SUPABASE_ANON_KEY_ENV);

  if (!url || !anonKey) {
    return null;
  }

  if (!isValidHttpUrl(url)) {
    return null;
  }

  return { url, anonKey };
}

export function getSupabaseConfigOrThrow(): SupabaseConfig {
  const url = readEnv(SUPABASE_URL_ENV);

  if (!url) {
    throw new Error(
      `${SUPABASE_URL_ENV} must be set to your Supabase project URL (e.g. https://your-project.supabase.co).`,
    );
  }

  if (!isValidHttpUrl(url)) {
    throw new Error(`${SUPABASE_URL_ENV} must be a valid HTTP or HTTPS URL.`);
  }

  const anonKey = readEnv(SUPABASE_ANON_KEY_ENV);

  if (!anonKey) {
    throw new Error(`${SUPABASE_ANON_KEY_ENV} must be set to your Supabase anon public key.`);
  }

  return { url, anonKey };
}
