"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { LogoutHandler } from "@/components/auth/LogoutHandler";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function LogoutPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [canSignOut, setCanSignOut] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const checkSession = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error || !user) {
        router.replace("/auth/login");
        return;
      }

      setCanSignOut(true);
    };

    checkSession().catch(() => {
      if (!active) {
        return;
      }

      router.replace("/auth/login");
    });

    return () => {
      active = false;
    };
  }, [router, supabase]);

  if (!isSupabaseConfigured) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to enable session management and sign-out." />
    );
  }

  return (
    <div className="space-y-6 text-center">
      {canSignOut ? <LogoutHandler /> : null}
      <h1 className="text-3xl font-semibold tracking-tight">Signing you out</h1>
      <p className="text-sm/6 text-black/60 dark:text-white/60">
        We&apos;re closing your session and will redirect you shortly.
      </p>
    </div>
  );
}
