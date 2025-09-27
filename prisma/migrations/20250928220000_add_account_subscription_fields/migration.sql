DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AccountType'
          AND n.nspname = current_schema()
    ) THEN
        CREATE TYPE "AccountType" AS ENUM ('admin', 'carpenter', 'client');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'SubscriptionPlan'
          AND n.nspname = current_schema()
    ) THEN
        CREATE TYPE "SubscriptionPlan" AS ENUM ('client_free', 'client_premium', 'carpenter_professional');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'SubscriptionStatus'
          AND n.nspname = current_schema()
    ) THEN
        CREATE TYPE "SubscriptionStatus" AS ENUM ('trialing', 'active', 'cancelled', 'expired');
    END IF;
END
$$;

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
