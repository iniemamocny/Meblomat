"use client";

import { Suspense, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

import { SignUpForm } from "./SignUpForm";

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

  if (!supabase) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Create your account</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          Register with your email address and we&apos;ll send a confirmation link.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-4" aria-hidden>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-10 w-full rounded-md bg-black/10 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-32 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-10 w-full rounded-md bg-black/10 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-36 rounded bg-black/10 dark:bg-white/10" />
              <div className="h-20 w-full rounded-md bg-black/10 dark:bg-white/10" />
            </div>
            <div className="h-10 w-full rounded-md bg-black/10 dark:bg-white/10" />
          </div>
        }
      >
        <SignUpForm supabase={supabase} />
      </Suspense>
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
