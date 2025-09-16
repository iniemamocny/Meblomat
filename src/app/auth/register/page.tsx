import Link from "next/link";
import { redirect } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { getSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function RegisterPage() {
  if (!getSupabaseConfig()) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to allow new users to register for the service." />
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
        <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          Register with your email address and we&apos;ll send a confirmation link.
        </p>
      </div>
      <AuthForm view="sign_up" className="space-y-4" />
      <p className="text-sm/6 text-black/60 dark:text-white/60">
        Already have an account?{" "}
        <Link className="font-semibold text-black dark:text-white" href="/auth/login">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
