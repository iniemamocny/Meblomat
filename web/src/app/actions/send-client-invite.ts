'use server';

import { cookies } from 'next/headers';
import { ClientSubscriptionPlan, UserRole } from '@/lib/domain';
import { resolveClientMetadata } from '@/lib/auth/metadata';
import { createSupabaseAdminClient, SERVICE_ROLE_ERROR_MESSAGE } from '@/lib/supabase/admin';
import { getSiteUrl } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type InviteFormState = {
  status: 'idle' | 'error' | 'success';
  message?: string;
};

export const INVITE_INITIAL_STATE: InviteFormState = { status: 'idle' };

function normalizeString(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function resolveUnexpectedErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message === SERVICE_ROLE_ERROR_MESSAGE) {
    return error.message;
  }
  return fallback;
}

export async function sendClientInviteAction(
  _: InviteFormState,
  formData: FormData,
): Promise<InviteFormState> {
  const email = normalizeString(formData.get('email'));
  const planValue = normalizeString(formData.get('plan'));

  if (!email) {
    return { status: 'error', message: 'Podaj adres e-mail klienta.' };
  }

  const plan =
    planValue === ClientSubscriptionPlan.PREMIUM
      ? ClientSubscriptionPlan.PREMIUM
      : ClientSubscriptionPlan.FREE;

  try {
    const cookieStore = await cookies();
    const supabase = createSupabaseServerClient(cookieStore);
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return { status: 'error', message: 'Aby wysłać zaproszenie, zaloguj się na konto stolarza.' };
    }

    const metadata = (session.user.user_metadata ?? {}) as Record<string, unknown>;
    const role = metadata.role as string | undefined;

    if (role !== UserRole.CARPENTER) {
      return { status: 'error', message: 'Tylko stolarze mogą zapraszać klientów do warsztatu.' };
    }

    const admin = createSupabaseAdminClient();
    const siteUrl = getSiteUrl().replace(/\/$/, '');
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: resolveClientMetadata(plan, session.user.id),
      redirectTo: `${siteUrl}/auth/callback`,
    });

    if (error) {
      return {
        status: 'error',
        message: error.message.includes('already registered')
          ? 'Ten adres e-mail jest już używany w Supabase. Poproś klienta o zalogowanie się.'
          : `Nie udało się wysłać zaproszenia: ${error.message}`,
      };
    }

    return {
      status: 'success',
      message: `Zaproszenie zostało wysłane do ${email}.`,
    };
  } catch (error) {
    console.error('Nie udało się wysłać zaproszenia klientowi.', error);
    return {
      status: 'error',
      message: resolveUnexpectedErrorMessage(
        error,
        'Wystąpił błąd podczas wysyłania zaproszenia. Sprawdź konfigurację i spróbuj ponownie.',
      ),
    };
  }
}
