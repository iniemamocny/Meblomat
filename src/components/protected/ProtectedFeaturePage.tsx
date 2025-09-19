"use client";

import Link from "next/link";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { translations } from "@/lib/i18n";

type FeatureKey = "wycena" | "formatki" | "project";

type ProtectedFeaturePageProps = {
  featureKey: FeatureKey;
};

export function ProtectedFeaturePage({ featureKey }: ProtectedFeaturePageProps) {
  const { language } = useLanguage();
  const { protectedPages } = translations[language];
  const feature = protectedPages.features[featureKey];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 py-16">
      <section className="space-y-4 text-center md:text-left">
        <span className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/70 dark:border-white/20 dark:text-white/70">
          {protectedPages.badge}
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black dark:text-white sm:text-5xl">
            {feature.title}
          </h1>
          <p className="text-base text-black/70 dark:text-white/70 sm:text-lg">
            {feature.description}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {feature.highlights.map((highlight) => (
          <article
            key={highlight}
            className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
          >
            <p className="text-sm text-black/70 dark:text-white/70">{highlight}</p>
          </article>
        ))}
      </section>

      <div>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white shadow transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          href="/dashboard"
        >
          {feature.callToAction}
        </Link>
      </div>
    </div>
  );
}

export function UnauthorizedNotice() {
  const { language } = useLanguage();
  const { protectedPages } = translations[language];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full space-y-6 rounded-2xl border border-black/10 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
          {protectedPages.unauthorizedTitle}
        </h1>
        <p className="text-sm text-black/70 dark:text-white/70">
          {protectedPages.unauthorizedDescription}
        </p>
        <Link
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          href="/dashboard"
        >
          {protectedPages.goBackCta}
        </Link>
      </div>
    </div>
  );
}
