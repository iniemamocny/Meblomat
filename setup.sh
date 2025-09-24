#!/usr/bin/env bash

# Simple setup script to prepare the carpentry system locally.
# This script installs Node.js dependencies, generates the Prisma client
# and applies database migrations.  It assumes you have Node.js and
# npm installed.  Before running, export DATABASE_URL with the
# connection string for your PostgreSQL database (Supabase or Cloud SQL).

set -euo pipefail

echo "Installing dependencies..."
npm ci

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL must be set to your PostgreSQL connection string." >&2
  exit 1
fi

echo "Generating Prisma client and deploying migrations..."
npx prisma generate
npx prisma migrate deploy --schema prisma/schema.prisma

echo "Setup complete.  You can now start the application using your preferred start script."