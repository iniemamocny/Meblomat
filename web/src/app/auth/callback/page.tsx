'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    supabase.auth
      .exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) {
          setError(error.message);
          return;
        }

        router.replace('/');
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił nieoczekiwany błąd podczas logowania.');
        }
      });
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white px-6 py-8 text-center shadow-md">
        <h1 className="text-xl font-semibold text-gray-900">
          {error ? 'Logowanie nie powiodło się' : 'Logowanie w toku...'}
        </h1>
        <p className="mt-4 text-sm text-gray-600">
          {error
            ? `Spróbuj ponownie lub skontaktuj się z administratorem. Szczegóły: ${error}`
            : 'Trwa kończenie procesu logowania. Za chwilę zostaniesz przekierowany.'}
        </p>
      </div>
    </main>
  );
}
