"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { translations } from "@/lib/i18n";

const FALLBACK_YEAR = "";

export default function AppFooter() {
  const [year, setYear] = useState<string>(FALLBACK_YEAR);
  const { language } = useLanguage();
  const { footer, header } = translations[language];

  useEffect(() => {
    setYear(String(new Date().getFullYear()));
  }, []);

  return (
    <footer className="border-t border-black/10 bg-white/80 px-4 py-6 text-sm text-black/60 dark:border-white/10 dark:bg-neutral-900/80 dark:text-white/60">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <span>
          &copy; {year ? `${year} ` : ""}
          {header.brand}. {footer.rights}
        </span>
        <Link className="font-medium text-black transition hover:text-black/80 dark:text-white dark:hover:text-white/80" href="/auth/register">
          {footer.cta}
        </Link>
      </div>
    </footer>
  );
}
