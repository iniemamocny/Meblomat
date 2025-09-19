import { redirect } from "next/navigation";

import type { AccountType } from "@/lib/avatar";

import { createSupabaseServerClient } from "./supabaseServer";

type ProfileRow = {
  account_type: AccountType | null;
};

export type AuthenticatedUser = {
  id: string;
  email: string | null;
  accountType: AccountType | null;
};

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  const currentUser = user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_type")
    .eq("id", currentUser.id)
    .maybeSingle<ProfileRow>();

  return {
    id: currentUser.id,
    email: currentUser.email ?? null,
    accountType: profileError ? null : profile?.account_type ?? null,
  };
}
