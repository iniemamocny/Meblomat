import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { VerificationHandler } from "@/components/auth/VerificationHandler";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type VerifyPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const codeParam = searchParams?.code;
  const typeParam = searchParams?.type;
  const code = typeof codeParam === "string" ? codeParam : null;
  const type = typeof typeParam === "string" ? typeParam : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <h1 className="text-3xl font-semibold tracking-tight">Verify your email</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          We&apos;ve sent a secure link to your inbox. Follow it to finish signing
          in.
        </p>
      </div>
      <VerificationHandler code={code} type={type} />
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
