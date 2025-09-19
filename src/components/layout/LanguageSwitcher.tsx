"use client";

import { useMemo } from "react";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { supportedLanguages, translations, type Language } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const { header } = useMemo(() => translations[language], [language]);

  const handleChange = (next: Language) => {
    if (next === language) {
      return;
    }

    setLanguage(next);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-2 py-1 text-xs font-medium text-black/70 shadow-sm dark:border-white/10 dark:bg-neutral-900/70 dark:text-white/70">
      <span aria-hidden="true" className="text-base">
        🌐
      </span>
      <span className="sr-only">{header.languageLabel}</span>
      <div className="flex items-center gap-1">
        {supportedLanguages.map((key) => {
          const isActive = key === language;
          return (
            <button
              key={key}
              aria-pressed={isActive}
              className={`rounded-full px-2 py-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black/40 dark:focus-visible:ring-white/40 ${
                isActive
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "text-black/70 hover:bg-black/10 dark:text-white/70 dark:hover:bg-white/10"
              }`}
              onClick={() => handleChange(key)}
              title={header.languageNames[key]}
              type="button"
            >
              {header.languageShort[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
