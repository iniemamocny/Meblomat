import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForms } from './auth-forms';
import { SupabaseConfigMissing } from '@/components/supabase-config-missing';
import { resolveSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Meblomat – Logowanie i rejestracja',
  description:
    'Zaloguj się lub dołącz do platformy Meblomat jako stolarz lub klient. Konta integrowane z Supabase.',
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const { client: supabase, error: supabaseError } = resolveSupabaseServerClient(cookieStore);

  if (!supabase) {
    return <SupabaseConfigMissing message={supabaseError} />;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect('/');
  }

  const params = (await searchParams) ?? {};
  const refParam = Array.isArray(params.ref) ? params.ref[0] : params.ref;
  const invitedParam = Array.isArray(params.invitedBy) ? params.invitedBy[0] : params.invitedBy;
  const invitedBy = refParam ?? invitedParam ?? null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-100">
      <div className="mb-8 text-center">
        <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
          Meblomat
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-white md:text-4xl">Witaj w panelu warsztatu</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-300">
          Zaloguj się, aby zarządzać warsztatem stolarskim, lub utwórz konto klienta i wysyłaj swoje projekty do wyceny.
        </p>
      </div>
      <AuthForms invitedBy={invitedBy} />
    </main>
  );
}
