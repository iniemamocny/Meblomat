import { redirect } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { LogoutHandler } from "@/components/auth/LogoutHandler";
import { getSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function LogoutPage() {
  if (!getSupabaseConfig()) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to enable session management and sign-out." />
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <div className="space-y-6 text-center">
      <LogoutHandler />
      <h1 className="text-3xl font-semibold tracking-tight">Signing you out</h1>
      <p className="text-sm/6 text-black/60 dark:text-white/60">
        We&apos;re closing your session and will redirect you shortly.
      </p>
    </div>
  );
}
