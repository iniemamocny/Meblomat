# Supabase setup

The application now differentiates between clients, carpenters, and admins through profile metadata and collaboration tables. Run the SQL below against a brand new Supabase project **before** starting the Next.js app so authenticated users can load their dashboard without errors.

> ℹ️ The same SQL lives in [`supabase/migrations`](../supabase/migrations) (including [`0003_add_account_type_and_carpenter_tables.sql`](../supabase/migrations/0003_add_account_type_and_carpenter_tables.sql) and [`0005_remove_avatar_metadata.sql`](../supabase/migrations/0005_remove_avatar_metadata.sql)) if you prefer applying it through the Supabase CLI.

## 1. Create the tables, policies, and triggers

Run the full script in the Supabase SQL editor (or apply it through the CLI as described later). It will:

- create the `public.profiles` table linked to `auth.users`, including an `account_type` column that defaults to `client`,
- enable row level security and policies so a user can read their own profile data,
- add triggers that default and guard the `subscription_expires_at` and `account_type` columns,
- insert a profile automatically whenever a new auth user is created,
- create collaboration tables for carpenter invitations, active client links, and shared projects, and
- apply row level security policies so carpenters manage their own data, clients can read their assignments, and admins retain full access.

```sql
-- Extensions and enumerations used by the collaboration tables.
create extension if not exists "pgcrypto";

do $$
begin
  create type public.account_type as enum ('carpenter', 'client', 'admin');
exception
  when duplicate_object then null;
end;
$$;

-- Create the table that the Next.js app reads from.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  subscription_expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  account_type public.account_type not null default 'client'
);

alter table public.profiles
  add column if not exists account_type public.account_type not null default 'client';

-- Populate existing rows so new NOT NULL constraints succeed.
update public.profiles
set
  account_type = coalesce(account_type, 'client');

alter table public.profiles enable row level security;

create index if not exists profiles_subscription_expires_at_idx
  on public.profiles (subscription_expires_at);

drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy "Profiles are readable by their owner"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Allow future profile columns to be updated by the owner while
-- a trigger (defined below) keeps the subscription timestamp locked down.
drop policy if exists "Profiles are updatable by their owner" on public.profiles;
create policy "Profiles are updatable by their owner"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Default the subscription expiry, timestamps, and account type whenever a row is inserted.
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

  if new.account_type is null then
    new.account_type := 'client';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
  before insert on public.profiles
  for each row execute function public.profiles_set_defaults();

-- Allow a freshly verified user to claim the administrator role when no other
-- admins exist, and adjust the profile update trigger so the RPC can perform
-- the promotion without weakening the existing guards.
create or replace function public.bootstrap_admin(promote boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  admin_count bigint := 0;
  promoted boolean := false;
  allow_promotion boolean := promote;
  bootstrap_lock_key bigint := hashtext('meblomat:bootstrap_admin')::bigint;
begin
  if allow_promotion then
    if caller_id is null then
      raise exception 'You must be authenticated to claim the administrator role.'
        using errcode = '42501';
    end if;

    -- Serialise concurrent attempts so only one caller can bootstrap the
    -- administrator role at a time.
    perform pg_advisory_xact_lock(bootstrap_lock_key);
  end if;

  select count(*)
  into admin_count
  from public.profiles
  where account_type = 'admin'::public.account_type;

  if allow_promotion and admin_count = 0 then
    perform set_config('meblomat.allow_admin_bootstrap', 'true', true);

    update public.profiles
    set account_type = 'admin'::public.account_type
    where id = caller_id;

    if not found then
      raise exception 'A profile is required before claiming the administrator role.'
        using errcode = 'P0002';
    end if;

    promoted := true;

    select count(*)
    into admin_count
    from public.profiles
    where account_type = 'admin'::public.account_type;
  end if;

  return json_build_object(
    'admin_count', admin_count,
    'promoted', promoted
  );
end;
$$;

grant execute on function public.bootstrap_admin(boolean) to anon, authenticated, service_role;

-- Prevent regular users from extending their own subscription timestamp or promoting themselves
-- while still updating the audit column.
create or replace function public.profiles_lock_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  jwt_role text := current_setting('request.jwt.claim.role', true);
  is_privileged boolean := jwt_role in ('service_role', 'supabase_admin');
  requested_account_type public.account_type := coalesce(new.account_type, old.account_type);
  is_owner boolean := auth.uid() = new.id;
  allow_admin_bootstrap boolean := coalesce(current_setting('meblomat.allow_admin_bootstrap', true), 'false') = 'true';
  allow_owner_admin_bootstrap boolean := allow_admin_bootstrap
    and is_owner
    and requested_account_type = 'admin'::public.account_type;
  allow_owner_carpenter_upgrade boolean := is_owner
    and old.account_type = 'client'::public.account_type
    and requested_account_type = 'carpenter'::public.account_type;
begin
  new.updated_at := timezone('utc', now());

  if not is_privileged then
    new.subscription_expires_at := old.subscription_expires_at;
  elsif new.subscription_expires_at is null then
    new.subscription_expires_at := old.subscription_expires_at;
  end if;

  if new.account_type is null then
    new.account_type := old.account_type;
  end if;

  if not is_privileged then
    if allow_owner_admin_bootstrap then
      new.account_type := 'admin'::public.account_type;
    elsif allow_owner_carpenter_upgrade then
      new.account_type := 'carpenter'::public.account_type;
    else
      new.account_type := old.account_type;
    end if;
  elsif new.account_type is null then
    new.account_type := old.account_type;
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

-- Collaboration tables for carpenters and their clients.
create table if not exists public.carpenter_invitations (
  token uuid primary key default gen_random_uuid(),
  carpenter_id uuid not null references public.profiles(id) on delete cascade,
  invited_email text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists carpenter_invitations_carpenter_id_idx
  on public.carpenter_invitations (carpenter_id);

create table if not exists public.carpenter_clients (
  id uuid primary key default gen_random_uuid(),
  carpenter_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique (carpenter_id, client_id)
);

create index if not exists carpenter_clients_carpenter_id_idx
  on public.carpenter_clients (carpenter_id);

create index if not exists carpenter_clients_client_id_idx
  on public.carpenter_clients (client_id);

create table if not exists public.carpenter_projects (
  id uuid primary key default gen_random_uuid(),
  carpenter_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Shared project',
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists carpenter_projects_carpenter_id_idx
  on public.carpenter_projects (carpenter_id);

create index if not exists carpenter_projects_client_id_idx
  on public.carpenter_projects (client_id);

alter table public.carpenter_invitations enable row level security;
alter table public.carpenter_clients enable row level security;
alter table public.carpenter_projects enable row level security;

-- Policies for carpenter invitations.
drop policy if exists "Carpenters view their invitations" on public.carpenter_invitations;
create policy "Carpenters view their invitations"
  on public.carpenter_invitations
  for select
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters create invitations" on public.carpenter_invitations;
create policy "Carpenters create invitations"
  on public.carpenter_invitations
  for insert
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters update their invitations" on public.carpenter_invitations;
create policy "Carpenters update their invitations"
  on public.carpenter_invitations
  for update
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  )
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters delete their invitations" on public.carpenter_invitations;
create policy "Carpenters delete their invitations"
  on public.carpenter_invitations
  for delete
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

-- Policies for carpenter/client links.
drop policy if exists "Carpenters and clients view their link" on public.carpenter_clients;
create policy "Carpenters and clients view their link"
  on public.carpenter_clients
  for select
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or client_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters manage their client links" on public.carpenter_clients;
create policy "Carpenters manage their client links"
  on public.carpenter_clients
  for insert
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters update their client links" on public.carpenter_clients;
create policy "Carpenters update their client links"
  on public.carpenter_clients
  for update
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  )
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters remove their client links" on public.carpenter_clients;
create policy "Carpenters remove their client links"
  on public.carpenter_clients
  for delete
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

-- Policies for shared projects.
drop policy if exists "Carpenters and clients view shared projects" on public.carpenter_projects;
create policy "Carpenters and clients view shared projects"
  on public.carpenter_projects
  for select
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or client_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters create shared projects" on public.carpenter_projects;
create policy "Carpenters create shared projects"
  on public.carpenter_projects
  for insert
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters update shared projects" on public.carpenter_projects;
create policy "Carpenters update shared projects"
  on public.carpenter_projects
  for update
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  )
  with check (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

drop policy if exists "Carpenters delete shared projects" on public.carpenter_projects;
create policy "Carpenters delete shared projects"
  on public.carpenter_projects
  for delete
  using (
    (
      carpenter_id = auth.uid()
      and exists (
        select 1
        from public.profiles carpenter_profile
        where carpenter_profile.id = auth.uid()
          and carpenter_profile.account_type = 'carpenter'
      )
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );
```

Once the tables exist, the [`public.bootstrap_admin`](../supabase/migrations/0009_add_admin_bootstrap_function.sql) RPC reports the current number of administrator accounts and allows the first verified user to claim the sole admin slot. The Next.js registration form calls this function to expose an "Administrator" radio button while `admin_count` is zero. After email verification, the app invokes `public.bootstrap_admin(promote := true)` to set the caller’s `account_type` to `admin` and immediately clears the temporary metadata so future sign-ups cannot reuse the elevated role.

### Manually bootstrap the first administrator

If you prefer to bootstrap the administrator manually, walk through these steps in the Supabase SQL editor after the migration finishes running:

1. **Check whether an administrator already exists.**

   ```sql
   select public.bootstrap_admin();
   ```

   A brand-new project returns a payload similar to `{ "admin_count": 0, "promoted": false }`. If `admin_count` is already greater than zero, the first administrator has been claimed and you can skip the remaining steps.

2. **Ensure the target user is verified.** If the account has not been confirmed yet, update `auth.users.email_confirmed_at` so the impersonated profile matches what the production onboarding flow expects:

   ```sql
   -- Replace the UUID with the same verified user's id before running the update.
   update auth.users
   set email_confirmed_at = now()
   where id = '00000000-0000-0000-0000-000000000000';
   ```

   Skip this update if the row already has a timestamp—Supabase only allows verified accounts to claim the administrator role.

3. **Impersonate the verified user and promote them.** Supabase resolves `auth.uid()` using JWT claims, so temporarily impersonate the account before calling the RPC:

   ```sql
   -- Replace the UUID with the verified user's id before running the block.
   set request.jwt.claim.role = 'authenticated';
   set request.jwt.claim.sub = '00000000-0000-0000-0000-000000000000';

   -- Verify the impersonation succeeded; this should echo the UUID above.
   select auth.uid();

   -- Promote the impersonated caller if no administrators exist yet.
   select public.bootstrap_admin(true);

   -- Clean up the temporary claims so future queries run as an anonymous session.
   reset request.jwt.claim.role;
   reset request.jwt.claim.sub;
   ```

   > ⚠️ Highlight the entire block above (from the first `set` through the `reset` statements) before clicking **Run** in the SQL editor. Supabase may recycle the session between individual executions, which clears the temporary claims and leaves `auth.uid()` empty.

   When the RPC succeeds it returns `{ "admin_count": 1, "promoted": true }`, confirming that the impersonated user now owns the sole administrator slot.

   If you are already signed in as the verified user inside the SQL editor, you can call the RPC directly without impersonating them first:

   ```sql
   -- For a verified session, promote the caller if the count is still zero.
   select public.bootstrap_admin(true);
   ```

If you see `ERROR: 42501: You must be authenticated to claim the administrator role`, double-check that you replaced the UUID, ran the impersonation block in a single execution, and confirmed the account's email before calling `public.bootstrap_admin(true)`.

Once the first admin is established, the RPC keeps returning a non-zero `admin_count`, the registration form hides the option, and all subsequent promotions must be performed through privileged service-role access.

## 2. Apply the script with the Supabase CLI (optional)

If you prefer using migrations:

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and run `supabase login`.
2. Link your project in this repo directory:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```
3. Execute the bundled migrations:
   ```bash
   supabase db push
   ```

The CLI will run every SQL file in [`supabase/migrations`](../supabase/migrations)—including `0005_remove_avatar_metadata.sql`, which cleans up the now-retired avatar columns for projects that applied earlier revisions—against the linked project.

Once the script is applied, create an account through the app. A matching `public.profiles` row will be created automatically with a trial `subscription_expires_at`, letting the dashboard render the subscription warning banners correctly. Carpenters can invite clients and track shared projects immediately after provisioning.
