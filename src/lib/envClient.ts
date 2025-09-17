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
