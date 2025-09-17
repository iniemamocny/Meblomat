-- Introduce account types and carpenter collaboration tables.

create extension if not exists "pgcrypto";

-- Ensure the enum type exists for account classifications.
do $$
begin
  create type public.account_type as enum ('carpenter', 'client', 'admin');
exception
  when duplicate_object then null;
end;
$$;

-- Add the account_type column with a default for newly inserted rows.
alter table public.profiles
  add column if not exists account_type public.account_type not null default 'client';

-- Backfill existing rows so the new NOT NULL constraint succeeds.
update public.profiles
set account_type = coalesce(account_type, 'client');

-- Refresh the defaulting trigger to cover the new column.
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
    new.subscription_expires_at := timezone('utc', now()) + interval '14 days';
  end if;

  if new.avatar_type is null then
    new.avatar_type := 'icon';
  end if;

  if new.avatar_path is null then
    new.avatar_path := 'user';
  end if;

  if new.account_type is null then
    new.account_type := 'client';
  end if;

  return new;
end;
$$;

-- Lock both the subscription expiry and account type from self-service escalation.
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

  if jwt_role is not null and jwt_role not in ('service_role', 'supabase_admin') then
    new.subscription_expires_at := old.subscription_expires_at;
    new.account_type := old.account_type;
  else
    if new.subscription_expires_at is null then
      new.subscription_expires_at := old.subscription_expires_at;
    end if;

    if new.account_type is null then
      new.account_type := old.account_type;
    end if;
  end if;

  return new;
end;
$$;

-- Recreate the triggers so the new function bodies are active.
drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
  before insert on public.profiles
  for each row execute function public.profiles_set_defaults();

drop trigger if exists profiles_lock_subscription on public.profiles;
create trigger profiles_lock_subscription
  before update on public.profiles
  for each row execute function public.profiles_lock_subscription();

-- Collaboration tables that link carpenters to clients and shared projects.
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

-- Enable row level security on the new tables.
alter table public.carpenter_invitations enable row level security;
alter table public.carpenter_clients enable row level security;
alter table public.carpenter_projects enable row level security;

-- Policies for carpenter_invitations.
create policy if not exists "Carpenters view their invitations"
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

create policy if not exists "Carpenters create invitations"
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

create policy if not exists "Carpenters update their invitations"
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

create policy if not exists "Carpenters delete their invitations"
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
create policy if not exists "Carpenters and clients view their link"
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

create policy if not exists "Carpenters manage their client links"
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

create policy if not exists "Carpenters update their client links"
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

create policy if not exists "Carpenters remove their client links"
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
create policy if not exists "Carpenters and clients view shared projects"
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

create policy if not exists "Carpenters create shared projects"
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

create policy if not exists "Carpenters update shared projects"
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

create policy if not exists "Carpenters delete shared projects"
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
