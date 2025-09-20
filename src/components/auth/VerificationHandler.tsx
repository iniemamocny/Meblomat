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

const TOKEN_HASH_VERIFICATION_TYPES = [
  "signup",
  "magiclink",
  "invite",
] as const;

type TokenHashVerificationType = (typeof TOKEN_HASH_VERIFICATION_TYPES)[number];

const TOKEN_HASH_VERIFICATION_TYPE_SET = new Set<string>(
  TOKEN_HASH_VERIFICATION_TYPES,
);

const isTokenHashVerificationType = (
  value: string,
): value is TokenHashVerificationType =>
  TOKEN_HASH_VERIFICATION_TYPE_SET.has(value);

type SupabaseBrowserClient = ReturnType<typeof createSupabaseBrowserClient>;

const getPendingAccountTypeFromUser = (user: User | null): string | null => {
  if (!user) {
    return null;
  }

  const value = user.user_metadata?.pending_account_type;

  return typeof value === "string" && value.length > 0 ? value : null;
};

const getPendingInvitationTokenFromUser = (user: User | null): string | null => {
  if (!user) {
    return null;
  }

  const value = user.user_metadata?.pending_invitation_token;

  return typeof value === "string" && value.length > 0 ? value : null;
};

type AccountUpgradeResult =
  | { status: "success"; user: User }
  | { status: "error"; message: string };

export async function completePendingAccountUpgrades(
  supabase: SupabaseBrowserClient,
  initialUser: User | null,
): Promise<AccountUpgradeResult> {
  let authenticatedUser: User | null = initialUser;
  let pendingAccountType = getPendingAccountTypeFromUser(authenticatedUser);
  let pendingInvitationToken =
    getPendingInvitationTokenFromUser(authenticatedUser);

  if (!authenticatedUser || !pendingAccountType) {
    const { data: userData, error: getUserError } = await supabase.auth.getUser();

    if (getUserError) {
      return { status: "error", message: getUserError.message };
    }

    if (userData?.user) {
      authenticatedUser = userData.user;
    }

    pendingAccountType = getPendingAccountTypeFromUser(authenticatedUser);
    pendingInvitationToken = getPendingInvitationTokenFromUser(authenticatedUser);
  }

  if (!authenticatedUser) {
    return {
      status: "error",
      message:
        "We couldn't load your account after verifying. Please try signing in again.",
    };
  }

  if (pendingAccountType) {
    if (pendingAccountType === "admin") {
      const { data: bootstrapResult, error: bootstrapError } = await supabase.rpc(
        "bootstrap_admin",
        { promote: true },
      );

      if (bootstrapError) {
        return { status: "error", message: bootstrapError.message };
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
        return {
          status: "error",
          message:
            adminCount !== null && adminCount > 0
              ? "An administrator already exists, so this link can no longer grant admin access."
              : "We couldn't promote your account to administrator. Please try again.",
        };
      }
    } else if (pendingAccountType === "carpenter") {
      const { data: promotionResult, error: promotionError } = await supabase.rpc(
        "promote_to_carpenter",
      );

      if (promotionError) {
        return { status: "error", message: promotionError.message };
      }

      const nextAccountType =
        typeof promotionResult === "object" &&
        promotionResult !== null &&
        "account_type" in promotionResult
          ? (promotionResult as { account_type?: string | null }).account_type ?? null
          : null;

      if (nextAccountType !== "carpenter") {
        return {
          status: "error",
          message:
            "We couldn't upgrade your account to carpenter. Please try again.",
        };
      }
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", authenticatedUser.id)
        .single();

      if (profileError) {
        return { status: "error", message: profileError.message };
      }

      if (profile?.account_type !== pendingAccountType) {
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({ account_type: pendingAccountType })
          .eq("id", authenticatedUser.id);

        if (updateProfileError) {
          return { status: "error", message: updateProfileError.message };
        }
      }
    }
  }

  if (pendingInvitationToken) {
    const { error: invitationError } = await supabase.rpc(
      "accept_carpenter_invitation",
      { invitation_token: pendingInvitationToken },
    );

    if (invitationError) {
      return { status: "error", message: invitationError.message };
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

      if (updateUserError) {
        console.error("Failed to clear pending metadata", updateUserError);
      }
    }
  }

  return { status: "success", user: authenticatedUser };
}

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

    const verificationType = type as SupportedVerificationType;

    if (!SUPPORTED_TYPES.has(verificationType)) {
      setStatus("error");
      setErrorMessage("This verification link is not valid.");
      return;
    }

    const hasCode = Boolean(code);
    const hasTokenHash = Boolean(tokenHash);
    const canVerifyWithTokenHash =
      hasTokenHash && isTokenHashVerificationType(verificationType);

    if (verificationType === "email_change" && !hasCode && !hasTokenHash) {
      setStatus("error");
      setErrorMessage("This verification link is not valid.");
      return;
    }

    if (
      verificationType !== "email_change" &&
      !hasCode &&
      !canVerifyWithTokenHash
    ) {
      setStatus("error");
      setErrorMessage("This verification link is not valid.");
      return;
    }

    let active = true;

    const verify = async () => {
      setStatus("processing");

      let authError: AuthError | null = null;
      let authenticatedUser: User | null = null;

      if (verificationType === "email_change") {
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
      } else if (code) {
        const exchangeResponse = await supabase.auth.exchangeCodeForSession(
          code,
        );
        const { data, error } = exchangeResponse;
        authError = error;
        if (!error) {
          const { user: responseUser, session } = data;

          authenticatedUser = responseUser ?? session.user;
        }
      } else if (tokenHash && isTokenHashVerificationType(verificationType)) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: verificationType,
          token_hash: tokenHash,
        });
        authError = error;
        if (!error) {
          const { user: responseUser, session } = data;

          authenticatedUser = responseUser ?? session?.user ?? null;
        }
      } else {
        setStatus("error");
        setErrorMessage("This verification link is not valid.");
        return;
      }

      if (!active) {
        return;
      }

      if (authError) {
        setStatus("error");
        setErrorMessage(authError.message);
        return;
      }

      const upgradeResult = await completePendingAccountUpgrades(
        supabase,
        authenticatedUser,
      );

      if (!active) {
        return;
      }

      if (upgradeResult.status === "error") {
        setStatus("error");
        setErrorMessage(upgradeResult.message);
        return;
      }

      authenticatedUser = upgradeResult.user;

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
