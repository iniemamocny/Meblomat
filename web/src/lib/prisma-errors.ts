import { Prisma } from '@prisma/client';

export function isMissingTableError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2010')
  );
}

export function isPrismaConnectionError(
  error: unknown,
): error is Prisma.PrismaClientInitializationError {
  return error instanceof Prisma.PrismaClientInitializationError;
}

export function extractPrismaErrorMessage(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError ||
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}
