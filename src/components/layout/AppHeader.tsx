"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

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
  avatar_url?: string | null;
};

export default function AppHeader() {
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setProfile(null);
      return;
    }

    let active = true;

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      if (!active) {
        return;
      }

      if (error) {
        setProfile(null);
        return;
      }

      setProfile(data ?? null);
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
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthenticated = Boolean(user);
  const avatarUrl =
    profile?.avatar_url ??
    (typeof user?.user_metadata?.avatar_url === "string"
      ? (user.user_metadata.avatar_url as string)
      : null);
  const avatarFallback = user?.email?.[0]?.toUpperCase() ?? undefined;

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
              <UserAvatar imageUrl={avatarUrl} initials={avatarFallback} />
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
