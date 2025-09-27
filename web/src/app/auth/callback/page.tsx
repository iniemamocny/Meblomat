'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { EmailOtpType } from '@supabase/supabase-js';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const SUPPORTED_EMAIL_OTP_TYPES: EmailOtpType[] = [
  'signup',
  'magiclink',
  'recovery',
  'email_change',
  'invite',
];

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const url = new URL(window.location.href);
    const errorDescription =
      url.searchParams.get('error_description') ?? url.searchParams.get('error');

    if (errorDescription) {
      setError(errorDescription);
      return;
    }

    const tokenHash = url.searchParams.get('token_hash');
    const typeParam = url.searchParams.get('type');
    const code = url.searchParams.get('code');

    async function finalizeSession() {
      try {
        if (tokenHash && typeParam) {
          if (!SUPPORTED_EMAIL_OTP_TYPES.includes(typeParam as EmailOtpType)) {
            setError('Link aktywacyjny ma nieobsługiwany typ potwierdzenia.');
            return;
          }

          const { error } = await supabase.auth.verifyOtp({
            type: typeParam as EmailOtpType,
            token_hash: tokenHash,
          });

          if (error) {
            setError(error.message);
            return;
          }

          router.replace('/');
          return;
        }

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(url.toString());

          if (error) {
            setError(error.message);
            return;
          }

          router.replace('/');
          return;
        }

        setError('Brak tokenu uwierzytelniającego w adresie URL.');
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił nieoczekiwany błąd podczas logowania.');
        }
      }
    }

    finalizeSession();
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
