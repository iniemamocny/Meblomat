-- Add avatar metadata to profiles.
alter table public.profiles
  add column if not exists avatar_type text not null default 'icon';

alter table public.profiles
  add column if not exists avatar_path text not null default 'user';

-- Populate existing rows so new NOT NULL constraints succeed.
update public.profiles
set
  avatar_type = coalesce(avatar_type, 'icon'),
  avatar_path = coalesce(avatar_path, 'user');

-- Ensure inserts still derive consistent defaults.
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

  return new;
end;
$$;

-- Recreate the trigger so the new function body is active.
drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
  before insert on public.profiles
  for each row execute function public.profiles_set_defaults();
