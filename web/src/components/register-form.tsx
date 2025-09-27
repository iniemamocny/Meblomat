'use client';

import React, {
  FormEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';

const TRIAL_DAYS = 14;
const ACCOUNT_TYPE_OPTIONS = [
  { value: 'carpenter' as const, label: 'Stolarz' },
  { value: 'client' as const, label: 'Klient' },
];

type AccountTypeValue = (typeof ACCOUNT_TYPE_OPTIONS)[number]['value'];

type FieldErrors = Partial<
  Record<'email' | 'password' | 'confirmPassword' | 'accountType', string>
>;

type RegisterFormProps = {
  redirectTo?: string | null;
};

export function RegisterForm({ redirectTo }: RegisterFormProps) {
  const router = useRouter();
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountTypeValue>('carpenter');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirmPassword') ?? '');
    const accountTypeInput = String(
      formData.get('accountType') ?? selectedAccountType,
    ).trim();

    const normalizedAccountType: AccountTypeValue | null =
      accountTypeInput === 'carpenter'
        ? 'carpenter'
        : accountTypeInput === 'client'
        ? 'client'
        : null;

    const nextFieldErrors: FieldErrors = {};

    if (!email) {
      nextFieldErrors.email = 'Podaj adres e-mail.';
    }

    if (!password) {
      nextFieldErrors.password = 'Ustaw hasło.';
    } else if (password.length < 8) {
      nextFieldErrors.password = 'Hasło powinno mieć co najmniej 8 znaków.';
    }

    if (!confirmPassword) {
      nextFieldErrors.confirmPassword = 'Potwierdź hasło.';
    } else if (password !== confirmPassword) {
      nextFieldErrors.confirmPassword = 'Hasła muszą być takie same.';
    }

    if (!normalizedAccountType) {
      nextFieldErrors.accountType = 'Wybierz typ konta.';
    }

    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      setError('Popraw zaznaczone pola.');
      return;
    }

    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          accountType: normalizedAccountType,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            message?: string;
            error?: string;
            errors?: FieldErrors;
            accountType?: AccountTypeValue;
          }
        | null;

      if (!response.ok) {
        setFieldErrors(payload?.errors ?? {});
        setError(
          payload?.error ?? 'Nie udało się utworzyć konta. Spróbuj ponownie.',
        );
        setSuccess(null);
        return;
      }

      setFieldErrors({});
      const effectiveAccountType =
        payload?.accountType === 'carpenter' || payload?.accountType === 'client'
          ? payload.accountType
          : normalizedAccountType;

      const successMessage =
        payload?.message ??
        (effectiveAccountType === 'carpenter'
          ? 'Konto stolarskie zostało utworzone. 14-dniowy okres próbny właśnie się rozpoczął.'
          : 'Konto klienta zostało utworzone. Możesz się zalogować.');

      setSuccess(successMessage);
      setError(null);

      redirectTimerRef.current = setTimeout(() => {
        const params = new URLSearchParams();
        params.set('registered', effectiveAccountType ?? 'client');
        if (redirectTo) {
          params.set('redirectTo', redirectTo);
        }
        router.push(`/login?${params.toString()}`);
        router.refresh();
      }, 1500);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Adres e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner shadow-black/40 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        {fieldErrors.email && (
          <p className="text-xs text-rose-300">{fieldErrors.email}</p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner shadow-black/40 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        {fieldErrors.password && (
          <p className="text-xs text-rose-300">{fieldErrors.password}</p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Potwierdź hasło
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner shadow-black/40 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
        {fieldErrors.confirmPassword && (
          <p className="text-xs text-rose-300">{fieldErrors.confirmPassword}</p>
        )}
      </div>
      <div className="space-y-2">
        <label
          htmlFor="accountType"
          className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300"
        >
          Typ konta
        </label>
        <select
          id="accountType"
          name="accountType"
          value={selectedAccountType}
          onChange={(event) => {
            const nextValue = event.target.value as AccountTypeValue;
            setSelectedAccountType(nextValue);
          }}
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner shadow-black/40 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          {ACCOUNT_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.accountType && (
          <p className="text-xs text-rose-300">{fieldErrors.accountType}</p>
        )}
        {selectedAccountType === 'carpenter' && (
          <p className="text-xs text-emerald-200/80">
            Rozpocznij darmowy {TRIAL_DAYS}-dniowy okres próbny planu profesjonalnego
            dla stolarzy. Możesz anulować w dowolnym momencie.
          </p>
        )}
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      {success && <p className="text-xs text-emerald-200">{success}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Zakładanie konta…' : 'Utwórz konto'}
      </button>
    </form>
  );
}
