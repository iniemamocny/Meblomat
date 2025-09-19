"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { Language } from "@/lib/i18n";
import { supportedLanguages } from "@/lib/i18n";

type LanguageContextValue = {
  language: Language;
  setLanguage: (next: Language) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = "meblomat-language";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pl");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && supportedLanguages.includes(stored as Language)) {
      setLanguage(stored as Language);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
