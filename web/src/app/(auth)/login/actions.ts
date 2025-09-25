'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerActionClient } from '@/lib/supabase/server';
import {
  CarpenterSubscriptionPlan,
  ClientSubscriptionPlan,
  UserRole,
} from '@/lib/domain';

type FormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

const INITIAL_STATE: FormState = { status: 'idle' };

function resolveUnexpectedErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.includes('Brak wymaganej zmiennej środowiskowej')) {
    return error.message;
  }
  return fallback;
}

function normalizeString(value: FormDataEntryValue | null): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function resolveCarpenterMetadata() {
  const affiliateCode = generateAffiliateCode();
  return {
    role: UserRole.CARPENTER,
    subscriptionPlan: CarpenterSubscriptionPlan.PROFESSIONAL,
    affiliateCode,
  } satisfies Record<string, unknown>;
}

function generateAffiliateCode() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buffer = new Uint8Array(4);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without Web Crypto (should not happen in Next.js runtimes)
  return Math.random().toString(16).slice(2, 10).padEnd(8, '0');
}

function resolveClientMetadata(plan: ClientSubscriptionPlan, invitedBy?: string | null) {
  const baseMetadata = {
    role: UserRole.CLIENT,
    subscriptionPlan: plan,
    projectLimit: plan === ClientSubscriptionPlan.FREE ? 2 : null,
  } satisfies Record<string, unknown>;

  if (invitedBy) {
    return { ...baseMetadata, invitedBy };
  }
  return baseMetadata;
}

export async function signInAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeString(formData.get('email'));
  const password = normalizeString(formData.get('password'));

  if (!email || !password) {
    return { status: 'error', message: 'Podaj adres e-mail i hasło.' };
  }

  try {
    const supabase = await createSupabaseServerActionClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return {
        status: 'error',
        message:
          error.message === 'Invalid login credentials'
            ? 'Niepoprawny e-mail lub hasło.'
            : `Nie udało się zalogować: ${error.message}`,
      };
    }

    redirect('/');
    return INITIAL_STATE;
  } catch (error) {
    console.error('Nie udało się zalogować użytkownika.', error);
    return {
      status: 'error',
      message: resolveUnexpectedErrorMessage(
        error,
        'Wystąpił błąd serwera podczas logowania. Spróbuj ponownie później.',
      ),
    };
  }
}

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  const email = normalizeString(formData.get('email'));
  const password = normalizeString(formData.get('password'));
  const role = normalizeString(formData.get('role'));
  const clientPlan = normalizeString(formData.get('clientPlan'));
  const invitedBy = normalizeString(formData.get('invitedBy')) || undefined;

  if (!email || !password) {
    return { status: 'error', message: 'Podaj adres e-mail oraz hasło.' };
  }

  if (password.length < 8) {
    return { status: 'error', message: 'Hasło musi mieć co najmniej 8 znaków.' };
  }

  if (role !== UserRole.CARPENTER && role !== UserRole.CLIENT) {
    return { status: 'error', message: 'Wybierz typ konta.' };
  }

  try {
    const supabase = await createSupabaseServerActionClient();

    const metadata =
      role === UserRole.CARPENTER
        ? resolveCarpenterMetadata()
        : resolveClientMetadata(
            clientPlan === ClientSubscriptionPlan.PREMIUM
              ? ClientSubscriptionPlan.PREMIUM
              : ClientSubscriptionPlan.FREE,
            invitedBy,
          );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback`,
        data: metadata,
      },
    });

    if (error) {
      return {
        status: 'error',
        message: error.message.includes('already registered')
          ? 'Adres e-mail jest już zajęty. Zaloguj się zamiast tego.'
          : `Nie udało się utworzyć konta: ${error.message}`,
      };
    }

    if (data.session) {
      redirect('/');
    }

    return {
      status: 'success',
      message: 'Sprawdź skrzynkę e-mail i potwierdź rejestrację, aby się zalogować.',
    };
  } catch (error) {
    console.error('Nie udało się utworzyć konta użytkownika.', error);
    return {
      status: 'error',
      message: resolveUnexpectedErrorMessage(
        error,
        'Wystąpił błąd serwera podczas rejestracji. Spróbuj ponownie później.',
      ),
    };
  }
}

export async function signOutAction() {
  try {
    const supabase = await createSupabaseServerActionClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error('Nie udało się wylogować użytkownika.', error);
  }
  redirect('/login');
}

export { INITIAL_STATE };
