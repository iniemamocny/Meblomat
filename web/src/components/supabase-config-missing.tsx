import type { ReactNode } from 'react';

type SupabaseConfigMissingProps = {
  message?: string | null;
  actions?: ReactNode;
};

const defaultMessage =
  'Aby korzystać z panelu, dodaj zmienne środowiskowe Supabase do pliku .env.local i uruchom ponownie aplikację.';

export function SupabaseConfigMissing({ message, actions }: SupabaseConfigMissingProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-slate-200 shadow shadow-black/30">
          <div className="space-y-2">
            <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200">
              Meblomat
            </span>
            <h1 className="text-2xl font-semibold text-white">Skonfiguruj połączenie z Supabase</h1>
            <p className="text-slate-300">{message ?? defaultMessage}</p>
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
          {actions}
        </div>
      </main>
    </div>
  );
}
