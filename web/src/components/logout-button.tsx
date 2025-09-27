'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        setError('Nie udało się wylogować. Spróbuj ponownie.');
        return;
      }
      router.replace('/login');
      router.refresh();
    });
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? 'Wylogowywanie…' : 'Wyloguj się'}
      </button>
      {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}
    </div>
  );
}
