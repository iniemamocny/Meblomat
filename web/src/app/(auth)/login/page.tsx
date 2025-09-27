import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthForms } from './auth-forms';
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
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto max-w-3xl px-6 py-16">
          <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-slate-200 shadow shadow-black/30">
            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
                Meblomat
              </span>
              <h1 className="text-2xl font-semibold text-white">Skonfiguruj połączenie z Supabase</h1>
              <p className="text-slate-300">
                {supabaseError ??
                  'Aby korzystać z panelu, dodaj zmienne środowiskowe Supabase do pliku .env.local i uruchom ponownie aplikację.'}
              </p>
            </div>
            <div className="space-y-2 rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Wymagane zmienne</p>
              <ul className="list-disc space-y-1 pl-5 text-slate-200">
                <li>
                  <code className="rounded bg-slate-950/80 px-1">NEXT_PUBLIC_SUPABASE_URL</code> – adres URL projektu z zakładki API.
                </li>
                <li>
                  <code className="rounded bg-slate-950/80 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> – publiczny klucz anon.
                </li>
                <li>
                  <code className="rounded bg-slate-950/80 px-1">SUPABASE_SERVICE_ROLE_KEY</code> – opcjonalny klucz serwisowy do funkcji serwerowych.
                </li>
              </ul>
            </div>
            <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-4 text-emerald-100">
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Podpowiedź</p>
              <p className="mt-2">
                Utwórz plik <code className="rounded bg-slate-950/80 px-1">web/.env.local</code>, wklej wartości zmiennych i zrestartuj komendę{' '}
                <code className="rounded bg-slate-950/80 px-1">npm run web:dev</code>.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
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
