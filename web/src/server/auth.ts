import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import type { UserRole } from '@prisma/client';
import { prisma } from '@meblomat/prisma';

const SESSION_COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME ?? 'meblomat_session';
const SESSION_TTL_MINUTES = Math.max(
  1,
  Number.parseInt(process.env.AUTH_SESSION_TTL_MINUTES ?? '4320', 10) || 0,
);
const SESSION_COOKIE_SECURE =
  process.env.AUTH_SESSION_COOKIE_SECURE?.toLowerCase() === 'true' ||
  process.env.NODE_ENV === 'production';

export type AuthenticatedUser = {
  id: number;
  email: string;
  roles: UserRole[];
  carpenterId: number | null;
  clientId: number | null;
};

export class UnauthorizedError extends Error {
  constructor(message = 'Brak aktywnej sesji użytkownika.') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

function getSessionExpiryDate() {
  return new Date(Date.now() + SESSION_TTL_MINUTES * 60 * 1000);
}

function setSessionCookie(token: string, expiresAt: Date) {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: SESSION_COOKIE_SECURE,
    path: '/',
    expires: expiresAt,
  });
}

function clearSessionCookie() {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: SESSION_COOKIE_SECURE,
    path: '/',
    expires: new Date(0),
  });
}

export async function createSession(userId: number) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = getSessionExpiryDate();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  setSessionCookie(token, expiresAt);

  return { token, expiresAt };
}

export async function destroySession(token?: string) {
  const cookieToken = token ?? cookies().get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    await prisma.session.deleteMany({ where: { token: cookieToken } });
  }
  clearSessionCookie();
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!session) {
    clearSessionCookie();
    return null;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { token: session.token } });
    clearSessionCookie();
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    roles: session.user.roles,
    carpenterId: session.user.carpenterId ?? null,
    clientId: session.user.clientId ?? null,
  };
}

export async function requireCurrentUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

export { SESSION_COOKIE_NAME };
