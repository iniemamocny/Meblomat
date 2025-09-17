"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import {
  getInvitationDetails,
  acceptInvitation,
  type InvitationDetails,
} from "@/lib/invitations";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type InviteClientPageProps = {
  token: string | null;
  initialTokenError?: "missing" | "unreadable";
};

export default function InviteClientPage({
  token: initialToken,
  initialTokenError,
}: InviteClientPageProps) {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    initialToken?.trim() ? initialToken.trim() : null,
  );

  useEffect(() => {
    const normalized = initialToken?.trim() ?? "";

    if (!normalized) {
      setToken(null);
      setInvitation(null);
      setAcceptError(null);
      setErrorMessage(
        initialTokenError === "unreadable"
          ? "We couldn't read this invitation link."
          : "This invitation link is missing a token.",
      );
      setIsLoading(false);
      return;
    }

    setToken(normalized);
    setInvitation(null);
    setAcceptError(null);
    setErrorMessage(null);
    setIsLoading(true);
  }, [initialToken, initialTokenError]);

  useEffect(() => {
    if (!supabase || !token) {
      return;
    }

    let active = true;

    const loadInvitation = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const details = await getInvitationDetails(supabase, token);

        if (!active) {
          return;
        }

        setInvitation(details);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (user) {
          setIsAccepting(true);
          setAcceptError(null);

          try {
            await acceptInvitation(supabase, token);

            if (!active) {
              return;
            }

            router.replace("/dashboard");
            router.refresh();
            return;
          } catch (error) {
            if (!active) {
              return;
            }

            setAcceptError(
              error instanceof Error
                ? error.message
                : "We couldn't accept this invitation.",
            );
          } finally {
            if (active) {
              setIsAccepting(false);
            }
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "We couldn't validate this invitation.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadInvitation().catch(() => {
      if (!active) {
        return;
      }

      setErrorMessage("We couldn't validate this invitation.");
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [router, supabase, token]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16">
        <SupabaseEnvWarning description="Add your Supabase credentials so invitation links can be validated." />
      </div>
    );
  }

  if (!supabase) {
    return null;
  }

  const registerHref = token
    ? `/auth/register?invitation=${encodeURIComponent(token)}&account=client`
    : `/auth/register?account=client`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Accept your invitation</h1>
        <p className="text-sm/6 text-black/60 dark:text-white/60">
          Securely join the carpenter who sent you this invitation.
        </p>
      </header>

      {isLoading ? (
        <div className="rounded-2xl border border-black/10 bg-white px-6 py-10 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm/6 text-black/60 dark:text-white/60">Validating your invitation…</p>
        </div>
      ) : errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-6 text-red-800 dark:border-red-400/60 dark:bg-red-400/10 dark:text-red-100">
          <h2 className="text-lg font-semibold">Invitation unavailable</h2>
          <p className="mt-2 text-sm/6">{errorMessage}</p>
        </div>
      ) : invitation ? (
        <div className="space-y-6">
          <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">Invitation details</h2>
            <dl className="mt-4 space-y-3 text-sm/6 text-black/70 dark:text-white/70">
              <div>
                <dt className="font-medium text-black dark:text-white">Carpenter</dt>
                <dd className="mt-1 break-all">
                  {invitation.carpenterEmail ?? "Your carpenter"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-black dark:text-white">Invitation sent to</dt>
                <dd className="mt-1 break-all">{invitation.invitedEmail}</dd>
              </div>
              <div>
                <dt className="font-medium text-black dark:text-white">Expires</dt>
                <dd className="mt-1">
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "long",
                    timeStyle: "short",
                  }).format(new Date(invitation.expiresAt))}
                </dd>
              </div>
            </dl>
          </article>

          {acceptError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-red-800 dark:border-red-400/60 dark:bg-red-400/10 dark:text-red-100">
              <h2 className="text-base font-semibold">We couldn&apos;t finish linking your account.</h2>
              <p className="mt-1 text-sm/6">{acceptError}</p>
            </div>
          ) : null}

          <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
            <h2 className="text-lg font-semibold">Next steps</h2>
            <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
              Create a free client account or sign in to attach your profile to this carpenter.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-black/20 dark:bg-white dark:text-black dark:hover:bg-white/90 dark:focus:ring-white/30"
                href={registerHref}
              >
                Create your account
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-md border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
                href="/auth/login"
              >
                Sign in
              </Link>
            </div>
            {isAccepting ? (
              <p className="mt-4 text-sm/6 text-black/60 dark:text-white/60">
                Finalising the invitation with your signed-in account…
              </p>
            ) : null}
          </article>
        </div>
      ) : null}
    </div>
  );
}
