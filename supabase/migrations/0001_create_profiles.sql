-- Supabase schema required by the Next.js app
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  subscription_expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create index if not exists profiles_subscription_expires_at_idx
  on public.profiles (subscription_expires_at);

create policy if not exists "Profiles are readable by their owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "Profiles are updatable by their owner"
  on public.profiles
  for update
  using (auth.uid() = id);

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

  return new;
end;
$$;

drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
  before insert on public.profiles
  for each row execute function public.profiles_set_defaults();

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
