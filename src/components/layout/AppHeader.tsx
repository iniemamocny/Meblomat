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

type NavigationKey =
  | "meble"
  | "pomieszczenie"
  | "wycena"
  | "formatki"
  | "play"
  | "project";

type PanelKey = "meble" | "pomieszczenie";

type AuthenticatedNavigationItem =
  | { key: PanelKey; type: "panel"; panel: PanelKey }
  | { key: "wycena" | "formatki" | "project"; type: "link"; href: string };

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
  const [activePanel, setActivePanel] = useState<PanelKey | null>(null);

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
  const canAccessRestrictedPages =
    accountType === "admin" || accountType === "carpenter";
  const authenticatedNavigationItems: AuthenticatedNavigationItem[] = useMemo(
    () => {
      const base: AuthenticatedNavigationItem[] = [
        { key: "meble", panel: "meble", type: "panel" },
        { key: "pomieszczenie", panel: "pomieszczenie", type: "panel" },
      ];

      if (canAccessRestrictedPages) {
        base.push({ href: "/wycena", key: "wycena", type: "link" });
        base.push({ href: "/formatki", key: "formatki", type: "link" });
      }

      base.push({ href: "/project", key: "project", type: "link" });

      return base;
    },
    [canAccessRestrictedPages],
  );
  useEffect(() => {
    if (!isAuthenticated) {
      setActivePanel(null);
    }
  }, [isAuthenticated]);
  useEffect(() => {
    if (!activePanel) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    if (typeof document !== "undefined") {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePanel]);
  const accountTypeIcon = getAccountTypeIcon(accountType);
  const avatarFallbackIcon = (
    <span aria-hidden="true" className="text-base">
      {accountTypeIcon}
    </span>
  );
  const avatarInitial = user?.email?.[0]?.toUpperCase() ?? undefined;
  const { header, navigation, authenticatedNavigation, sections } =
    translations[language];

  const activePanelContent = activePanel ? sections[activePanel] : null;
  const closePanelLabel = language === "pl" ? "Zamknij panel" : "Close panel";

  return (
    <>
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
            {isAuthenticated
              ? authenticatedNavigationItems.map((item) => {
                  if (item.type === "panel") {
                    const isActive = activePanel === item.panel;

                    return (
                      <button
                        key={item.key}
                        aria-expanded={isActive}
                        className={`rounded-full px-3 py-1 capitalize transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white ${
                          isActive
                            ? "bg-black/10 text-black dark:bg-white/10 dark:text-white"
                            : ""
                        }`}
                        onClick={() =>
                          setActivePanel((current) =>
                            current === item.panel ? null : item.panel,
                          )
                        }
                        type="button"
                      >
                        {authenticatedNavigation[item.key]}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.key}
                      className="rounded-full px-3 py-1 capitalize transition hover:bg-black/5 hover:text-black dark:hover:bg-white/10 dark:hover:text-white"
                      href={item.href}
                    >
                      {authenticatedNavigation[item.key]}
                    </Link>
                  );
                })
              : navigationLinks.map((item) => (
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
      {isAuthenticated && activePanelContent ? (
        <div className="fixed inset-0 z-50 flex items-stretch justify-start">
          <button
            aria-label={closePanelLabel}
            className="flex-1 bg-black/40 transition hover:bg-black/50"
            onClick={() => setActivePanel(null)}
            type="button"
          />
          <aside
            aria-modal="true"
            className="relative flex w-full max-w-md flex-col gap-6 overflow-y-auto border-l border-black/10 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900"
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-black/50 dark:text-white/50">
                  {header.brand}
                </span>
                <h2 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                  {activePanelContent.title}
                </h2>
              </div>
              <button
                aria-label={closePanelLabel}
                className="rounded-full border border-black/10 p-2 text-black transition hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                onClick={() => setActivePanel(null)}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <p className="text-sm text-black/70 dark:text-white/70">
              {activePanelContent.description}
            </p>
            <ul className="space-y-3 text-sm text-black/80 dark:text-white/80">
              {activePanelContent.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 text-xs text-black/40 dark:text-white/40">
                    •
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      ) : null}
    </>
  );
}
