import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RegisterForm } from '@/components/register-form';
import { getCurrentUser } from '@/server/auth';

type RegisterPageSearchParams = Record<string, string | string[] | undefined>;
type RegisterPageProps = {
  searchParams?: Promise<RegisterPageSearchParams>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectParam = resolvedSearchParams?.redirectTo;
  const redirectTo = Array.isArray(redirectParam)
    ? redirectParam[0]
    : redirectParam ?? null;
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
            <h1 className="text-3xl font-semibold text-white">
              Utwórz konto w kilka minut
            </h1>
            <p className="text-sm text-slate-300">
              Zarejestruj konto klienta lub stolarskie i zarządzaj zleceniami w jednym miejscu.
            </p>
          </div>
          <div className="mt-8">
            <RegisterForm redirectTo={redirectTo} />
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">
            Masz już konto?{' '}
            <Link href={redirectTo ? `/login?redirectTo=${encodeURIComponent(redirectTo)}` : '/login'} className="text-emerald-300 hover:text-emerald-200">
              Zaloguj się
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
