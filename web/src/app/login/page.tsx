import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/login-form';
import { getCurrentUser } from '@/server/auth';

type LoginPageSearchParams = Record<string, string | string[] | undefined>;
type LoginPageProps = {
  searchParams?: Promise<LoginPageSearchParams>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectParam = resolvedSearchParams?.redirectTo;
  const redirectTo = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam ?? null;
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect(redirectTo && redirectTo !== '/login' ? redirectTo : '/');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/70 p-10 shadow-2xl shadow-black/40">
          <div className="space-y-3 text-center">
            <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
              Meblomat
            </span>
            <h1 className="text-3xl font-semibold text-white">Zaloguj się do panelu</h1>
            <p className="text-sm text-slate-300">
              Podaj dane konta administratora lub członka zespołu, aby uzyskać dostęp do zleceń i raportów.
            </p>
          </div>
          <div className="mt-8">
            <LoginForm redirectTo={redirectTo} />
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Nie masz jeszcze konta? Sprawdź instrukcje w dokumentacji projektu, aby dodać użytkownika w bazie danych.
          </p>
        </div>
      </div>
    </div>
  );
}
