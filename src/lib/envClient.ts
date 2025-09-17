import type { SupabaseConfig } from "./supabaseConfig";

const SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function isSupabaseConfiguredOnClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof supabaseUrl !== "string" || typeof supabaseAnonKey !== "string") {
    return false;
  }

  const trimmedUrl = supabaseUrl.trim();
  const trimmedAnonKey = supabaseAnonKey.trim();

  if (!trimmedUrl || !trimmedAnonKey) {
    return false;
  }

  return isValidHttpUrl(trimmedUrl);
}

export function getSupabaseBrowserConfigOrThrow(): SupabaseConfig {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (typeof rawUrl !== "string") {
    throw new Error(
      `${SUPABASE_URL_ENV} must be set to your Supabase project URL (e.g. https://your-project.supabase.co).`,
    );
  }

  const url = rawUrl.trim();

  if (!url) {
    throw new Error(
      `${SUPABASE_URL_ENV} must be set to your Supabase project URL (e.g. https://your-project.supabase.co).`,
    );
  }

  if (!isValidHttpUrl(url)) {
    throw new Error(`${SUPABASE_URL_ENV} must be a valid HTTP or HTTPS URL.`);
  }

  const rawAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof rawAnonKey !== "string") {
    throw new Error(`${SUPABASE_ANON_KEY_ENV} must be set to your Supabase anon public key.`);
  }

  const anonKey = rawAnonKey.trim();

  if (!anonKey) {
    throw new Error(`${SUPABASE_ANON_KEY_ENV} must be set to your Supabase anon public key.`);
  }

  return { url, anonKey };
}
