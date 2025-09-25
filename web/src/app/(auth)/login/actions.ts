'use server';

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
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

function normalizeString(value: FormDataEntryValue | null): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

function resolveCarpenterMetadata() {
  const affiliateCode = randomBytes(4).toString('hex');
  return {
    role: UserRole.CARPENTER,
    subscriptionPlan: CarpenterSubscriptionPlan.PROFESSIONAL,
    affiliateCode,
  } satisfies Record<string, unknown>;
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

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
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

  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);

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
}

export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  await supabase.auth.signOut();
  redirect('/login');
}

export { INITIAL_STATE };
