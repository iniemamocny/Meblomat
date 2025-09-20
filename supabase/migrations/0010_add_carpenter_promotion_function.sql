-- Provide an RPC that lets verified clients upgrade themselves to the carpenter
-- role without weakening the existing profile protection triggers.

create or replace function public.promote_to_carpenter()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  current_account_type public.account_type;
  updated_account_type public.account_type;
  promoted boolean := false;
begin
  if caller_id is null then
    raise exception 'You must be authenticated to upgrade to the carpenter role.'
      using errcode = '42501';
  end if;

  select account_type
  into current_account_type
  from public.profiles
  where id = caller_id
  for update;

  if not found then
    raise exception 'A profile is required before upgrading to the carpenter role.'
      using errcode = 'P0002';
  end if;

  if current_account_type = 'carpenter'::public.account_type then
    return json_build_object(
      'promoted', false,
      'account_type', current_account_type
    );
  end if;

  if current_account_type <> 'client'::public.account_type then
    raise exception 'Only client accounts can be upgraded to the carpenter role.'
      using errcode = '42501';
  end if;

  perform set_config('meblomat.allow_carpenter_upgrade', 'true', true);

  update public.profiles
  set account_type = 'carpenter'::public.account_type
  where id = caller_id
  returning account_type into updated_account_type;

  promoted := updated_account_type = 'carpenter'::public.account_type;

  return json_build_object(
    'promoted', promoted,
    'account_type', updated_account_type
  );
end;
$$;

grant execute on function public.promote_to_carpenter() to authenticated, service_role;

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
  allow_carpenter_upgrade_override boolean := coalesce(current_setting('meblomat.allow_carpenter_upgrade', true), 'false') = 'true';
  allow_owner_admin_bootstrap boolean := allow_admin_bootstrap
    and is_owner
    and requested_account_type = 'admin'::public.account_type;
  allow_carpenter_upgrade boolean := (
      is_owner
      and old.account_type = 'client'::public.account_type
      and requested_account_type = 'carpenter'::public.account_type
    )
    or (
      allow_carpenter_upgrade_override
      and requested_account_type = 'carpenter'::public.account_type
    );
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
    elsif allow_carpenter_upgrade then
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
