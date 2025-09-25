/**
 * Simple script to test the database connection.  Run this with:
 *
 *     npm run db:check
 *
 * The DATABASE_URL environment variable must be set.  It can be loaded
 * automatically from a .env file by requiring dotenv/config.
 */
import 'dotenv/config';
import { Prisma } from '@prisma/client';
import prisma from '../prisma/client';

async function main() {
  try {
    const [result] = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      'SELECT NOW() AS now',
    );
    console.log('Database connection successful. Current time:', result?.now);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
      console.error('Database connection failed: unable to reach the server.');
    } else {
      console.error('Database connection failed:', error);
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});
