export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'PLN',
) {
  if (value === null || value === undefined) {
    return '—';
  }

  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(value / 100);
}

export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) {
    return 'Brak terminu';
  }

  const value = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit',
    month: 'short',
  }).format(value);
}

export function formatRelativeDays(date: Date | string | null | undefined) {
  if (!date) {
    return '';
  }

  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'dzisiaj';
  if (diffDays === 1) return 'jutro';
  if (diffDays === -1) return 'wczoraj';
  if (diffDays > 1) return `za ${diffDays} dni`;
  return `${Math.abs(diffDays)} dni temu`;
}

export function formatPhone(phone?: string | null) {
  return phone ?? '—';
}
