import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";

type ProfileRow = {
  subscription_expires_at: string | null;
};

const ONE_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

function parseExpiration(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(value);
}

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("subscription_expires_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  const expirationDate = parseExpiration(profile?.subscription_expires_at);
  const now = new Date();

  let warning: { title: string; description: string } | null = null;

  if (profileError) {
    warning = {
      title: "Subscription details unavailable",
      description:
        "We couldn't load your subscription information. Please try again later.",
    };
  } else if (!expirationDate) {
    warning = {
      title: "No active subscription",
      description:
        "We couldn't find an active subscription for your account. Update your billing details to avoid interruptions.",
    };
  } else {
    const timeRemaining = expirationDate.getTime() - now.getTime();

    if (timeRemaining <= 0) {
      warning = {
        title: "Your subscription has expired",
        description: `Access ended on ${formatDateTime(expirationDate)}. Renew to regain full access to the platform.`,
      };
    } else if (timeRemaining <= ONE_WEEK_IN_MS) {
      warning = {
        title: "Subscription expiring soon",
        description: `Your subscription will expire on ${formatDateTime(expirationDate)}. Consider renewing to keep your tools running without interruptions.`,
      };
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-16">
      <header className="space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-base text-black/60 dark:text-white/60">
          Welcome back{user.email ? `, ${user.email}` : ""}.
        </p>
      </header>

      {warning ? (
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50 px-6 py-5 text-amber-900 dark:border-amber-400/60 dark:bg-amber-400/10 dark:text-amber-100">
          <h2 className="text-lg font-semibold">{warning.title}</h2>
          <p className="mt-2 text-sm/6">{warning.description}</p>
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">Account overview</h2>
          <dl className="mt-4 space-y-4 text-sm/6 text-black/70 dark:text-white/70">
            <div>
              <dt className="font-medium text-black dark:text-white">Email</dt>
              <dd className="mt-1 break-all">{user.email ?? "Unknown"}</dd>
            </div>
            <div>
              <dt className="font-medium text-black dark:text-white">Subscription expires</dt>
              <dd className="mt-1">{formatDateTime(expirationDate)}</dd>
            </div>
          </dl>
        </article>

        <article className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
          <h2 className="text-lg font-semibold">Quick actions</h2>
          <p className="text-sm/6 text-black/60 dark:text-white/60">
            Manage your access and keep your account secure.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              href="/auth/logout"
            >
              Sign out
            </Link>
            <a
              className="inline-flex items-center justify-center rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10"
              href="mailto:support@example.com"
            >
              Contact support
            </a>
          </div>
        </article>
      </section>
    </div>
  );
}
