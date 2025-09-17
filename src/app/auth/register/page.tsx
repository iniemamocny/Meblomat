"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function RegisterPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (user) {
        router.replace("/dashboard");
      }
    };

    checkSession().catch(() => {
      // Ignore errors and allow the user to attempt registration.
    });

    return () => {
      active = false;
    };
  }, [router, supabase]);

  if (!isSupabaseConfigured) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to allow new users to register for the service." />
    );
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
