-- Ensure invitation acceptance links the signed-in client even after the token was previously used.
create or replace function public.accept_carpenter_invitation(invitation_token uuid)
returns table (
  carpenter_id uuid,
  client_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.carpenter_invitations%rowtype;
  current_client uuid;
begin
  current_client := auth.uid();

  if current_client is null then
    raise exception 'You must be signed in to accept an invitation.';
  end if;

  select *
  into invitation_record
  from public.carpenter_invitations
  where token = invitation_token
  for update;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if invitation_record.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation expired';
  end if;

  insert into public.carpenter_clients (carpenter_id, client_id)
  values (invitation_record.carpenter_id, current_client)
  on conflict (carpenter_id, client_id) do nothing;

  if invitation_record.accepted_at is null then
    update public.carpenter_invitations
    set accepted_at = timezone('utc', now())
    where token = invitation_token;
  end if;

  return query
  select invitation_record.carpenter_id, current_client;
end;
$$;

grant execute on function public.accept_carpenter_invitation(invitation_token uuid) to authenticated;
