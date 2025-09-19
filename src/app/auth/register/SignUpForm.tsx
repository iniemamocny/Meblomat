"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { translations } from "@/lib/i18n";
import type { Language } from "@/lib/i18n";

const EMAIL_REDIRECT_PATH = "/auth/verify";

type AccountType = "admin" | "carpenter" | "client";

type SignUpFormProps = {
  supabase: SupabaseClient;
  redirectPath?: string;
};

function resolveForcedAccountType(
  invitationToken: string | undefined,
  accountParam: string | null,
): AccountType | undefined {
  if (accountParam === "carpenter" || accountParam === "client") {
    return accountParam;
  }

  if (invitationToken) {
    return "client";
  }

  return undefined;
}

function useLanguageOrFallback(): Language {
  try {
    return useLanguage().language;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("useLanguage must be used within a LanguageProvider")
    ) {
      return "en";
    }

    throw error;
  }
}

export function SignUpForm({ supabase, redirectPath = "/dashboard" }: SignUpFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = useLanguageOrFallback();
  const formTexts = translations[language].auth.signUpForm;
  const invitationToken = searchParams?.get("invitation") ?? undefined;
  const accountParam = searchParams?.get("account") ?? null;
  const forcedAccountType = resolveForcedAccountType(invitationToken, accountParam);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>(forcedAccountType ?? "client");
  const [emailRedirectUrl, setEmailRedirectUrl] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isAdminBootstrapAvailable, setIsAdminBootstrapAvailable] = useState(false);

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

  useEffect(() => {
    let active = true;

    const checkAdminBootstrapAvailability = async () => {
      try {
        const { data, error } = await supabase.rpc("bootstrap_admin", { promote: false });

        if (!active) {
          return;
        }

        if (error) {
          console.error("Failed to check administrator availability", error);
          setIsAdminBootstrapAvailable(false);
          return;
        }

        const adminCount =
          typeof data === "object" && data !== null && "admin_count" in data
            ? Number((data as { admin_count?: number }).admin_count)
            : null;

        setIsAdminBootstrapAvailable(adminCount === 0);
      } catch (unknownError) {
        if (!active) {
          return;
        }

        console.error("Failed to check administrator availability", unknownError);
        setIsAdminBootstrapAvailable(false);
      }
    };

    if (!forcedAccountType) {
      checkAdminBootstrapAvailability();
    }

    return () => {
      active = false;
    };
  }, [forcedAccountType, supabase]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setFormError(null);
    setStatusMessage(null);

    if (!email.trim()) {
      setFormError(formTexts.errors.emailRequired);
      return;
    }

    if (!password) {
      setFormError(formTexts.errors.passwordRequired);
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
          setFormError(formTexts.errors.registrationFailed);
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

      setStatusMessage(formTexts.status.checkEmail);
    } catch (unknownError) {
      const fallbackError = formTexts.errors.registrationFailed;
      setFormError(unknownError instanceof Error ? unknownError.message : fallbackError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <label className="text-sm font-medium text-black dark:text-white" htmlFor="email">
          {formTexts.emailLabel}
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
          {formTexts.passwordLabel}
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
        <legend className="text-sm font-medium text-black dark:text-white">
          {formTexts.accountTypeLegend}
        </legend>
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
              <p className="text-sm font-medium text-black dark:text-white">
                {formTexts.accountTypes.carpenter.label}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {formTexts.accountTypes.carpenter.description}
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
              <p className="text-sm font-medium text-black dark:text-white">
                {formTexts.accountTypes.client.label}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {formTexts.accountTypes.client.description}
              </p>
            </div>
          </label>
          {isAdminBootstrapAvailable ? (
            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-black/10 bg-white p-3 transition hover:border-black/30 dark:border-white/20 dark:bg-black dark:hover:border-white/40">
              <input
                type="radio"
                name="account-type"
                value="admin"
                checked={accountType === "admin"}
                onChange={() => setAccountType("admin")}
                disabled={Boolean(forcedAccountType)}
              />
              <div>
                <p className="text-sm font-medium text-black dark:text-white">
                  {formTexts.accountTypes.admin.label}
                </p>
                <p className="text-sm text-black/60 dark:text-white/60">
                  {formTexts.accountTypes.admin.description}
                </p>
              </div>
            </label>
          ) : null}
        </div>
        {forcedAccountType ? (
          <p className="text-xs text-black/60 dark:text-white/60">
            {formTexts.accountTypeLocked}
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
        {isSubmitting ? formTexts.submit.submitting : formTexts.submit.default}
      </button>
    </form>
  );
}

export type { SignUpFormProps };
