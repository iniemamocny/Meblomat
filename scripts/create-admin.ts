import 'dotenv/config';
import {
  AccountType,
  PrismaClient,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const [emailInput, password] = process.argv.slice(2);

  if (!emailInput || !password) {
    console.error('Usage: ts-node scripts/create-admin.ts <email> <password>');
    process.exit(1);
  }

  const email = emailInput.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      roles: { set: [UserRole.admin] },
      accountType: AccountType.admin,
      subscriptionPlan: null,
      subscriptionStatus: SubscriptionStatus.active,
      trialStartedAt: null,
      trialEndsAt: null,
    },
    create: {
      email,
      passwordHash,
      roles: [UserRole.admin],
      accountType: AccountType.admin,
      subscriptionPlan: null,
      subscriptionStatus: SubscriptionStatus.active,
      trialStartedAt: null,
      trialEndsAt: null,
    },
  });

  console.log(`✅ Administrator ${user.email} jest gotowy.`);
}

main()
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
