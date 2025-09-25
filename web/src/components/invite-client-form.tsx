'use client';

import { useMemo } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { INVITE_INITIAL_STATE, sendClientInviteAction } from '@/app/actions/send-client-invite';
import { ClientSubscriptionPlan } from '@/lib/domain';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? 'Wysyłanie…' : 'Wyślij zaproszenie'}
    </button>
  );
}

export function InviteClientForm() {
  const [state, formAction] = useFormState(sendClientInviteAction, INVITE_INITIAL_STATE);

  const alert = useMemo(() => {
    if (state.status === 'idle') {
      return null;
    }

    const className =
      state.status === 'success'
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
        : 'border-red-500/40 bg-red-500/10 text-red-200';

    return (
      <p className={`rounded-lg border p-3 text-sm ${className}`}>
        {state.message}
      </p>
    );
  }, [state]);

  return (
    <form className="space-y-4" action={formAction}>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          E-mail klienta
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
          placeholder="klient@przyklad.pl"
        />
      </div>
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
          Plan klienta
        </label>
        <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
          <label className="flex items-center justify-between">
            <span>Standard (limit 2 zapytań jednocześnie)</span>
            <input type="radio" name="plan" value={ClientSubscriptionPlan.FREE} defaultChecked className="h-3 w-3" />
          </label>
          <label className="flex items-center justify-between">
            <span>Premium (brak limitów wysyłki)</span>
            <input type="radio" name="plan" value={ClientSubscriptionPlan.PREMIUM} className="h-3 w-3" />
          </label>
        </div>
      </div>
      {alert}
      <SubmitButton />
    </form>
  );
}
