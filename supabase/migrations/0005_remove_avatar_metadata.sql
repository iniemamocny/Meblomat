-- Remove legacy avatar metadata from profiles and collaboration helpers.

-- Ensure profile triggers no longer reference avatar columns.
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

  if new.account_type is null then
    new.account_type := 'client';
  end if;

  return new;
end;
$$;

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

-- Update helper functions so they only expose identifiers and contact data.
create or replace function public.list_carpenter_clients()
returns table (
  client_id uuid,
  client_email text
)
language sql
security definer
set search_path = public
as $$
  select
    cc.client_id,
    au.email as client_email
  from public.carpenter_clients cc
  join auth.users au
    on au.id = cc.client_id
  where cc.carpenter_id = auth.uid();
$$;

grant execute on function public.list_carpenter_clients() to authenticated;

create or replace function public.get_assigned_carpenter()
returns table (
  carpenter_id uuid,
  carpenter_email text
)
language sql
security definer
set search_path = public
as $$
  select
    cc.carpenter_id,
    au.email as carpenter_email
  from public.carpenter_clients cc
  join auth.users au
    on au.id = cc.carpenter_id
  where cc.client_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_assigned_carpenter() to authenticated;

create or replace function public.list_active_carpenters()
returns table (
  carpenter_id uuid,
  carpenter_email text,
  subscription_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as carpenter_id,
    au.email as carpenter_email,
    p.subscription_expires_at
  from public.profiles p
  join auth.users au
    on au.id = p.id
  where p.account_type = 'carpenter'
    and p.subscription_expires_at > timezone('utc', now());
$$;

grant execute on function public.list_active_carpenters() to authenticated;

-- Finally drop the unused avatar columns if they are still present.
alter table if exists public.profiles
  drop column if exists avatar_type;

alter table if exists public.profiles
  drop column if exists avatar_path;
