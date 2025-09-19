-- Store a durable referral token for each carpenter and expose a helper RPC.

create table if not exists public.carpenter_referrals (
  carpenter_id uuid primary key references public.profiles(id) on delete cascade,
  referral_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists carpenter_referrals_referral_token_key
  on public.carpenter_referrals (referral_token);

alter table public.carpenter_referrals enable row level security;

drop policy if exists "Carpenters view their referral token" on public.carpenter_referrals;
create policy "Carpenters view their referral token"
  on public.carpenter_referrals
  for select
  using (carpenter_id = auth.uid());

drop policy if exists "Carpenters create their referral token" on public.carpenter_referrals;
create policy "Carpenters create their referral token"
  on public.carpenter_referrals
  for insert
  with check (carpenter_id = auth.uid());

create or replace function public.get_carpenter_referral_link()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_carpenter uuid := auth.uid();
  referral_record public.carpenter_referrals%rowtype;
begin
  if current_carpenter is null then
    raise exception 'You must be signed in to request a referral link.';
  end if;

  perform 1
  from public.profiles p
  where p.id = current_carpenter
    and p.account_type = 'carpenter';

  if not found then
    raise exception 'Referral links are only available to carpenters.';
  end if;

  select *
  into referral_record
  from public.carpenter_referrals
  where carpenter_id = current_carpenter
  limit 1;

  if found then
    return referral_record.referral_token::text;
  end if;

  insert into public.carpenter_referrals (carpenter_id)
  values (current_carpenter)
  returning * into referral_record;

  return referral_record.referral_token::text;
end;
$$;

grant execute on function public.get_carpenter_referral_link() to authenticated;
