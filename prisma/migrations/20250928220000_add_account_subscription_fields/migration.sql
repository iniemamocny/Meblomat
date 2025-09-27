-- Create new account and subscription enums
CREATE TYPE "AccountType" AS ENUM ('admin', 'carpenter', 'client');
CREATE TYPE "SubscriptionPlan" AS ENUM ('client_free', 'client_premium', 'carpenter_professional');
CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'cancelled', 'expired');

-- Extend the User table with subscription metadata
ALTER TABLE "User"
    ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'client',
    ADD COLUMN     "subscriptionPlan" "SubscriptionPlan",
    ADD COLUMN     "subscriptionStatus" "SubscriptionStatus",
    ADD COLUMN     "trialStartedAt" TIMESTAMP(3),
    ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- Assign account type for existing records based on their role bindings
UPDATE "User"
SET "accountType" = CASE
        WHEN 'admin' = ANY("roles") THEN 'admin'
        WHEN "carpenterId" IS NOT NULL THEN 'carpenter'
        WHEN "clientId" IS NOT NULL THEN 'client'
        ELSE "accountType"
    END::"AccountType";

-- Ensure administrator accounts remain active
UPDATE "User"
SET "subscriptionStatus" = 'active'::"SubscriptionStatus"
WHERE 'admin' = ANY("roles");
