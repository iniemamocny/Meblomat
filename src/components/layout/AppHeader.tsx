"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  DEFAULT_AVATAR_ID,
  getAvatarPresetIcon,
  type AvatarType,
} from "@/lib/avatar";

import { UserAvatar } from "./UserAvatar";

type NavigationLink = {
  href: string;
  label: string;
  withIcon?: boolean;
};

const navigationLinks: NavigationLink[] = [
  { href: "/#meble", label: "meble" },
  { href: "/#pomieszczenie", label: "pomieszczenie" },
  { href: "/#wycena", label: "wycena" },
  { href: "/#formatki", label: "formatki" },
  { href: "/play", label: "play", withIcon: true },
];

type ProfileRow = {
  avatar_type: AvatarType | null;
  avatar_path: string | null;
};

export default function AppHeader() {
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [avatarImageUrl, setAvatarImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      setAvatarImageUrl(null);
      return;
    }

    let active = true;

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_type, avatar_path")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      if (!active) {
        return;
      }

      if (error) {
        setProfile(null);
        setAvatarImageUrl(null);
        return;
      }

      setProfile(data ?? null);
      if (!data) {
        setAvatarImageUrl(null);
      }
    };

    const syncUser = async () => {
      const {
        data: { user: currentUser },
        error,
      } = await supabase.auth.getUser();

      if (!active) {
        return;
      }

      if (error || !currentUser) {
        setUser(null);
        setProfile(null);
        setAvatarImageUrl(null);
        return;
      }

      setUser(currentUser);
      await loadProfile(currentUser.id);
    };

    syncUser().catch(() => {
      if (!active) {
        return;
      }

      setUser(null);
      setProfile(null);
      setAvatarImageUrl(null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (nextUser) {
        loadProfile(nextUser.id).catch(() => {
          if (!active) {
            return;
          }

          setProfile(null);
          setAvatarImageUrl(null);
        });
      } else {
        setProfile(null);
        setAvatarImageUrl(null);
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const avatarPath = profile?.avatar_path ?? null;
  const avatarType = profile?.avatar_type ?? null;

  useEffect(() => {
    if (!supabase) {
      setAvatarImageUrl(null);
      return;
    }

    if (avatarType !== "upload" || !avatarPath) {
      setAvatarImageUrl(null);
      return;
    }

    let active = true;

    supabase.storage
      .from("avatars")
      .createSignedUrl(avatarPath, 60 * 60 * 24 * 7)
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setAvatarImageUrl(null);
        } else {
          setAvatarImageUrl(data?.signedUrl ?? null);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setAvatarImageUrl(null);
      });

    return () => {
      active = false;
    };
  }, [avatarPath, avatarType, supabase]);

  useEffect(() => {
    if (!supabase || !user?.id) {
      return;
    }

    const channel = supabase
      .channel(`profile-avatar-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setProfile((payload.new as ProfileRow) ?? null);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, user?.id]);

  const isAuthenticated = Boolean(user);
  const presetIcon = getAvatarPresetIcon(avatarPath ?? DEFAULT_AVATAR_ID);
  const avatarFallbackIcon = (
    <span aria-hidden="true" className="text-base">
      {presetIcon}
    </span>
  );
  const resolvedAvatarUrl = avatarType === "upload" ? avatarImageUrl : null;
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? undefined;

  return (
    <header className="border-b border-black/10 bg-white/80 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            className="text-lg font-semibold tracking-tight text-black transition hover:text-black/70 dark:text-white dark:hover:text-white/80"
            href="/"
          >
            Meblomat
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-black/70 dark:text-white/70">
            {navigationLinks.map((item) => (
              <Link
                key={item.label}
                className="rounded-full px-3 py-1 capitalize transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
                href={item.href}
              >
                <span className="flex items-center gap-1">
                  {item.label}
                  {item.withIcon ? (
                    <span aria-hidden="true" className="text-xs">
                      ▶
                    </span>
                  ) : null}
                </span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col items-end gap-3 text-sm font-medium">
          {isAuthenticated ? (
            <Link href="/dashboard" className="rounded-full">
              <UserAvatar
                imageUrl={resolvedAvatarUrl}
                fallbackIcon={avatarFallbackIcon}
                initials={avatarInitial}
              />
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                className="rounded-full px-4 py-2 text-black transition hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
                href="/auth/login"
              >
                Zaloguj się
              </Link>
              <Link
                className="rounded-full bg-black px-4 py-2 text-white shadow-sm transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                href="/auth/register"
              >
                Utwórz konto
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
