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
