-- SQL script to create the core tables for the carpentry management system.
-- The statements are compatible with PostgreSQL and mirror the Prisma schema
-- located at prisma/schema.prisma.

-- Enable required extensions.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enumerated types matching the Prisma enums.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderstatus') THEN
    CREATE TYPE orderstatus AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'READY_FOR_DELIVERY',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'orderpriority') THEN
    CREATE TYPE orderpriority AS ENUM (
      'LOW',
      'MEDIUM',
      'HIGH',
      'URGENT'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'taskstatus') THEN
    CREATE TYPE taskstatus AS ENUM (
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'BLOCKED'
    );
  END IF;
END $$;

-- Helper function to keep the updated_at columns in sync.
CREATE OR REPLACE FUNCTION set_updated_at()
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
CREATE TABLE IF NOT EXISTS workshops (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_workshops_updated_at
BEFORE UPDATE ON workshops
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workshops ENABLE ROW LEVEL SECURITY;

-- Carpenters table.
CREATE TABLE IF NOT EXISTS carpenters (
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
    REFERENCES workshops (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_carpenters_workshop_id ON carpenters (workshop_id);

CREATE TRIGGER trg_carpenters_updated_at
BEFORE UPDATE ON carpenters
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE carpenters ENABLE ROW LEVEL SECURITY;

-- Clients table.
CREATE TABLE IF NOT EXISTS clients (
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

CREATE TRIGGER trg_clients_updated_at
BEFORE UPDATE ON clients
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Orders table.
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  reference UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status orderstatus NOT NULL DEFAULT 'PENDING',
  priority orderpriority NOT NULL DEFAULT 'MEDIUM',
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
    REFERENCES carpenters (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_client
    FOREIGN KEY (client_id)
    REFERENCES clients (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_orders_workshop
    FOREIGN KEY (workshop_id)
    REFERENCES workshops (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status_priority ON orders (status, priority);
CREATE INDEX IF NOT EXISTS idx_orders_due_date ON orders (due_date);
CREATE INDEX IF NOT EXISTS idx_orders_carpenter_id ON orders (carpenter_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders (client_id);

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Order tasks table.
CREATE TABLE IF NOT EXISTS order_tasks (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  status taskstatus NOT NULL DEFAULT 'PENDING',
  assignee_id INTEGER,
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_order_tasks_order
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_order_tasks_assignee
    FOREIGN KEY (assignee_id)
    REFERENCES carpenters (id)
    ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_order_tasks_order_status ON order_tasks (order_id, status);

CREATE TRIGGER trg_order_tasks_updated_at
BEFORE UPDATE ON order_tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE order_tasks ENABLE ROW LEVEL SECURITY;

-- Order notes table.
CREATE TABLE IF NOT EXISTS order_notes (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  author TEXT NOT NULL,
  role TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_order_notes_order
    FOREIGN KEY (order_id)
    REFERENCES orders (id)
    ON DELETE CASCADE
);

ALTER TABLE order_notes ENABLE ROW LEVEL SECURITY;

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
        AND polname = policy_name
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true);',
        policy_name,
        table_name
      );
    END IF;
  END LOOP;
END $$;

