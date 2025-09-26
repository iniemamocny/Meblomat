import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForms } from './auth-forms';
import { createSupabaseServerClient, SupabaseConfigError } from '@/lib/supabase/server';

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
  let supabase;

  try {
    supabase = createSupabaseServerClient(cookieStore);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-16 text-slate-100">
          <div className="mx-auto w-full max-w-xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center shadow-2xl shadow-black/50">
            <span className="inline-flex rounded-full border border-red-400/40 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-red-200">
              Konfiguracja wymagana
            </span>
            <h1 className="mt-4 text-2xl font-semibold text-white md:text-3xl">Połącz aplikację z Supabase</h1>
            <p className="mt-3 text-sm text-red-100/90">
              Aby uruchomić logowanie i rejestrację, dodaj zmienne środowiskowe
              <code className="mx-1 rounded bg-red-500/20 px-2 py-1 text-[0.8em]">NEXT_PUBLIC_SUPABASE_URL</code>
              oraz
              <code className="mx-1 rounded bg-red-500/20 px-2 py-1 text-[0.8em]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
              w ustawieniach projektu (np. plik
              <code className="mx-1 rounded bg-red-500/20 px-2 py-1 text-[0.8em]">.env.local</code>
              lub na serwerze Vercel).
            </p>
            <p className="mt-4 text-xs text-red-100/70">
              Po zapisaniu zmian ponownie zbuduj aplikację. Instrukcje krok po kroku znajdziesz w dokumentacji Supabase.
            </p>
          </div>
        </main>
      );
    }
    throw error;
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
