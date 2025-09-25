export function isMissingTableError(
  error: unknown,
): error is { code: string } {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && (code === 'P2021' || code === 'P2010');
}

export function isPrismaConnectionError(
  error: unknown,
): error is Error {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'PrismaClientInitializationError' ||
    error.name === 'PrismaClientNotAvailableError'
  );
}

export function extractPrismaErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return undefined;
}
