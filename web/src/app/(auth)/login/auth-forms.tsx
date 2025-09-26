'use client';

import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, signUpAction } from './actions';
import { INITIAL_STATE } from './state';
import { ClientSubscriptionPlan, UserRole } from '@/lib/domain';

type AuthFormsProps = {
  invitedBy?: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? 'Przetwarzanie…' : label}
    </button>
  );
}

function ErrorMessage({ state }: { state: { status: string; message?: string } }) {
  if (state.status !== 'error' || !state.message) {
    return null;
  }

  return (
    <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
      {state.message}
    </p>
  );
}

function SuccessMessage({ state }: { state: { status: string; message?: string } }) {
  if (state.status !== 'success' || !state.message) {
    return null;
  }

  return (
    <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
      {state.message}
    </p>
  );
}

export function AuthForms({ invitedBy }: AuthFormsProps) {
  const [mode, setMode] = useState<'login' | 'register'>(invitedBy ? 'register' : 'login');
  const [loginState, loginAction] = useFormState(signInAction, INITIAL_STATE);
  const [registerState, registerAction] = useFormState(signUpAction, INITIAL_STATE);

  const invitationNotice = useMemo(() => {
    if (!invitedBy) {
      return null;
    }
    return (
      <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-3 text-xs text-emerald-200">
        Zostałeś zaproszony do współpracy przez stolarza o identyfikatorze <span className="font-semibold">{invitedBy}</span>.
        Po rejestracji Twoje konto zostanie automatycznie powiązane z jego warsztatem.
      </p>
    );
  }, [invitedBy]);

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-xl shadow-black/40">
      <div className="mb-6 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'login'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          Mam konto
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'register'
              ? 'bg-emerald-500 text-emerald-950'
              : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          Chcę dołączyć
        </button>
      </div>

      {mode === 'login' ? (
        <form className="space-y-4" action={loginAction}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Hasło
            </label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <ErrorMessage state={loginState} />
          <SubmitButton label="Zaloguj się" />
        </form>
      ) : (
        <form className="space-y-4" action={registerAction}>
          <input type="hidden" name="invitedBy" value={invitedBy ?? ''} />
          {invitationNotice}
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Adres e-mail
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Hasło
            </label>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/40"
            />
            <p className="mt-1 text-xs text-slate-400">Minimum 8 znaków, zalecane litery i cyfry.</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
              Typ konta
            </label>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Stolarz</span>
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.CARPENTER}
                    className="h-4 w-4"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Pełny dostęp do tworzenia projektów, wycen i panelu warsztatu. Wymagana aktywna subskrypcja.
                </p>
              </label>
              <label className="flex cursor-pointer flex-col rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-emerald-500/40">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Klient</span>
                  <input
                    type="radio"
                    name="role"
                    value={UserRole.CLIENT}
                    className="h-4 w-4"
                    required
                  />
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Darmowe konto do wysyłania zapytań ofertowych do maksymalnie 2 stolarzy.
                </p>
                <div className="mt-4 space-y-2 rounded-xl bg-slate-900/60 p-3">
                  <label className="flex items-center justify-between text-xs text-slate-200">
                    <span>Plan standardowy</span>
                    <input
                      type="radio"
                      name="clientPlan"
                      value={ClientSubscriptionPlan.FREE}
                      defaultChecked
                      className="h-3 w-3"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs text-slate-200">
                    <span>Plan premium (nielimitowane zapytania)</span>
                    <input
                      type="radio"
                      name="clientPlan"
                      value={ClientSubscriptionPlan.PREMIUM}
                      className="h-3 w-3"
                    />
                  </label>
                </div>
              </label>
            </div>
          </div>
          <ErrorMessage state={registerState} />
          <SuccessMessage state={registerState} />
          <SubmitButton label="Utwórz konto" />
        </form>
      )}
    </div>
  );
}
