'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState, useTransition } from 'react';

type LoginFormProps = {
  redirectTo?: string | null;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!email || !password) {
      setError('Podaj adres e-mail i hasło.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? 'Nie udało się zalogować. Spróbuj ponownie.');
        return;
      }

      router.push(redirectTo && redirectTo !== '/login' ? redirectTo : '/');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
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
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-300">
          Hasło
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-white shadow-inner shadow-black/40 focus:border-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        />
      </div>
      {error && <p className="text-xs text-rose-300">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full border border-emerald-400/40 bg-emerald-500/20 px-4 py-3 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Logowanie…' : 'Zaloguj się'}
      </button>
    </form>
  );
}
