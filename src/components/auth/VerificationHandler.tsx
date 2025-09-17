"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";

import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type SupportedVerificationType =
  | "signup"
  | "magiclink"
  | "recovery"
  | "invite"
  | "email_change";

type Props = {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
  redirectPath?: string;
};

const SUPPORTED_TYPES = new Set<SupportedVerificationType>([
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
]);

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

export async function verifyEmailChangeRequest(
  supabase: SupabaseBrowserClient,
  token: string,
) {
  return supabase.auth.verifyOtp({
    type: "email_change",
    token_hash: token,
  });
}

export function VerificationHandler({
  code,
  tokenHash,
  type,
  redirectPath = "/dashboard",
}: Props) {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [status, setStatus] = useState<"idle" | "processing" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    if (!type) {
      return;
    }

    if (!code && !tokenHash) {
      return;
    }

    if (!SUPPORTED_TYPES.has(type as SupportedVerificationType)) {
      setStatus("error");
      setErrorMessage("This verification link is not valid.");
      return;
    }

    if (type !== "email_change" && !code) {
      setStatus("error");
      setErrorMessage("This verification link is not valid.");
      return;
    }

    let active = true;

    const verify = async () => {
      setStatus("processing");

      let authError: AuthError | null = null;

      if (type === "email_change") {
        const token = tokenHash ?? code;
        if (!token) {
          setStatus("error");
          setErrorMessage("This verification link is not valid.");
          return;
        }
        const { error } = await verifyEmailChangeRequest(supabase, token);
        authError = error;
      } else {
        const { error } = await supabase.auth.exchangeCodeForSession(code!);
        authError = error;
      }

      if (!active) {
        return;
      }

      if (authError) {
        setStatus("error");
        setErrorMessage(authError.message);
        return;
      }

      setStatus("idle");
      router.replace(redirectPath);
      router.refresh();
    };

    verify();

    return () => {
      active = false;
    };
  }, [code, redirectPath, router, supabase, tokenHash, type]);

  if (!supabase || ((!code && !tokenHash) || !type)) {
    return null;
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm/6 text-red-900">
        <p className="font-medium">We couldn&apos;t verify your request.</p>
        <p className="mt-1 text-sm/5">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm/6 text-blue-900">
      <p className="font-medium">Verifying your account…</p>
      <p className="mt-1 text-sm/5">
        You&apos;ll be redirected as soon as the verification completes.
      </p>
    </div>
  );
}
