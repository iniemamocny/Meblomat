import { NextResponse } from 'next/server';
import prisma from '@meblomat/prisma';
import { createSampleRecords } from '@/lib/sample-data';
import {
  extractPrismaErrorMessage,
  isMissingTableError,
  isPrismaConnectionError,
} from '@/lib/prisma-errors';

export const runtime = 'nodejs';

export async function GET() {
  try {
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
    if (isMissingTableError(error) || isPrismaConnectionError(error)) {
      const sample = createSampleRecords();
      return NextResponse.json({
        source: 'sample',
        message:
          'Baza danych nie zawiera jeszcze tabel Prisma. Zwrócono dane przykładowe.',
        orders: sample.orders,
      });
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
