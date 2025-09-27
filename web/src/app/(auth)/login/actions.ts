'use server';

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfigError, requireSiteUrl } from '@/lib/supabase/config';
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

const SUPABASE_SETUP_MESSAGE =
  'Skonfiguruj połączenie z Supabase, dodając NEXT_PUBLIC_SUPABASE_URL i NEXT_PUBLIC_SUPABASE_ANON_KEY w pliku .env.local.';

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function resolveSupabaseClient(cookieStore: CookieStore): SupabaseClient | null {
  try {
    return createSupabaseServerClient(cookieStore);
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error('Supabase configuration error during auth action:', error.message, error);
      return null;
    }
    throw error;
  }
}

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
  try {
    const email = normalizeString(formData.get('email'));
    const password = normalizeString(formData.get('password'));

    if (!email || !password) {
      return { status: 'error', message: 'Podaj adres e-mail i hasło.' };
    }

    const cookieStore = await cookies();
    const supabase = resolveSupabaseClient(cookieStore);

    if (!supabase) {
      return { status: 'error', message: SUPABASE_SETUP_MESSAGE };
    }
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
    if (isRedirectError(error)) {
      throw error;
    }

    console.error('Unexpected error during sign in:', error);
    return {
      status: 'error',
      message: 'Wystąpił nieoczekiwany błąd podczas logowania. Spróbuj ponownie.',
    };
  }
}

export async function signUpAction(_: FormState, formData: FormData): Promise<FormState> {
  try {
    const email = normalizeString(formData.get('email'));
    const password = normalizeString(formData.get('password'));
    const role = normalizeString(formData.get('role'));
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
    const supabase = resolveSupabaseClient(cookieStore);

    if (!supabase) {
      return { status: 'error', message: SUPABASE_SETUP_MESSAGE };
    }

    const metadata =
      role === UserRole.CARPENTER
        ? resolveCarpenterMetadata()
        : resolveClientMetadata(ClientSubscriptionPlan.FREE, invitedBy);

    let siteUrl: string;
    try {
      siteUrl = requireSiteUrl();
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        console.error('Site URL configuration error during sign up:', error.message, error);
        return {
          status: 'error',
          message: `${error.message} Gdy tylko uzupełnisz konfigurację, spróbuj ponownie.`,
        };
      }
      throw error;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
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
      return INITIAL_STATE;
    }

    return {
      status: 'success',
      message: 'Sprawdź skrzynkę e-mail i potwierdź rejestrację, aby się zalogować.',
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error('Unexpected error during sign up:', error);
    return {
      status: 'error',
      message: 'Wystąpił nieoczekiwany błąd podczas rejestracji. Spróbuj ponownie.',
    };
  }
}

export async function signInWithGoogleAction(): Promise<FormState> {
  try {
    const cookieStore = await cookies();
    const supabase = resolveSupabaseClient(cookieStore);

    if (!supabase) {
      return { status: 'error', message: SUPABASE_SETUP_MESSAGE };
    }

    let siteUrl: string;
    try {
      siteUrl = requireSiteUrl();
    } catch (error) {
      if (error instanceof SupabaseConfigError) {
        console.error('Site URL configuration error during Google sign in:', error.message, error);
        return {
          status: 'error',
          message: `${error.message} Zaktualizuj konfigurację adresu strony i spróbuj ponownie.`,
        };
      }
      throw error;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error('Google OAuth sign-in error:', error.message, error);
      return {
        status: 'error',
        message: 'Nie udało się zainicjować logowania przez Google. Spróbuj ponownie.',
      };
    }

    if (data?.url) {
      redirect(data.url);
    }

    return {
      status: 'error',
      message:
        'Nie udało się przekierować do Google. Upewnij się, że logowanie przez Google jest poprawnie skonfigurowane.',
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error('Unexpected error during Google sign in:', error);
    return {
      status: 'error',
      message: 'Wystąpił błąd podczas logowania przez Google. Spróbuj ponownie później.',
    };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  const supabase = resolveSupabaseClient(cookieStore);

  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect('/login');
}

export { INITIAL_STATE };
