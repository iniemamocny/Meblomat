"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

import { useLanguage } from "@/components/providers/LanguageProvider";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { getAccountTypeIcon, type AccountType } from "@/lib/avatar";
import { isSupabaseConfiguredOnClient } from "@/lib/envClient";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";
import { translations } from "@/lib/i18n";

import { UserAvatar } from "./UserAvatar";

type NavigationKey = "meble" | "pomieszczenie" | "wycena" | "formatki" | "play";

type NavigationLink = {
  href: string;
  key: NavigationKey;
  withIcon?: boolean;
};

const navigationLinks: NavigationLink[] = [
  { href: "/#meble", key: "meble" },
  { href: "/#pomieszczenie", key: "pomieszczenie" },
  { href: "/#wycena", key: "wycena" },
  { href: "/#formatki", key: "formatki" },
  { href: "/play", key: "play", withIcon: true },
];

type ProfileRow = {
  account_type: AccountType | null;
};

export default function AppHeader() {
  const { language } = useLanguage();
  const isSupabaseConfigured = isSupabaseConfiguredOnClient();
  const supabase = useMemo(
    () => (isSupabaseConfigured ? createSupabaseBrowserClient() : null),
    [isSupabaseConfigured],
  );
  const [user, setUser] = useState<User | null>(null);
  const [accountType, setAccountType] = useState<AccountType | null>(null);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setAccountType(null);
      return;
    }

    let active = true;

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("id", userId)
        .maybeSingle<ProfileRow>();

      if (!active) {
        return;
      }

      if (error) {
        setAccountType(null);
        return;
      }

      setAccountType(data?.account_type ?? null);
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
        setAccountType(null);
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
      setAccountType(null);
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

          setAccountType(null);
        });
      } else {
        setAccountType(null);
      }
    });

    return () => {
      active = false;
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const isAuthenticated = Boolean(user);
  const accountTypeIcon = getAccountTypeIcon(accountType);
  const avatarFallbackIcon = (
    <span aria-hidden="true" className="text-base">
      {accountTypeIcon}
    </span>
  );
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? undefined;
  const { header, navigation } = translations[language];

  return (
    <header className="border-b border-black/10 bg-white/80 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/80">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link
            className="text-lg font-semibold tracking-tight text-black transition hover:text-black/70 dark:text-white dark:hover:text-white/80"
            href="/"
          >
            {header.brand}
          </Link>
          <nav className="flex items-center gap-3 text-sm font-medium text-black/70 dark:text-white/70">
            {navigationLinks.map((item) => (
              <Link
                key={item.key}
                className="rounded-full px-3 py-1 capitalize transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
                href={item.href}
              >
                <span className="flex items-center gap-1">
                  {navigation[item.key]}
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
        <div className="flex items-center gap-3 text-sm font-medium">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link href="/dashboard" className="rounded-full">
              <UserAvatar
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
                {header.login}
              </Link>
              <Link
                className="rounded-full bg-black px-4 py-2 text-white shadow-sm transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                href="/auth/register"
              >
                {header.register}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
