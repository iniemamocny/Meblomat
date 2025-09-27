import { DashboardConnectionState } from '@/server/dashboard';

const STATUS_STYLES: Record<
  DashboardConnectionState['status'],
  { badge: string; border: string }
> = {
  connected: {
    badge:
      'border-emerald-500/40 bg-emerald-500/10 text-emerald-100 shadow shadow-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  'schema-missing': {
    badge:
      'border-amber-500/40 bg-amber-500/10 text-amber-100 shadow shadow-amber-500/10',
    border: 'border-amber-500/20',
  },
  error: {
    badge:
      'border-rose-500/50 bg-rose-500/10 text-rose-100 shadow shadow-rose-500/20',
    border: 'border-rose-500/30',
  },
};

type DatabaseStatusCardProps = {
  state: DashboardConnectionState;
};

export function DatabaseStatusCard({ state }: DatabaseStatusCardProps) {
  const styles = STATUS_STYLES[state.status];
  return (
    <section
      className={`rounded-3xl border ${styles.border} bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur`}
    >
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
            Status bazy danych
          </p>
          <h2 className="mt-3 text-xl font-semibold text-white">{state.label}</h2>
          {state.details && (
            <p className="mt-2 max-w-2xl text-sm text-slate-300">{state.details}</p>
          )}
        </div>
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${styles.badge}`}
        >
          {state.status === 'connected' && 'online'}
          {state.status === 'schema-missing' && 'brak schematu'}
          {state.status === 'error' && 'błąd połączenia'}
        </span>
      </header>
      <footer className="mt-6 space-y-3 text-xs text-slate-300">
        <p>
          Źródło danych: <strong className="font-semibold uppercase tracking-[0.3em] text-slate-100">{state.source}</strong>
        </p>
        {state.source === 'sample' && (
          <p>
            Ten widok korzysta z danych przykładowych. Po migracji bazy odśwież
            stronę, aby zobaczyć informacje z Twojej bazy danych.
          </p>
        )}
      </footer>
    </section>
  );
}
