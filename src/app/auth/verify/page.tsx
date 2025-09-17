"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { VerificationHandler } from "@/components/auth/VerificationHandler";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function VerifyPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const [verificationParams, setVerificationParams] = useState({
    code: null as string | null,
    tokenHash: null as string | null,
    type: null as string | null,
  });
  const [paramsLoaded, setParamsLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setVerificationParams({
      code: params.get("code"),
      tokenHash: params.get("token_hash"),
      type: params.get("type"),
    });
    setParamsLoaded(true);
  }, []);

  const { code, tokenHash, type } = verificationParams;
  const hasVerificationPayload = Boolean(type && (code || tokenHash));
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );

  useEffect(() => {
    if (!supabase || !paramsLoaded || hasVerificationPayload) {
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
      // Ignore errors and continue to render the verification form.
    });

    return () => {
      active = false;
    };
  }, [hasVerificationPayload, paramsLoaded, router, supabase]);

  if (!isSupabaseConfigured) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to complete email verification flows." />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          We&apos;ve sent a secure link to your inbox. Follow it to finish signing
          in.
        </p>
      </div>
      <VerificationHandler code={code} tokenHash={tokenHash} type={type} />
      <div className="space-y-4">
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          If you&apos;re entering a code manually, paste it below to complete the
          process.
        </p>
        <AuthForm
          view="verify_otp"
          className="space-y-4"
          showLinks={false}
          disableEmailRedirect
        />
      </div>
    </div>
  );
}
