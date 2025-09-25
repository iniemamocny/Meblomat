import { OrderPriority, OrderStatus } from '@/lib/domain';

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

type OrderPriorityBadgeProps = {
  priority: OrderPriority;
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  [OrderStatus.PENDING]: {
    label: 'Nowe',
    className:
      'border-amber-400/40 bg-amber-400/10 text-amber-100 shadow shadow-amber-400/10',
  },
  [OrderStatus.IN_PROGRESS]: {
    label: 'W realizacji',
    className:
      'border-sky-400/40 bg-sky-400/10 text-sky-100 shadow shadow-sky-400/10',
  },
  [OrderStatus.READY_FOR_DELIVERY]: {
    label: 'Do odbioru',
    className:
      'border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-100 shadow shadow-fuchsia-500/10',
  },
  [OrderStatus.COMPLETED]: {
    label: 'Zrealizowane',
    className:
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-100 shadow shadow-emerald-500/10',
  },
  [OrderStatus.CANCELLED]: {
    label: 'Anulowane',
    className:
      'border-rose-400/40 bg-rose-400/10 text-rose-100 shadow shadow-rose-500/10',
  },
};

const PRIORITY_META: Record<
  OrderPriority,
  { label: string; className: string }
> = {
  [OrderPriority.LOW]: {
    label: 'Niski priorytet',
    className: 'border-white/20 bg-white/5 text-slate-200',
  },
  [OrderPriority.MEDIUM]: {
    label: 'Standard',
    className: 'border-slate-300/30 bg-slate-200/10 text-slate-100',
  },
  [OrderPriority.HIGH]: {
    label: 'Wysoki priorytet',
    className:
      'border-orange-400/40 bg-orange-400/10 text-orange-100 shadow shadow-orange-500/10',
  },
  [OrderPriority.URGENT]: {
    label: 'Pilne',
    className:
      'border-red-400/50 bg-red-500/15 text-red-100 shadow shadow-red-500/20',
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function OrderPriorityBadge({ priority }: OrderPriorityBadgeProps) {
  const config = PRIORITY_META[priority];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${config.className}`}
    >
      {config.label}
    </span>
  );
}
