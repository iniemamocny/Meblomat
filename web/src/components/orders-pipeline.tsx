import { OrderStatus } from '@/lib/domain';
import { DashboardOrder, OrdersByStatus } from '@/server/dashboard';
import { OrderPriorityBadge } from '@/components/order-status-pill';
import { formatDateShort, formatRelativeDays } from '@/lib/format';

type OrdersPipelineProps = {
  groups: OrdersByStatus;
};

const STATUS_COPY: Record<
  OrderStatus,
  { title: string; description: string }
> = {
  [OrderStatus.PENDING]: {
    title: 'Nowe zapytania',
    description: 'Oczekują na akceptację i rozpoczęcie prac.',
  },
  [OrderStatus.IN_PROGRESS]: {
    title: 'W realizacji',
    description: 'Zadania trwające w warsztacie.',
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    title: 'Do odbioru',
    description: 'Wymagają kontaktu z klientem i finalizacji.',
  },
  [OrderStatus.COMPLETED]: {
    title: 'Zakończone',
    description: 'Prace przekazane klientom.',
  },
  [OrderStatus.CANCELLED]: {
    title: 'Anulowane',
    description: 'Wstrzymane lub odrzucone realizacje.',
  },
};

export function OrdersPipeline({ groups }: OrdersPipelineProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Object.values(OrderStatus).map((status) => {
        const orders = groups[status] ?? [];
        const meta = STATUS_COPY[status];
        return (
          <article
            key={status}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-5 shadow-inner shadow-black/20"
          >
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  {meta.title}
                </p>
                <p className="mt-1 text-xs text-slate-300">{meta.description}</p>
              </div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200">
                {orders.length}
              </span>
            </header>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400">Brak pozycji w tej kolumnie.</p>
              ) : (
                orders.map((order) => <PipelineCard key={order.id} order={order} />)
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

type PipelineCardProps = {
  order: DashboardOrder;
};

function PipelineCard({ order }: PipelineCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 shadow shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{order.title}</h3>
          <p className="text-xs text-slate-300">
            {order.clientName ?? 'Nieprzypisany klient'}
          </p>
        </div>
        <OrderPriorityBadge priority={order.priority} />
      </div>
      <dl className="mt-3 space-y-2 text-xs text-slate-300">
        {order.dueDate && (
          <div className="flex items-center justify-between gap-2">
            <dt className="uppercase tracking-[0.3em] text-slate-500">Termin</dt>
            <dd className="rounded-full bg-white/5 px-2 py-1 font-medium text-slate-100">
              {formatDateShort(order.dueDate)} · {formatRelativeDays(order.dueDate)}
            </dd>
          </div>
        )}
        {order.carpenterName && (
          <div className="flex items-center justify-between gap-2">
            <dt className="uppercase tracking-[0.3em] text-slate-500">Opiekun</dt>
            <dd className="rounded-full bg-white/5 px-2 py-1 text-slate-200">
              {order.carpenterName}
            </dd>
          </div>
        )}
        {order.tasksTotal > 0 && (
          <div className="flex items-center justify-between gap-2">
            <dt className="uppercase tracking-[0.3em] text-slate-500">Postęp</dt>
            <dd className="rounded-full bg-white/5 px-2 py-1 text-slate-200">
              {order.tasksCompleted}/{order.tasksTotal}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
