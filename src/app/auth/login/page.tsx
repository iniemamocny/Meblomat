import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function LoginPage() {
  if (!getSupabaseConfig()) {
    return (
      <SupabaseEnvWarning description="Add your Supabase project credentials to enable the login experience." />
    );
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          Sign in to continue where you left off.
        </p>
      </div>
      <AuthForm view="sign_in" className="space-y-4" />
      <p className="text-sm/6 text-black/60 dark:text-white/60">
        Don&apos;t have an account?{" "}
        <Link className="font-semibold text-black dark:text-white" href="/auth/register">
          Create one
        </Link>
        .
      </p>
    </div>
  );
}
