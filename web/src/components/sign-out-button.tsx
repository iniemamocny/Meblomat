'use client';

import { useFormStatus } from 'react-dom';
import { signOutAction } from '@/app/(auth)/login/actions';

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-100 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? 'Wylogowywanie…' : 'Wyloguj'}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction} className="inline-flex">
      <SignOutSubmit />
    </form>
  );
}
