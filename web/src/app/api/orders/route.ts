import { NextResponse } from 'next/server';
import { prisma } from '@meblomat/prisma';
import {
  extractPrismaErrorMessage,
  isMissingTableError,
  isPrismaConnectionError,
} from '@/lib/prisma-errors';
import { isUnauthorizedError, requireCurrentUser } from '@/server/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await requireCurrentUser();

    const orders = await prisma.order.findMany({
      include: {
        carpenter: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        workshop: { select: { id: true, name: true } },
        tasks: { select: { id: true, status: true, title: true, dueDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ source: 'database', orders });
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return NextResponse.json(
        { error: 'Brak aktywnej sesji użytkownika.' },
        { status: 401 },
      );
    }

    if (isMissingTableError(error) || isPrismaConnectionError(error)) {
      return NextResponse.json(
        {
          source: 'error',
          message:
            'Baza danych nie jest gotowa. Uruchom migracje Prisma, aby uzyskać dostęp do listy zleceń.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        source: 'error',
        message: extractPrismaErrorMessage(error) ?? 'Nie udało się pobrać listy zleceń.',
      },
      { status: 500 },
    );
  }
}
