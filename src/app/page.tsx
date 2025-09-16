import Link from "next/link";

const features = [
  {
    title: "Supabase-authenticated pages",
    description:
      "Ready-made login, registration, verification, and logout flows powered by the Supabase Auth UI components.",
  },
  {
    title: "Server-aware dashboard",
    description:
      "Server components fetch your profile and subscription data securely using Supabase server helpers.",
  },
  {
    title: "Subscription awareness",
    description:
      "Dashboard warnings highlight upcoming renewals or expired plans so customers never miss a beat.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-16 px-4 py-16">
      <section className="space-y-8 text-center md:text-left">
        <span className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/70 dark:border-white/20 dark:text-white/70">
          Supabase + Next.js
        </span>
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
            Launch authentication flows in minutes
          </h1>
          <p className="text-lg text-black/60 dark:text-white/60 sm:text-xl">
            Meblomat ships with fully wired Supabase clients, drop-in auth forms, and a
            subscription-aware dashboard so you can focus on product features.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 md:justify-start">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
            href="/auth/register"
          >
            Create an account
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-full border border-black/10 px-6 py-3 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
            href="/dashboard"
          >
            Explore the dashboard
          </Link>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-black/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-neutral-900"
          >
            <h2 className="text-lg font-semibold text-black dark:text-white">
              {feature.title}
            </h2>
            <p className="mt-3 text-sm/6 text-black/60 dark:text-white/60">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
