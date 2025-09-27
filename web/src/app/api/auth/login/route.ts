import { NextResponse } from 'next/server';
import { prisma } from '@meblomat/prisma';
import { createSession, verifyPassword } from '@/server/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Nieprawidłowe dane logowania.' },
      { status: 400 },
    );
  }

  const { email, password } = (payload ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Podaj adres e-mail i hasło.' },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || password.length === 0) {
    return NextResponse.json(
      { error: 'Wpisz poprawny e-mail i hasło.' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      roles: true,
      accountType: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
      carpenterId: true,
      clientId: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Nieprawidłowy e-mail lub hasło.' },
      { status: 401 },
    );
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json(
      { error: 'Nieprawidłowy e-mail lub hasło.' },
      { status: 401 },
    );
  }

  await prisma.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      roles: user.roles,
      accountType: user.accountType,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      trialStartedAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      carpenterId: user.carpenterId,
      clientId: user.clientId,
    },
  });
}
