"use client";

import Image from "next/image";
import Link from "next/link";

import { useLanguage } from "@/components/providers/LanguageProvider";
import { translations } from "@/lib/i18n";

export default function Home() {
  const { language } = useLanguage();
  const { hero, sections } = translations[language];

  return (
    <main className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-4 py-16">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-8 text-center md:text-left">
            <span className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-black/70 dark:border-white/20 dark:text-white/70">
              {hero.badge}
            </span>
            <div className="space-y-5">
              <h1 className="text-5xl font-semibold tracking-tight text-black sm:text-6xl dark:text-white">
                {hero.heading}
              </h1>
              <p className="text-lg text-black/60 dark:text-white/60 sm:text-xl">
                {hero.description}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
                href="/auth/register"
              >
                {hero.primaryCta}
              </Link>
              <Link
                className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-semibold text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
                href="/play"
              >
                {hero.secondaryCta}
              </Link>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-6 rounded-3xl bg-black/5 blur-3xl dark:bg-white/5" aria-hidden="true" />
            <Image
              alt={hero.imageAlt}
              className="relative mx-auto w-full max-w-md rounded-3xl border border-black/10 bg-white/60 p-6 shadow-xl dark:border-white/10 dark:bg-neutral-900/60"
              height={480}
              src="/window.svg"
              width={480}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[1.1fr,0.9fr]"
          id="meble"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">{sections.meble.title}</h2>
            <p className="text-base text-black/70 dark:text-white/70">{sections.meble.description}</p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              {sections.meble.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt={sections.meble.imageAlt}
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/globe.svg"
              width={360}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[0.9fr,1.1fr]"
          id="pomieszczenie"
        >
          <div className="flex items-center justify-center">
            <Image
              alt={sections.pomieszczenie.imageAlt}
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/file.svg"
              width={360}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">{sections.pomieszczenie.title}</h2>
            <p className="text-base text-black/70 dark:text-white/70">{sections.pomieszczenie.description}</p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              {sections.pomieszczenie.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[1.1fr,0.9fr]"
          id="wycena"
        >
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">{sections.wycena.title}</h2>
            <p className="text-base text-black/70 dark:text-white/70">{sections.wycena.description}</p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              {sections.wycena.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <Image
              alt={sections.wycena.imageAlt}
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/next.svg"
              width={360}
            />
          </div>
        </section>

        <section
          className="grid gap-10 scroll-mt-32 rounded-3xl border border-black/10 bg-white/80 p-10 text-left shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-neutral-900/70 md:grid-cols-[0.9fr,1.1fr]"
          id="formatki"
        >
          <div className="flex items-center justify-center">
            <Image
              alt={sections.formatki.imageAlt}
              className="w-full max-w-xs rounded-2xl border border-black/10 bg-white/70 p-5 shadow-md dark:border-white/10 dark:bg-neutral-800/70"
              height={360}
              src="/vercel.svg"
              width={360}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-black dark:text-white">{sections.formatki.title}</h2>
            <p className="text-base text-black/70 dark:text-white/70">{sections.formatki.description}</p>
            <ul className="space-y-2 text-sm text-black/70 dark:text-white/70">
              {sections.formatki.bullets.map((bullet) => (
                <li key={bullet}>• {bullet}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
