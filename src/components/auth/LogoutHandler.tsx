"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type Props = {
  redirectPath?: string;
};

export function LogoutHandler({ redirectPath = "/auth/login" }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
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
