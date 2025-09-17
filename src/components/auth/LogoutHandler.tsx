"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  redirectPath?: string;
};

export function LogoutHandler({ redirectPath = "/auth/login" }: Props) {
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

    const signOut = async () => {
      await supabase.auth.signOut();

      if (!active) {
        return;
      }

      router.replace(redirectPath);
      router.refresh();
    };

    signOut().catch(() => {
      if (!active) {
        return;
      }

      router.replace(redirectPath);
      router.refresh();
    });

    return () => {
      active = false;
    };
  }, [redirectPath, router, supabase]);

  return null;
}
