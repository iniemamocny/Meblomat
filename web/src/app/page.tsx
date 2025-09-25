import Link from 'next/link';
import { DatabaseStatusCard } from '@/components/database-status-card';
import { OrderPriorityBadge, OrderStatusBadge } from '@/components/order-status-pill';
import { OrdersPipeline } from '@/components/orders-pipeline';
import { formatCurrency, formatDateShort, formatPhone, formatRelativeDays } from '@/lib/format';
import { getDashboardData } from '@/server/dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const dashboard = await getDashboardData();
  const stats = [
    {
      label: 'Aktywne zlecenia',
      value: dashboard.counts.activeOrders,
      helper: `z ${dashboard.counts.orders} łącznie`,
    },
    {
      label: 'Zespół',
      value: dashboard.counts.carpenters,
      helper: 'stolarzy gotowych do pracy',
    },
    {
      label: 'Klienci',
      value: dashboard.counts.clients,
      helper: 'aktywnych relacji',
    },
    {
      label: 'Pilne',
      value: dashboard.counts.urgentOrders,
      helper: 'wymagają natychmiastowej reakcji',
    },
  ];

  const upcoming = dashboard.upcoming.slice(0, 4);
  const topCarpenters = dashboard.carpenters.slice(0, 4);
  const topClients = dashboard.clients.slice(0, 6);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
              Meblomat
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Panel warsztatu stolarskiego
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-300">
              Monitoruj realizację zamówień, dostępność zespołu i relacje z klientami. Gotowe do
              podpięcia pod Supabase.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100 shadow shadow-emerald-500/20">
            <p className="text-xs uppercase tracking-[0.35em] text-emerald-200">Następny krok</p>
            <p className="mt-2 font-medium">Uruchom migracje Prisma, aby utworzyć tabele.</p>
            <code className="mt-3 inline-flex items-center rounded-lg border border-emerald-400/40 bg-slate-950/60 px-3 py-2 text-xs text-emerald-100">
              npx prisma migrate deploy
            </code>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 py-12">
        <DatabaseStatusCard state={dashboard.connection} />

        <section className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Przepływ zleceń</h2>
              <p className="text-sm text-slate-300">
                Pełny obraz tego, na jakim etapie znajdują się Twoje realizacje.
              </p>
            </div>
            <Link
              href="/api/orders"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200 hover:text-emerald-100"
            >
              Podgląd danych JSON →
            </Link>
          </div>
          <OrdersPipeline groups={dashboard.ordersByStatus} />
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow shadow-black/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                {stat.label}
              </p>
              <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-300">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow shadow-black/30">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Plan na najbliższe dni</h2>
                <p className="text-sm text-slate-300">
                  Najważniejsze terminy i przypisani opiekunowie zamówień.
                </p>
              </div>
            </header>
            <ul className="mt-6 space-y-4">
              {upcoming.length === 0 ? (
                <li className="text-xs text-slate-400">Brak zbliżających się terminów.</li>
              ) : (
                upcoming.map((order) => (
                  <li
                    key={order.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow shadow-black/30"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{order.title}</p>
                        <p className="text-xs text-slate-300">
                          {order.clientName ?? 'Nieprzypisany klient'}
                        </p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-200">
                      {order.dueDate && (
                        <span className="rounded-full bg-white/10 px-3 py-1">
                          Termin: {formatDateShort(order.dueDate)} · {formatRelativeDays(order.dueDate)}
                        </span>
                      )}
                      <OrderPriorityBadge priority={order.priority} />
                      {typeof order.budgetCents === 'number' && (
                        <span className="rounded-full bg-white/10 px-3 py-1">
                          Budżet: {formatCurrency(order.budgetCents)}
                        </span>
                      )}
                      {order.carpenterName && (
                        <span className="rounded-full bg-white/10 px-3 py-1">
                          {order.carpenterName}
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow shadow-black/30">
            <header className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Najaktywniejsi stolarze</h2>
                <p className="text-sm text-slate-300">
                  Obłożenie zespołu i realizacje w ostatnich tygodniach.
                </p>
              </div>
            </header>
            <ul className="mt-6 space-y-4">
              {topCarpenters.map((carpenter) => (
                <li
                  key={carpenter.id}
                  className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow shadow-black/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{carpenter.name}</p>
                      <p className="text-xs text-slate-300">
                        {carpenter.workshopName ?? 'Warsztat nieprzypisany'}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                      {carpenter.activeOrders} aktywnych
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-400">
                    {carpenter.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-full bg-white/5 px-2 py-1">
                        {skill}
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-4 text-xs text-slate-300">
              Dodaj pozostałych członków zespołu po zakończeniu migracji bazy danych.
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow shadow-black/30">
          <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Relacje z klientami</h2>
              <p className="text-sm text-slate-300">
                Kto czeka na wycenę, a z kim warto się skontaktować.
              </p>
            </div>
            <Link
              href="#"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 hover:text-slate-100"
            >
              Eksportuj listę
            </Link>
          </header>
          <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead className="bg-white/10 text-xs uppercase tracking-[0.35em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Klient</th>
                  <th className="px-4 py-3 font-semibold">Otwarte zlecenia</th>
                  <th className="px-4 py-3 font-semibold">Ostatnia aktywność</th>
                  <th className="px-4 py-3 font-semibold">Kontakt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-slate-950/60">
                {topClients.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-center text-xs text-slate-400" colSpan={4}>
                      Brak klientów w bazie.
                    </td>
                  </tr>
                ) : (
                  topClients.map((client) => (
                    <tr key={client.id} className="transition-colors hover:bg-white/5">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white">{client.name}</p>
                        {client.company && (
                          <p className="text-xs text-slate-300">{client.company}</p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                          {client.openOrders}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">
                        {client.lastOrderAt
                          ? `${formatDateShort(client.lastOrderAt)} · ${formatRelativeDays(client.lastOrderAt)}`
                          : 'Brak danych'}
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span>{client.email}</span>
                          {client.phone && <span>{formatPhone(client.phone)}</span>}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/5 p-6 text-sm text-emerald-100 shadow shadow-emerald-500/20">
          <h2 className="text-lg font-semibold text-emerald-200">Co dalej?</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-4">
            <li>
              Uzupełnij zmienną <code className="rounded bg-slate-950/60 px-1 py-0.5 text-xs">DATABASE_URL</code> w pliku
              <code className="ml-1 rounded bg-slate-950/60 px-1 py-0.5 text-xs">.env</code> i uruchom migracje Prisma.
            </li>
            <li>W Supabase dodaj dane startowe przez edytor SQL lub import pliku .sql.</li>
            <li>
              Rozszerz folder <code className="rounded bg-slate-950/60 px-1 py-0.5 text-xs">web/src/app/api</code> o endpointy POST, aby tworzyć nowe
              zlecenia prosto z panelu.
            </li>
          </ol>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>Meblomat © {new Date().getFullYear()} – Twój cyfrowy warsztat stolarski.</p>
          <div className="flex items-center gap-4">
            <Link href="https://www.prisma.io" target="_blank" className="hover:text-emerald-200">
              Prisma
            </Link>
            <Link href="https://supabase.com" target="_blank" className="hover:text-emerald-200">
              Supabase
            </Link>
            <Link href="https://vercel.com" target="_blank" className="hover:text-emerald-200">
              Vercel
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
