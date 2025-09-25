import { NextResponse } from 'next/server';
import prisma from '@meblomat/prisma';
import { extractPrismaErrorMessage, isPrismaConnectionError } from '@/lib/prisma-errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const [result] = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      'SELECT NOW() AS now',
    );

    return NextResponse.json({
      status: 'ok',
      checkedAt: new Date().toISOString(),
      databaseTime: result?.now ?? null,
    });
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      return NextResponse.json(
        {
          status: 'unreachable',
          message: 'Nie udało się połączyć z bazą danych.',
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: extractPrismaErrorMessage(error) ?? 'Nieznany błąd Prisma',
      },
      { status: 500 },
    );
  }
}
