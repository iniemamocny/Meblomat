"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { SupabaseEnvWarning } from "@/components/SupabaseEnvWarning";
import { AvatarPicker } from "@/components/dashboard/AvatarPicker";
import { UserAvatar } from "@/components/layout/UserAvatar";
import {
  DEFAULT_AVATAR_ID,
  getAvatarPresetIcon,
  type AvatarType,
} from "@/lib/avatar";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

type ProfileRow = {
  subscription_expires_at: string | null;
  avatar_type: AvatarType | null;
  avatar_path: string | null;
};

type AvatarChangePayload = {
  type: AvatarType;
  path: string;
  imageUrl: string | null;
  error?: string | null;
};

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

function parseExpiration(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

export default function DashboardPage() {
  const router = useRouter();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [subscriptionExpiresAt, setSubscriptionExpiresAt] =
    useState<string | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarType, setAvatarType] = useState<AvatarType>("icon");
  const [avatarPath, setAvatarPath] = useState<string>(DEFAULT_AVATAR_ID);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState<string | null>(null);

  const handleAvatarChange = useCallback(
    (change: AvatarChangePayload) => {
      const normalizedPath = change.path || DEFAULT_AVATAR_ID;
      const nextType: AvatarType = change.type === "upload" ? "upload" : "icon";

      setAvatarType(nextType);
      setAvatarPath(normalizedPath);

      if (nextType === "upload") {
        setAvatarUrl(change.imageUrl ?? null);
        setAvatarLoadError(
          change.error
            ? "Nie udało się wczytać podglądu avatara. Spróbuj odświeżyć stronę lub wybrać plik ponownie."
            : null,
        );
      } else {
        setAvatarUrl(null);
        setAvatarLoadError(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;

    const loadProfile = async () => {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (userError || !user) {
        router.replace("/auth/login");
        return;
      }

      setUserEmail(user.email ?? null);
      setUserId(user.id);

      const {
        data: profile,
        error: profileFetchError,
      } = await supabase
        .from("profiles")
        .select("subscription_expires_at, avatar_type, avatar_path")
        .eq("id", user.id)
        .maybeSingle<ProfileRow>();

      if (!active) {
        return;
      }

      let nextAvatarType: AvatarType = "icon";
      let nextAvatarPath = DEFAULT_AVATAR_ID;
      let nextAvatarUrl: string | null = null;
      let hasPreviewError = false;

      if (!profileFetchError && profile) {
        nextAvatarType = profile.avatar_type === "upload" ? "upload" : "icon";
        nextAvatarPath = profile.avatar_path ?? DEFAULT_AVATAR_ID;

        if (nextAvatarType === "upload" && profile.avatar_path) {
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from("avatars")
              .createSignedUrl(profile.avatar_path, 60 * 60 * 24 * 7);

          if (!active) {
            return;
          }

          if (signedUrlError) {
            hasPreviewError = true;
          } else {
            nextAvatarUrl = signedUrlData?.signedUrl ?? null;
          }
        }
      }

      if (profileFetchError) {
        setProfileError(true);
        setSubscriptionExpiresAt(null);
      } else {
        setProfileError(false);
        setSubscriptionExpiresAt(profile?.subscription_expires_at ?? null);
      }

      handleAvatarChange({
        type: nextAvatarType,
        path: nextAvatarPath,
        imageUrl: nextAvatarUrl,
        error: hasPreviewError ? "preview-error" : null,
      });

      setIsLoading(false);
    };

    loadProfile().catch(() => {
      if (!active) {
        return;
      }

      handleAvatarChange({
        type: "icon",
        path: DEFAULT_AVATAR_ID,
        imageUrl: null,
        error: null,
      });
      router.replace("/auth/login");
    });

    return () => {
      active = false;
    };
  }, [handleAvatarChange, router, supabase]);

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-16">
        <SupabaseEnvWarning description="Add your Supabase credentials to load account and subscription details." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
        <header className="space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-base text-black/60 dark:text-white/60">
            Loading your account details…
          </p>
        </header>
      </div>
    );
  }

  const expirationDate = parseExpiration(subscriptionExpiresAt);
  const now = new Date();

  let warning: { title: string; description: string } | null = null;

  if (profileError) {
    warning = {
      title: "Subscription details unavailable",
      description:
        "We couldn't load your subscription information. Please try again later.",
    };
  } else if (!expirationDate) {
    warning = {
      title: "No active subscription",
      description:
        "We couldn't find an active subscription for your account. Update your billing details to avoid interruptions.",
    };
  } else {
    const timeRemaining = expirationDate.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      warning = {
        title: "Your subscription has expired",
        description: `Access ended on ${formatDateTime(expirationDate)}. Renew to regain full access to the platform.`,
      };
    } else if (timeRemaining <= ONE_WEEK_IN_MS) {
      warning = {
        title: "Subscription expiring soon",
        description: `Your subscription will expire on ${formatDateTime(expirationDate)}. Consider renewing to keep your tools running without interruptions.`,
      };
    }
  }

  const avatarPresetIcon = getAvatarPresetIcon(avatarPath);
  const avatarInitials = userEmail?.[0]?.toUpperCase();
  const showPreviewLoadingMessage =
    avatarType === "upload" && !avatarUrl && !avatarLoadError;
  const avatarFallbackIcon = (
    <span aria-hidden="true" className="text-2xl">
      {avatarPresetIcon}
    </span>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-base text-black/60 dark:text-white/60">
          Welcome back{userEmail ? `, ${userEmail}` : ""}.
        </p>
      </header>

      {warning ? (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-100">
          <h2 className="text-lg font-semibold">{warning.title}</h2>
          <p className="mt-2 text-sm/6">{warning.description}</p>
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">Account overview</h2>
          <dl className="mt-4 space-y-4 text-sm/6 text-black/70 dark:text-white/70">
            <div>
              <dt className="font-medium text-black dark:text-white">Email</dt>
              <dd className="mt-1 break-all">{userEmail ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-medium text-black dark:text-white">Subscription expires</dt>
              <dd className="mt-1">{formatDateTime(expirationDate)}</dd>
            </div>
          </dl>
        </article>

        <article className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <p className="text-sm/6 text-black/60 dark:text-white/60">
            Manage your access and keep your account secure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              href="/auth/logout"
            >
              Sign out
            </Link>
            <a
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              href="mailto:support@example.com"
            >
              Contact support
            </a>
          </div>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 md:col-span-2">
          <h2 className="text-lg font-semibold">Avatar</h2>
          <p className="mt-1 text-sm/6 text-black/60 dark:text-white/60">
            Wybierz ikonę, która będzie widoczna w nagłówku i na dashboardzie.
          </p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
            <UserAvatar
              imageUrl={avatarType === "upload" ? avatarUrl : null}
              fallbackIcon={avatarFallbackIcon}
              initials={avatarInitials}
              className="size-16 text-2xl"
            />
            <div className="text-sm/6 text-black/60 dark:text-white/60">
              {avatarLoadError ? (
                <p className="text-red-600 dark:text-red-400">{avatarLoadError}</p>
              ) : showPreviewLoadingMessage ? (
                <p>Trwa generowanie podglądu przesłanego obrazu…</p>
              ) : (
                <p>Tak będzie wyglądał Twój profil w aplikacji.</p>
              )}
            </div>
          </div>
          <div className="mt-6">
            {supabase && userId ? (
              <AvatarPicker
                supabase={supabase}
                userId={userId}
                currentAvatarType={avatarType}
                currentAvatarPath={avatarPath}
                onAvatarChange={handleAvatarChange}
              />
            ) : (
              <p className="text-sm/6 text-black/60 dark:text-white/60">
                Zaloguj się, aby zmienić avatar.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
