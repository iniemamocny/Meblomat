"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthError, User } from "@supabase/supabase-js";

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
      let authenticatedUser: User | null = null;

      if (type === "email_change") {
        const token = tokenHash ?? code;
        if (!token) {
          setStatus("error");
          setErrorMessage("This verification link is not valid.");
          return;
        }
        const { data, error } = await verifyEmailChangeRequest(supabase, token);
        authError = error;
        if (!error && data) {
          const { user: responseUser, session } = data;

          if (responseUser) {
            authenticatedUser = responseUser;
          } else if (session) {
            authenticatedUser = session.user;
          }
        }
      } else {
        const exchangeResponse = await supabase.auth.exchangeCodeForSession(code!);
        const { data, error } = exchangeResponse;
        authError = error;
        if (!error) {
          const { user: responseUser, session } = data;

          authenticatedUser = responseUser ?? session.user;
        }
      }

      if (!active) {
        return;
      }

      if (authError) {
        setStatus("error");
        setErrorMessage(authError.message);
        return;
      }

      if (!authenticatedUser) {
        const { data: userData, error: getUserError } = await supabase.auth.getUser();

        if (!active) {
          return;
        }

        if (getUserError) {
          setStatus("error");
          setErrorMessage(getUserError.message);
          return;
        }

        authenticatedUser = userData?.user ?? null;
      }

      if (!authenticatedUser) {
        setStatus("error");
        setErrorMessage(
          "We couldn't load your account after verifying. Please try signing in again.",
        );
        return;
      }

      const pendingAccountType = authenticatedUser.user_metadata?.pending_account_type;
      const pendingInvitationToken =
        authenticatedUser.user_metadata?.pending_invitation_token;

      if (pendingAccountType) {
        if (pendingAccountType === "admin") {
          const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc(
            "bootstrap_admin",
            { promote: true },
          );

          if (!active) {
            return;
          }

          if (bootstrapError) {
            setStatus("error");
            setErrorMessage(bootstrapError.message);
            return;
          }

          const promoted =
            typeof bootstrapResult === "object" &&
            bootstrapResult !== null &&
            "promoted" in bootstrapResult &&
            Boolean((bootstrapResult as { promoted?: boolean }).promoted);

          const adminCount =
            typeof bootstrapResult === "object" &&
            bootstrapResult !== null &&
            "admin_count" in bootstrapResult
              ? Number((bootstrapResult as { admin_count?: number }).admin_count)
              : null;

          if (!promoted) {
            setStatus("error");
            setErrorMessage(
              adminCount !== null && adminCount > 0
                ? "An administrator already exists, so this link can no longer grant admin access."
                : "We couldn't promote your account to administrator. Please try again.",
            );
            return;
          }
        } else if (pendingAccountType === "carpenter") {
          const { data: promotionResult, error: promotionError } = await supabase.rpc(
            "promote_to_carpenter",
          );

          if (!active) {
            return;
          }

          if (promotionError) {
            setStatus("error");
            setErrorMessage(promotionError.message);
            return;
          }

          const nextAccountType =
            typeof promotionResult === "object" &&
            promotionResult !== null &&
            "account_type" in promotionResult
              ? (promotionResult as { account_type?: string | null }).account_type ?? null
              : null;

          if (nextAccountType !== "carpenter") {
            setStatus("error");
            setErrorMessage("We couldn't upgrade your account to carpenter. Please try again.");
            return;
          }
        } else {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("account_type")
            .eq("id", authenticatedUser.id)
            .single();

          if (!active) {
            return;
          }

          if (profileError) {
            setStatus("error");
            setErrorMessage(profileError.message);
            return;
          }

          if (profile?.account_type !== pendingAccountType) {
            const { error: updateProfileError } = await supabase
              .from("profiles")
              .update({ account_type: pendingAccountType })
              .eq("id", authenticatedUser.id);

            if (!active) {
              return;
            }

            if (updateProfileError) {
              setStatus("error");
              setErrorMessage(updateProfileError.message);
              return;
            }
          }
        }
      }

      if (pendingInvitationToken) {
        const { error: invitationError } = await supabase.rpc(
          "accept_carpenter_invitation",
          { invitation_token: pendingInvitationToken },
        );

        if (!active) {
          return;
        }

        if (invitationError) {
          setStatus("error");
          setErrorMessage(invitationError.message);
          return;
        }
      }

      if (pendingAccountType || pendingInvitationToken) {
        const metadataToClear: Record<string, null> = {};

        if (pendingAccountType) {
          metadataToClear.pending_account_type = null;
        }

        if (pendingInvitationToken) {
          metadataToClear.pending_invitation_token = null;
        }

        if (Object.keys(metadataToClear).length > 0) {
          const { error: updateUserError } = await supabase.auth.updateUser({
            data: metadataToClear,
          });

          if (!active) {
            return;
          }

          if (updateUserError) {
            console.error("Failed to clear pending metadata", updateUserError);
          }
        }
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
