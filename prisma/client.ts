type PrismaClient = {
  $disconnect: () => Promise<void>;
  $queryRawUnsafe: <T = unknown>(query: string, ...values: unknown[]) => Promise<T>;
  [key: string]: any;
};

// This module exports a singleton PrismaClient while gracefully handling
// environments where `@prisma/client` has not been generated yet.  Instead of
// importing Prisma directly (which would break the Next.js build when the
// client is missing), we lazily require it the first time a property of the
// exported proxy is accessed.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function loadPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  try {
    const dynamicRequire = eval('require') as (id: string) => unknown;
    const { PrismaClient } = dynamicRequire('@prisma/client') as {
      PrismaClient: new (...args: any[]) => PrismaClient;
    };
    const client = new PrismaClient({
      // Uncomment the next line to enable verbose logging:
      // log: ['query', 'info', 'warn', 'error'],
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client;
    }

    return client;
  } catch (cause) {
    const error = new Error(
      'Pakiet `@prisma/client` nie jest dostępny. Uruchom `npx prisma generate`, aby wygenerować klienta Prisma.',
    );
    error.name = 'PrismaClientNotAvailableError';
    (error as Error & { cause?: unknown }).cause = cause;
    throw error;
  }
}

const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = loadPrismaClient();
    const value = (client as unknown as Record<PropertyKey, unknown>)[property];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export const prisma = prismaProxy as PrismaClient;
export default prisma;
