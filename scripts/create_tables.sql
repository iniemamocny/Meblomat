-- SQL script to create the core tables for the carpentry management system.
-- The statements are compatible with PostgreSQL and mirror the Prisma schema
-- located at prisma/schema.prisma.  They are written to be idempotent so the
-- script can be executed multiple times (for example via psql or your
-- preferred SQL client) without raising duplicate object errors.

-- Ensure we operate inside the public schema for predictable object names.
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
    CREATE TYPE public.userrole AS ENUM (
      'admin',
      'carpenter',
      'client'
    );
  END IF;
END
$$;

ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'admin';
ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'carpenter';
ALTER TYPE public.userrole ADD VALUE IF NOT EXISTS 'client';

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

-- Users table.
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  roles public.userrole[] NOT NULL DEFAULT ARRAY[]::public.userrole[],
  carpenter_id INTEGER UNIQUE,
  client_id INTEGER UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_carpenter
    FOREIGN KEY (carpenter_id)
    REFERENCES public.carpenters (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_users_client
    FOREIGN KEY (client_id)
    REFERENCES public.clients (id)
    ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Sessions table.
CREATE TABLE IF NOT EXISTS public.sessions (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions (expires_at);

-- Enforce row level security defaults that align with Supabase expectations.
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

-- The default PostgreSQL privileges remain in place. Grant access to additional
-- roles as required by your environment.
