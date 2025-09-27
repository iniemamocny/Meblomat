import { NextResponse } from 'next/server';
import { prisma } from '@meblomat/prisma';
import {
  AccountType,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@/lib/domain';
import { hashPassword } from '@/server/auth';

export const runtime = 'nodejs';

const TRIAL_DAYS = 14;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldErrors = Partial<Record<'email' | 'password' | 'accountType', string>>;

type RegisterPayload = {
  email?: unknown;
  password?: unknown;
  accountType?: unknown;
};

export async function POST(request: Request) {
  let payload: RegisterPayload;
  try {
    payload = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      {
        error: 'Nie udało się odczytać danych formularza.',
      },
      { status: 400 },
    );
  }

  const { email, password, accountType } = payload ?? {};
  const errors: FieldErrors = {};

  let normalizedEmail: string | undefined;
  if (typeof email !== 'string') {
    errors.email = 'Podaj adres e-mail.';
  } else {
    const candidateEmail = email.trim().toLowerCase();
    if (!candidateEmail) {
      errors.email = 'Podaj adres e-mail.';
    } else if (!EMAIL_REGEX.test(candidateEmail)) {
      errors.email = 'Podaj prawidłowy adres e-mail.';
    } else {
      normalizedEmail = candidateEmail;
    }
  }

  let passwordValue: string | undefined;
  if (typeof password !== 'string') {
    errors.password = 'Ustaw hasło.';
  } else if (!password) {
    errors.password = 'Ustaw hasło.';
  } else if (password.length < 8) {
    errors.password = 'Hasło powinno mieć co najmniej 8 znaków.';
  } else {
    passwordValue = password;
  }

  let normalizedAccountType: 'carpenter' | 'client' | undefined;
  if (typeof accountType !== 'string') {
    errors.accountType = 'Wybierz typ konta.';
  } else {
    const candidateAccountType = accountType.trim().toLowerCase();
    if (candidateAccountType === 'carpenter' || candidateAccountType === 'client') {
      normalizedAccountType = candidateAccountType;
    } else {
      errors.accountType = 'Wybierz typ konta.';
    }
  }

  if (Object.keys(errors).length > 0 || !normalizedEmail || !passwordValue || !normalizedAccountType) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const isCarpenterAccount = normalizedAccountType === 'carpenter';

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        errors: {
          email: 'Konto z tym adresem e-mail już istnieje.',
        },
      },
      { status: 409 },
    );
  }

  try {
    const passwordHash = await hashPassword(passwordValue);
    const trialStartedAt = isCarpenterAccount ? new Date() : null;
    const trialEndsAt = isCarpenterAccount
      ? new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        roles: [isCarpenterAccount ? UserRole.CARPENTER : UserRole.CLIENT],
        accountType: isCarpenterAccount
          ? AccountType.CARPENTER
          : AccountType.CLIENT,
        subscriptionPlan: isCarpenterAccount
          ? SubscriptionPlan.CARPENTER_PROFESSIONAL
          : SubscriptionPlan.CLIENT_FREE,
        subscriptionStatus: isCarpenterAccount
          ? SubscriptionStatus.TRIALING
          : SubscriptionStatus.ACTIVE,
        trialStartedAt,
        trialEndsAt,
      },
      select: {
        id: true,
        email: true,
        accountType: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        trialStartedAt: true,
        trialEndsAt: true,
      },
    });

    return NextResponse.json(
      {
        user,
        message: isCarpenterAccount
          ? 'Konto stolarskie zostało utworzone. Darmowy 14-dniowy okres próbny właśnie się rozpoczął.'
          : 'Konto klienta zostało utworzone. Możesz zalogować się, aby rozpocząć.',
        accountType: isCarpenterAccount ? 'carpenter' : 'client',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Register endpoint error', error);
    return NextResponse.json(
      { error: 'Nie udało się utworzyć konta. Spróbuj ponownie później.' },
      { status: 500 },
    );
  }
}
