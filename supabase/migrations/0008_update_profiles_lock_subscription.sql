-- Allow profile owners to upgrade themselves to carpenters while keeping
-- subscription locking and privilege guards in place.
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
    if allow_owner_carpenter_upgrade then
      new.account_type := 'carpenter'::public.account_type;
    else
      new.account_type := old.account_type;
    end if;
  elsif new.account_type is null then
    new.account_type := old.account_type;
  end if;

  if not is_privileged and requested_account_type = 'admin'::public.account_type then
    new.account_type := old.account_type;
  end if;

  return new;
end;
$$;

-- Ensure the trigger picks up the latest definition.
drop trigger if exists profiles_lock_subscription on public.profiles;
create trigger profiles_lock_subscription
  before update on public.profiles
  for each row execute function public.profiles_lock_subscription();
