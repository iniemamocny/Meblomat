SET search_path = public;

-- Ensure pgcrypto extension for UUID helpers
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'OrderStatus'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "OrderStatus" AS ENUM (''PENDING'', ''IN_PROGRESS'', ''READY_FOR_DELIVERY'', ''COMPLETED'', ''CANCELLED'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['PENDING', 'IN_PROGRESS', 'READY_FOR_DELIVERY', 'COMPLETED', 'CANCELLED'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'OrderPriority'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "OrderPriority" AS ENUM (''LOW'', ''MEDIUM'', ''HIGH'', ''URGENT'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "OrderPriority" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'TaskStatus'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "TaskStatus" AS ENUM (''PENDING'', ''IN_PROGRESS'', ''COMPLETED'', ''BLOCKED'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'UserRole'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "UserRole" AS ENUM (''admin'', ''carpenter'', ''client'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['admin', 'carpenter', 'client'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AccountType'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "AccountType" AS ENUM (''admin'', ''carpenter'', ''client'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['admin', 'carpenter', 'client'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'SubscriptionPlan'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "SubscriptionPlan" AS ENUM (''client_free'', ''client_premium'', ''carpenter_professional'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['client_free', 'client_premium', 'carpenter_professional'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "SubscriptionPlan" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'SubscriptionStatus'
          AND n.nspname = current_schema()
    ) THEN
        EXECUTE 'CREATE TYPE "SubscriptionStatus" AS ENUM (''trialing'', ''active'', ''cancelled'', ''expired'')';
    END IF;
END
$$;

DO $$
DECLARE
    desired_value TEXT;
    desired_values TEXT[] := ARRAY['trialing', 'active', 'cancelled', 'expired'];
BEGIN
    FOREACH desired_value IN ARRAY desired_values LOOP
        EXECUTE format('ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS %L', desired_value);
    END LOOP;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Workshop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "Carpenter" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "headline" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workshopId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carpenter_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "Order" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "OrderPriority" NOT NULL DEFAULT 'MEDIUM',
    "budgetCents" INTEGER,
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "carpenterId" INTEGER,
    "clientId" INTEGER,
    "workshopId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderTask" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "assigneeId" INTEGER,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTask_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE IF NOT EXISTS "OrderNote" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roles" "UserRole"[] NOT NULL DEFAULT ARRAY[]::"UserRole"[],
    "accountType" "AccountType" NOT NULL DEFAULT 'client',
    "subscriptionPlan" "SubscriptionPlan",
    "subscriptionStatus" "SubscriptionStatus",
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "carpenterId" INTEGER,
    "clientId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Session" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Enforce row level security so only trusted roles (e.g. Supabase service_role) can access auth tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_access_user" ON "User";
CREATE POLICY "service_role_all_access_user"
    ON "User"
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_access_session" ON "Session";
CREATE POLICY "service_role_all_access_session"
    ON "Session"
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access_public_users ON public.users;
CREATE POLICY service_role_all_access_public_users
    ON public.users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_all_access_public_sessions ON public.sessions;
CREATE POLICY service_role_all_access_public_sessions
    ON public.sessions
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Carpenter_email_key" ON "Carpenter"("email");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Carpenter_workshopId_idx" ON "Carpenter"("workshopId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Order_reference_key" ON "Order"("reference");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_status_priority_idx" ON "Order"("status", "priority");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_dueDate_idx" ON "Order"("dueDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_carpenterId_idx" ON "Order"("carpenterId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_clientId_idx" ON "Order"("clientId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderTask_orderId_status_idx" ON "OrderTask"("orderId", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_carpenterId_key" ON "User"("carpenterId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_clientId_key" ON "User"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx" ON "Session"("expiresAt");

-- Ensure default for order reference to maintain UUID auto-generation
ALTER TABLE "Order"
    ALTER COLUMN "reference" SET DEFAULT gen_random_uuid();

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'Carpenter'
          AND constraint_name = 'Carpenter_workshopId_fkey'
    ) THEN
        ALTER TABLE "Carpenter" ADD CONSTRAINT "Carpenter_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'Order'
          AND constraint_name = 'Order_carpenterId_fkey'
    ) THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_carpenterId_fkey" FOREIGN KEY ("carpenterId") REFERENCES "Carpenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'Order'
          AND constraint_name = 'Order_clientId_fkey'
    ) THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'Order'
          AND constraint_name = 'Order_workshopId_fkey'
    ) THEN
        ALTER TABLE "Order" ADD CONSTRAINT "Order_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "Workshop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'OrderTask'
          AND constraint_name = 'OrderTask_orderId_fkey'
    ) THEN
        ALTER TABLE "OrderTask" ADD CONSTRAINT "OrderTask_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'OrderTask'
          AND constraint_name = 'OrderTask_assigneeId_fkey'
    ) THEN
        ALTER TABLE "OrderTask" ADD CONSTRAINT "OrderTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Carpenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'OrderNote'
          AND constraint_name = 'OrderNote_orderId_fkey'
    ) THEN
        ALTER TABLE "OrderNote" ADD CONSTRAINT "OrderNote_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'User'
          AND constraint_name = 'User_carpenterId_fkey'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_carpenterId_fkey" FOREIGN KEY ("carpenterId") REFERENCES "Carpenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'User'
          AND constraint_name = 'User_clientId_fkey'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
          AND table_schema = current_schema()
          AND table_name = 'Session'
          AND constraint_name = 'Session_userId_fkey'
    ) THEN
        ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- Row level security and role-specific grants are not enabled here so that
-- the default PostgreSQL permissions (owned by the role executing the script)
-- remain in place. Adjust privileges as required for your deployment.
