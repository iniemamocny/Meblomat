export function isSupabaseConfiguredOnClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (typeof supabaseUrl !== "string" || typeof supabaseAnonKey !== "string") {
    return false;
  }

  return supabaseUrl.trim().length > 0 && supabaseAnonKey.trim().length > 0;
}
