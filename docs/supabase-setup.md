# Supabase setup

The application expects a `public.profiles` table that stores per-user subscription metadata. Run the SQL below against a brand new Supabase project **before** starting the Next.js app so authenticated users can load their dashboard without errors.

> ℹ️ The same SQL lives in [`supabase/migrations/0001_create_profiles.sql`](../supabase/migrations/0001_create_profiles.sql) if you prefer applying it through the Supabase CLI.

## 1. Create the table, policies, and triggers

Run the full script in the Supabase SQL editor (or apply it through the CLI as described later). It will:

- create the `public.profiles` table linked to `auth.users`,
- enable row level security and policies so a user can read their own profile data,
- add triggers that default and guard the `subscription_expires_at` column, and
- insert a profile automatically whenever a new auth user is created.

```sql
-- Create the table that the Next.js app reads from.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  subscription_expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create index if not exists profiles_subscription_expires_at_idx
  on public.profiles (subscription_expires_at);

-- Ensure every signed-in user can read their own profile row.
create policy if not exists "Profiles are readable by their owner"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Allow future profile columns to be updated by the owner while
-- a trigger (defined below) keeps the subscription timestamp locked down.
create policy if not exists "Profiles are updatable by their owner"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Default the subscription expiry and timestamps whenever a row is inserted.
create or replace function public.profiles_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_at is null then
    new.created_at := timezone('utc', now());
  end if;

  new.updated_at := timezone('utc', now());

  if new.subscription_expires_at is null then
    -- Give each account an initial 14-day trial period.
    new.subscription_expires_at := timezone('utc', now()) + interval '14 days';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
  before insert on public.profiles
  for each row execute function public.profiles_set_defaults();

-- Prevent regular users from extending their own subscription timestamp
-- while still updating the audit column.
create or replace function public.profiles_lock_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := current_setting('request.jwt.claim.role', true);
begin
  new.updated_at := timezone('utc', now());

  -- Only service_role / supabase_admin (or direct SQL sessions without a JWT)
  -- may alter the subscription expiry timestamp.
  if jwt_role is not null and jwt_role not in ('service_role', 'supabase_admin') then
    new.subscription_expires_at := old.subscription_expires_at;
  elsif new.subscription_expires_at is null then
    new.subscription_expires_at := old.subscription_expires_at;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_lock_subscription on public.profiles;
create trigger profiles_lock_subscription
  before update on public.profiles
  for each row execute function public.profiles_lock_subscription();

-- Automatically create a profile row whenever Supabase adds an auth user.
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_for_profiles on auth.users;
create trigger on_auth_user_created_for_profiles
  after insert on auth.users
  for each row execute function public.handle_new_user_profile();
```

## 2. Apply the script with the Supabase CLI (optional)

If you prefer using migrations:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run `supabase login`.
2. Link your project in this repo directory:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Execute the bundled migration:
   ```bash
   supabase db push
   ```

The CLI will run every SQL file in [`supabase/migrations`](../supabase/migrations) against the linked project.

Once the script is applied, create an account through the app. A matching `public.profiles` row will be created automatically with a trial `subscription_expires_at`, letting the dashboard render the subscription warning banners correctly.
