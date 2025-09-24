/**
 * Simple script to test the database connection.  Run this with:
 *
 *     npm run db:check
 *
 * The DATABASE_URL environment variable must be set.  It can be loaded
 * automatically from a .env file by requiring dotenv/config.
 */
import 'dotenv/config';
import prisma from '../prisma/client';

async function main() {
  try {
    const [result] = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      'SELECT NOW() AS now',
    );
    console.log('Database connection successful. Current time:', result?.now);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Database connection failed:', err);
  process.exit(1);
});