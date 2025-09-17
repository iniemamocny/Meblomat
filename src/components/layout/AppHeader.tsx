"use client";

import Link from "next/link";

const navigationLinks = [
  { href: "/#meble", label: "meble" },
  { href: "/#pomieszczenie", label: "pomieszczenie" },
  { href: "/#wycena", label: "wycena" },
  { href: "/#formatki", label: "formatki" },
  { href: "/play", label: "play", withIcon: true },
] as const;

export default function AppHeader() {
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
        <div className="flex items-center gap-3 text-sm font-medium">
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
      </div>
    </header>
  );
}
