#!/usr/bin/env bash

# Simple helper script to run Prisma migrations in a CI/CD pipeline or
# locally. It generates the Prisma client and deploys any pending
# migrations to the database specified by the `DATABASE_URL` environment
# variable. When running against Supabase or Cloud SQL, ensure
# DATABASE_URL includes the correct credentials and connection string.

set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Please set DATABASE_URL to your PostgreSQL connection string before running migrations." >&2
  exit 1
fi

echo "Running Prisma generate..."
npx prisma generate

echo "Deploying Prisma migrations..."
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Prisma migrations applied successfully."