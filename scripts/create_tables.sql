-- SQL script to create the core tables for the carpentry management system.
-- The statements are compatible with PostgreSQL and mirror the Prisma schema
-- located at prisma/schema.prisma.  They are written to be idempotent so the
-- script can be executed multiple times (for example in Supabase's SQL
-- editor) without raising duplicate object errors.

-- Ensure we are operating inside the public schema because Supabase executes
-- SQL with a restricted search_path for security reasons.
SET search_path = public;

-- Enable required extensions.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- enum when missing and ensures every expected value exists.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderstatus') THEN
    CREATE TYPE public.orderstatus AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'READY_FOR_DELIVERY',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;
END
$$;

ALTER TYPE public.orderstatus ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.orderstatus ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE public.orderstatus ADD VALUE IF NOT EXISTS 'READY_FOR_DELIVERY';
ALTER TYPE public.orderstatus ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE public.orderstatus ADD VALUE IF NOT EXISTS 'CANCELLED';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderpriority') THEN
    CREATE TYPE public.orderpriority AS ENUM (
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT'
    );
  END IF;
END
$$;

ALTER TYPE public.orderpriority ADD VALUE IF NOT EXISTS 'LOW';
ALTER TYPE public.orderpriority ADD VALUE IF NOT EXISTS 'MEDIUM';
ALTER TYPE public.orderpriority ADD VALUE IF NOT EXISTS 'HIGH';
ALTER TYPE public.orderpriority ADD VALUE IF NOT EXISTS 'URGENT';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
    CREATE TYPE public.taskstatus AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'BLOCKED'
    );
  END IF;
END
$$;

ALTER TYPE public.taskstatus ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE public.taskstatus ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE public.taskstatus ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE public.taskstatus ADD VALUE IF NOT EXISTS 'BLOCKED';

-- Helper function to keep the updated_at columns in sync.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Workshops table.
CREATE TABLE IF NOT EXISTS public.workshops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_workshops_updated_at ON public.workshops;

CREATE TRIGGER trg_workshops_updated_at
BEFORE UPDATE ON public.workshops
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

-- Carpenters table.
CREATE TABLE IF NOT EXISTS public.carpenters (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  workshop_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_carpenters_workshop
    FOREIGN KEY (workshop_id)
    REFERENCES public.workshops (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_carpenters_workshop_id ON public.carpenters (workshop_id);

DROP TRIGGER IF EXISTS trg_carpenters_updated_at ON public.carpenters;

CREATE TRIGGER trg_carpenters_updated_at
BEFORE UPDATE ON public.carpenters
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.carpenters ENABLE ROW LEVEL SECURITY;

-- Clients table.
CREATE TABLE IF NOT EXISTS public.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_clients_updated_at ON public.clients;

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Orders table.
CREATE TABLE IF NOT EXISTS public.orders (
  id SERIAL PRIMARY KEY,
  reference UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status public.orderstatus NOT NULL DEFAULT 'PENDING',
  priority public.orderpriority NOT NULL DEFAULT 'MEDIUM',
  budget_cents INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  carpenter_id INTEGER,
  client_id INTEGER,
  workshop_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_orders_carpenter
    FOREIGN KEY (carpenter_id)
    REFERENCES public.carpenters (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_client
    FOREIGN KEY (client_id)
    REFERENCES public.clients (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_workshop
    FOREIGN KEY (workshop_id)
    REFERENCES public.workshops (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status_priority ON public.orders (status, priority);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON public.orders (due_date);
CREATE INDEX IF NOT EXISTS idx_orders_carpenter_id ON public.orders (carpenter_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_workshop_id ON public.orders (workshop_id);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Order tasks table.
CREATE TABLE IF NOT EXISTS public.order_tasks (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status public.taskstatus NOT NULL DEFAULT 'PENDING',
  assignee_id INTEGER,
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_order_tasks_order
    FOREIGN KEY (order_id)
    REFERENCES public.orders (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_tasks_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES public.carpenters (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_tasks_order_status ON public.order_tasks (order_id, status);
CREATE INDEX IF NOT EXISTS idx_order_tasks_assignee_id ON public.order_tasks (assignee_id);

DROP TRIGGER IF EXISTS trg_order_tasks_updated_at ON public.order_tasks;

CREATE TRIGGER trg_order_tasks_updated_at
BEFORE UPDATE ON public.order_tasks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.order_tasks ENABLE ROW LEVEL SECURITY;

-- Order notes table.
CREATE TABLE IF NOT EXISTS public.order_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_order_notes_order
    FOREIGN KEY (order_id)
    REFERENCES public.orders (id)
    ON DELETE CASCADE
);

ALTER TABLE public.order_notes ENABLE ROW LEVEL SECURITY;

-- Ensure authenticated users can work with the tables when RLS is enabled.
DO $$
DECLARE
  table_name TEXT;
  policy_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'workshops',
    'carpenters',
    'clients',
    'orders',
    'order_tasks',
    'order_notes'
  ]
  LOOP
    policy_name := table_name || '_authenticated_full_access';

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        policy_name,
        table_name
      );
    END IF;
  END LOOP;
END
$$;

-- Grant the authenticated role the required table and sequence privileges and
-- ensure future tables inherit those permissions.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
