import { redirect } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AuthForm } from "@/components/auth/AuthForm";
import { VerificationHandler } from "@/components/auth/VerificationHandler";
import { getSupabaseConfig } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type VerifyPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  if (!getSupabaseConfig()) {
    return (
      <SupabaseEnvWarning description="Add your Supabase credentials to complete email verification flows." />
    );
  }

  const codeParam = searchParams?.code;
  const tokenHashParam = searchParams?.token_hash;
  const typeParam = searchParams?.type;
  const code = typeof codeParam === "string" ? codeParam : null;
  const tokenHash =
    typeof tokenHashParam === "string" ? tokenHashParam : null;
  const type = typeof typeParam === "string" ? typeParam : null;
  const hasVerificationPayload = Boolean(type && (code || tokenHash));

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && !hasVerificationPayload) {
    redirect("/dashboard");
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
