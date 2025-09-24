# Carpentry System – Deployment Guide

This repository contains a minimal backend skeleton for a carpentry services
platform.  The goal is to provide a quick way to prototype and deploy a
database‐driven application for carpenters and their clients.  The current
focus is on deployment and infrastructure; application logic (e.g. API
routes, UI components) should be added as the project evolves.

## Overview

The plan is to start with an MVP hosted on **Vercel** for preview and
**Supabase** for the database.  Once the project matures, we will migrate
the data to **Google Cloud SQL** and deploy the same container image to
**Cloud Run**.  Continuous integration is handled by GitHub Actions.  Key
components include:

* **Dockerfile** – a multi‑stage build in `docker/Dockerfile` that
  produces a slim Node.js runtime image.
* **Prisma schema** – located in `prisma/schema.prisma`, defining
  `Carpenter`, `Client` and `Order` models.
* **GitHub Actions** workflows –
  * `vercel-preview.yml` builds and deploys preview instances to Vercel.
  * `gcp-deploy.yml` builds a container with Cloud Build and deploys it
    to Cloud Run.
* **Prisma migration script** – `prisma/migrate.sh` generates the Prisma
  client and deploys pending migrations.

## Database options

### Starting with Supabase

For rapid prototyping you can create a free project on [Supabase](https://supabase.com).  Supabase
provides a hosted PostgreSQL database with a simple UI.  Copy the
connection string (`postgresql://...`) into the `DATABASE_URL` secret in
your GitHub repository.  When running locally, export the same URL
before executing `prisma/migrate.sh`.

### Migrating to Cloud SQL

When the project grows, migrating to Google Cloud SQL in the `europe-central2`
region (Warsaw) will provide better scalability and reliability.  There are
two recommended ways to connect to Cloud SQL:

1. **Cloud SQL Auth Proxy** – a separate binary that runs alongside your
   application.  It uses **IAM** to authenticate and establishes a TLS
   connection to your instance.  The proxy handles encryption and
   authorization so your application communicates with the database using
   standard connection strings.  You must ensure that the instance is
   reachable from your environment (either via a public IP address or a
   private VPC connector)【981221121680752†L353-L390】.

2. **Cloud SQL Node.js connector** – a library that provides a native
   alternative to the proxy.  It also performs IAM authorization and
   uses TLS 1.3 encryption【623610891877361†L343-L359】.  Before you can use
   it, grant your service account the *Cloud SQL Client* role and enable
   the *Cloud SQL Admin API*【623610891877361†L373-L379】.  To integrate with
   Prisma, you can start a local proxy by calling
   `startLocalProxy()` and point `DATABASE_URL` at the Unix socket
   provided【623610891877361†L519-L549】.

**Note about Vercel IPs:** Vercel’s infrastructure uses a range of dynamic
IPs; therefore you cannot reliably allowlist a single IP address for
Cloud SQL.  Vercel provides features like *Deployment Protection* or
*Secure Compute* (enterprise) for dedicated IPs【338442436449284†L22-L30】.
Until you migrate to Cloud Run, use the Node.js connector or Auth Proxy
with a public IP.

## Connecting the application

Prisma reads its connection string from the `DATABASE_URL` environment
variable.  For Supabase the URL can be used directly.  For Cloud SQL via
Auth Proxy, the connection string will look like
`postgresql://<user>:<password>@127.0.0.1:5432/<db>?schema=public`.  If
using the Node.js connector, the URL points to a Unix domain socket
created by `startLocalProxy()` (e.g. `/tmp/cloudsql/instance.sock`).

The `schema.prisma` models define three tables:

| Model      | Key fields       | Description                              |
|-----------|------------------|------------------------------------------|
| Carpenter | `id`, `email`    | Stores carpenter identity and contact.    |
| Client    | `id`, `email`    | Stores client identity and contact.       |
| Order     | `id`, `status`   | Represents work requests between clients and carpenters. |

See `prisma/schema.prisma` for details of the relationships and enum values.

### Environment variables

For local development it is convenient to define your database URL in a
`.env` file so that tools like `prisma` and `ts-node` can load it
automatically.  A template file `.env.example` is included in the
repository; copy it to `.env` and replace the placeholders with your actual
Supabase pooled connection string.  **Do not commit `.env` to version
control.**

When deploying via GitHub Actions or Vercel, set the `DATABASE_URL`
secret/variable in the appropriate settings page.  The CI workflows
forward this environment variable into your running application.

### Testing connectivity

To verify that your environment is configured correctly, run:

```bash
npm run db:check
```

This script (located at `scripts/check-db.ts`) loads `.env`, connects to
the database using the Prisma client defined in `prisma/client.ts` and
prints the current time returned by the server.  If it fails, ensure that
`DATABASE_URL` is set and that the database is reachable from your
environment.

## Running migrations

To apply migrations locally or in CI:

```bash
export DATABASE_URL="<your connection string>"
bash prisma/migrate.sh
```

The script will generate the Prisma client and apply any pending
migrations.  If `DATABASE_URL` is not set, the script exits with an
error.

## GitHub Actions workflows

### Preview deployments on Vercel

The workflow in `.github/workflows/vercel-preview.yml` triggers on every
push.  It installs dependencies, builds the project and uses the Vercel
CLI to create a preview deployment.  You must set the following secrets
in your repository:

* `VERCEL_TOKEN` – a personal or machine token created in the Vercel
  dashboard.
* `VERCEL_ORG_ID` – the organisation ID from Vercel.
* `VERCEL_PROJECT_ID` – the project ID from Vercel.

The action runs `vercel pull` to fetch project settings, `vercel build`
to create a prebuilt output and finally `vercel deploy --prebuilt` to
publish the preview.

### Deploying to Google Cloud Run

The workflow in `.github/workflows/gcp-deploy.yml` triggers when the
`main` branch is updated.  It authenticates to Google Cloud using a
service account key stored in the `GCP_SA_KEY` secret, builds a Docker
image with Cloud Build and publishes it to Artifact Registry, then
deploys the image to a Cloud Run service.  Configuration highlights:

| Secret             | Purpose                                                 |
|--------------------|---------------------------------------------------------|
| `GCP_SA_KEY`       | JSON service account key with `Cloud Run
  Admin` and `Artifact Registry Writer` roles. |
| `GCP_PROJECT_ID`   | ID of your Google Cloud project.                        |
| `GCP_REGION`       | Region for Cloud Run (e.g. `europe-central2`).          |
| `DATABASE_URL`     | Connection string for your Cloud SQL or Supabase DB.    |
| `INSTANCE_CONNECTION_NAME` | Cloud SQL instance connection string (e.g. `project:region:instance`). |

During deployment, the `env_vars` property sets `DATABASE_URL`,
`INSTANCE_CONNECTION_NAME` and `NODE_ENV` inside the Cloud Run service.  If
you are using the Cloud SQL Auth Proxy or Node.js connector, you must
mount the proxy or configure the connector in your application code.

## Next steps

1. **Add application logic** – implement REST/GraphQL endpoints or a
   frontend using a framework of your choice.  The Prisma client will
   enable you to query and mutate data easily.
2. **Secure your secrets** – never commit database passwords or service
   account keys to Git.  Use GitHub repository secrets for all
   sensitive values.
3. **Monitor your deployments** – enable logging and error reporting
   through Google Cloud and Vercel dashboards.

With this repository structure you can rapidly iterate on your carpentry
platform, deploy previews for every pull request and move to a fully
managed Google Cloud stack when ready.