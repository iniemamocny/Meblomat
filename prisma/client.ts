import { PrismaClient } from '@prisma/client';

// This module exports a singleton PrismaClient to prevent exhausting
// database connections in development.  See:
// https://www.prisma.io/docs/orm/prisma-client/constructor#singleton-client
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Uncomment the next line to enable verbose logging:
    // log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;