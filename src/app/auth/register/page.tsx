"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

const EMAIL_REDIRECT_PATH = "/auth/verify";

type AccountType = "carpenter" | "client";

type SignUpFormProps = {
  supabase: SupabaseClient;
  redirectPath?: string;
};

function SignUpForm({ supabase, redirectPath = "/dashboard" }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationToken = searchParams?.get("invitation") ?? undefined;
  const accountParam = searchParams?.get("account");
  const forcedAccountType: AccountType | undefined = (() => {
    if (accountParam === "carpenter" || accountParam === "client") {
      return accountParam;
    }

    if (invitationToken) {
      return "client";
    }

    return undefined;
  })();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(forcedAccountType ?? "client");
  const [emailRedirectUrl, setEmailRedirectUrl] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (forcedAccountType) {
      setAccountType(forcedAccountType);
    }
  }, [forcedAccountType]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const url = new URL(EMAIL_REDIRECT_PATH, window.location.origin);
      setEmailRedirectUrl(url.toString());
    } catch {
      setEmailRedirectUrl(undefined);
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);
    setStatusMessage(null);

    if (!email.trim()) {
      setFormError("Email is required.");
      return;
    }

    if (!password) {
      setFormError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const signUpMetadata = {
        pending_account_type: accountType,
        ...(invitationToken ? { pending_invitation_token: invitationToken } : {}),
      };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectUrl,
          data: signUpMetadata,
        },
      });

      if (error) {
        setFormError(error.message);
        return;
      }

      const session = data.session;
      const user = data.user;

      if (session) {
        if (!user) {
          setFormError("Registration failed.");
          return;
        }

        const { error: profileError } = await supabase
          .from("profiles")
          .update({ account_type: accountType })
          .eq("id", user.id);

        if (profileError) {
          setFormError(profileError.message);
          return;
        }

        if (invitationToken) {
          const { error: invitationError } = await supabase.rpc("accept_carpenter_invitation", {
            invitation_token: invitationToken,
          });

          if (invitationError) {
            setFormError(invitationError.message);
            return;
          }
        }
        if (redirectPath) {
          router.replace(redirectPath);
        }
        router.refresh();
        return;
      }

      setStatusMessage(
        "Check your email for a confirmation link to finish setting up your account.",
      );
    } catch (unknownError) {
      setFormError(unknownError instanceof Error ? unknownError.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium text-black dark:text-white" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-black dark:text-white" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-base text-black outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/20 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white/40 dark:focus:ring-white/20"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-black dark:text-white">Account type</legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-white p-3 transition hover:border-black/30 dark:border-white/20 dark:bg-black dark:hover:border-white/40">
            <input
              type="radio"
              name="account-type"
              value="carpenter"
              checked={accountType === "carpenter"}
              onChange={() => setAccountType("carpenter")}
              disabled={Boolean(forcedAccountType)}
            />
            <div>
              <p className="text-sm font-medium text-black dark:text-white">stolarz (subscription)</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Unlock all professional features with a paid carpenter plan.
              </p>
            </div>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-white p-3 transition hover:border-black/30 dark:border-white/20 dark:bg-black dark:hover:border-white/40">
            <input
              type="radio"
              name="account-type"
              value="client"
              checked={accountType === "client"}
              onChange={() => setAccountType("client")}
              disabled={Boolean(forcedAccountType)}
            />
            <div>
              <p className="text-sm font-medium text-black dark:text-white">klient (free)</p>
              <p className="text-sm text-black/60 dark:text-white/60">
                Collaborate with your carpenter at no additional cost.
              </p>
            </div>
          </label>
        </div>
        {forcedAccountType ? (
          <p className="text-xs text-black/60 dark:text-white/60">
            Your account type is locked because you are joining from an invitation.
          </p>
        ) : null}
      </fieldset>

      {formError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {formError}
        </p>
      ) : null}

      {statusMessage ? (
        <p className="text-sm text-green-600 dark:text-green-400" role="status">
          {statusMessage}
        </p>
      ) : null}

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 disabled:cursor-not-allowed disabled:bg-black/40 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white/30 dark:disabled:bg-white/40"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

export { SignUpForm };

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
