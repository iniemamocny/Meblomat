-- Ensure pgcrypto extension for UUID generation
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

CREATE TABLE IF NOT EXISTS "Workshop" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workshop_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE IF NOT EXISTS "OrderNote" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderNote_pkey" PRIMARY KEY ("id")
);

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