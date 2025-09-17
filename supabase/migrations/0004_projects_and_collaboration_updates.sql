-- Synchronize collaboration tables, invitation helpers, and project submission flows.

-- Rename legacy carpenter_projects table to a shared projects table.
alter table if exists public.carpenter_projects
  rename to projects;

alter index if exists carpenter_projects_carpenter_id_idx
  rename to projects_carpenter_id_idx;

alter index if exists carpenter_projects_client_id_idx
  rename to projects_client_id_idx;

-- Ensure the projects table matches the collaboration requirements.
create type if not exists public.project_status as enum ('submitted', 'in_progress', 'completed');

alter table if exists public.projects
  add column if not exists title text not null default 'New project';

alter table if exists public.projects
  add column if not exists details text;

alter table if exists public.projects
  add column if not exists status public.project_status not null default 'submitted';

alter table if exists public.projects
  add column if not exists submitted_by uuid references public.profiles(id);

alter table if exists public.projects
  add column if not exists submitted_at timestamptz not null default timezone('utc', now());

alter table if exists public.projects
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- Clean up defaults that are only used to backfill data.
alter table if exists public.projects
  alter column title drop default;

alter table if exists public.projects
  alter column status set default 'submitted';

create index if not exists projects_submitted_at_idx
  on public.projects (submitted_at desc);

-- Default and update triggers for projects.
create or replace function public.projects_set_defaults()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.submitted_at is null then
    new.submitted_at := timezone('utc', now());
  end if;

  if new.updated_at is null then
    new.updated_at := timezone('utc', now());
  end if;

  if new.status is null then
    new.status := 'submitted';
  end if;

  return new;
end;
$$;

create or replace function public.projects_touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists projects_set_defaults on public.projects;
create trigger projects_set_defaults
  before insert on public.projects
  for each row execute function public.projects_set_defaults();

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
  before update on public.projects
  for each row execute function public.projects_touch_updated_at();

-- Refresh RLS policies for projects so only participants have access.
alter table if exists public.projects enable row level security;

drop policy if exists "Carpenters and clients view shared projects" on public.projects;
drop policy if exists "Carpenters create shared projects" on public.projects;
drop policy if exists "Carpenters update shared projects" on public.projects;
drop policy if exists "Carpenters delete shared projects" on public.projects;

drop policy if exists "Clients update shared projects" on public.projects;

drop policy if exists "Clients submit projects" on public.projects;

drop policy if exists "Participants view their projects" on public.projects;
drop policy if exists "Participants manage their projects" on public.projects;

create policy if not exists "Participants view their projects"
  on public.projects
  for select
  using (
    carpenter_id = auth.uid()
    or client_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

create policy if not exists "Carpenters create projects"
  on public.projects
  for insert
  with check (
    carpenter_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type in ('carpenter', 'admin')
    )
  );

create policy if not exists "Carpenters update their projects"
  on public.projects
  for update
  using (
    carpenter_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  )
  with check (
    carpenter_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

create policy if not exists "Carpenters delete their projects"
  on public.projects
  for delete
  using (
    carpenter_id = auth.uid()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.account_type = 'admin'
    )
  );

-- Allow clients to submit project briefs through a helper function while keeping direct inserts scoped to carpenters.

-- Invitation validation helper that is callable without authentication.
create or replace function public.validate_carpenter_invitation(invitation_token uuid)
returns table (
  token uuid,
  carpenter_id uuid,
  carpenter_email text,
  invited_email text,
  expires_at timestamptz,
  accepted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_record public.carpenter_invitations%rowtype;
  carpenter_email text;
begin
  select *
  into invitation_record
  from public.carpenter_invitations
  where token = invitation_token
  limit 1;

  if not found then
    raise exception 'Invitation not found';
  end if;

  if invitation_record.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation expired';
  end if;

  select email
  into carpenter_email
  from auth.users
  where id = invitation_record.carpenter_id
  limit 1;

  return query
  select
    invitation_record.token,
    invitation_record.carpenter_id,
    carpenter_email,
    invitation_record.invited_email,
    invitation_record.expires_at,
    invitation_record.accepted_at;
end;
$$;

grant execute on function public.validate_carpenter_invitation(invitation_token uuid) to anon, authenticated;

-- Accept an invitation and ensure the client is linked to the carpenter.
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

  if invitation_record.accepted_at is not null then
    return query
    select invitation_record.carpenter_id, current_client;
  end if;

  if invitation_record.expires_at <= timezone('utc', now()) then
    raise exception 'Invitation expired';
  end if;

  insert into public.carpenter_clients (carpenter_id, client_id)
  values (invitation_record.carpenter_id, current_client)
  on conflict (carpenter_id, client_id) do nothing;

  update public.carpenter_invitations
  set accepted_at = timezone('utc', now())
  where token = invitation_token;

  return query
  select invitation_record.carpenter_id, current_client;
end;
$$;

grant execute on function public.accept_carpenter_invitation(invitation_token uuid) to authenticated;

-- Helper listing for carpenters to see their assigned clients with contact data.
create or replace function public.list_carpenter_clients()
returns table (
  client_id uuid,
  client_email text,
  avatar_type text,
  avatar_path text
)
language sql
security definer
set search_path = public
as $$
  select
    cc.client_id,
    au.email as client_email,
    p.avatar_type,
    p.avatar_path
  from public.carpenter_clients cc
  join public.profiles p
    on p.id = cc.client_id
  join auth.users au
    on au.id = cc.client_id
  where cc.carpenter_id = auth.uid();
$$;

grant execute on function public.list_carpenter_clients() to authenticated;

-- Helper for clients to fetch their assigned carpenter contact data.
create or replace function public.get_assigned_carpenter()
returns table (
  carpenter_id uuid,
  carpenter_email text,
  avatar_type text,
  avatar_path text
)
language sql
security definer
set search_path = public
as $$
  select
    cc.carpenter_id,
    au.email as carpenter_email,
    p.avatar_type,
    p.avatar_path
  from public.carpenter_clients cc
  join public.profiles p
    on p.id = cc.carpenter_id
  join auth.users au
    on au.id = cc.carpenter_id
  where cc.client_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_assigned_carpenter() to authenticated;

-- Directory for clients to browse active carpenters.
create or replace function public.list_active_carpenters()
returns table (
  carpenter_id uuid,
  carpenter_email text,
  avatar_type text,
  avatar_path text,
  subscription_expires_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    p.id as carpenter_id,
    au.email as carpenter_email,
    p.avatar_type,
    p.avatar_path,
    p.subscription_expires_at
  from public.profiles p
  join auth.users au
    on au.id = p.id
  where p.account_type = 'carpenter'
    and p.subscription_expires_at > timezone('utc', now());
$$;

grant execute on function public.list_active_carpenters() to authenticated;

-- Allow clients to submit project briefs and automatically create the assignment link.
create or replace function public.submit_project_brief(
  target_carpenter uuid,
  project_title text,
  project_details text
)
returns table (
  project_id uuid,
  carpenter_id uuid,
  client_id uuid,
  status public.project_status,
  submitted_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_client uuid;
  carpenter_record public.profiles%rowtype;
  inserted_project public.projects%rowtype;
begin
  current_client := auth.uid();

  if current_client is null then
    raise exception 'You must be signed in to submit a project.';
  end if;

  select *
  into carpenter_record
  from public.profiles
  where id = target_carpenter
    and account_type = 'carpenter'
    and subscription_expires_at > timezone('utc', now())
  limit 1;

  if not found then
    raise exception 'Selected carpenter is unavailable.';
  end if;

  insert into public.carpenter_clients (carpenter_id, client_id)
  values (target_carpenter, current_client)
  on conflict (carpenter_id, client_id) do nothing;

  insert into public.projects (carpenter_id, client_id, submitted_by, title, details)
  values (target_carpenter, current_client, current_client, coalesce(project_title, 'Project brief'), project_details)
  returning * into inserted_project;

  return query
  select inserted_project.id, inserted_project.carpenter_id, inserted_project.client_id, inserted_project.status, inserted_project.submitted_at;
end;
$$;

grant execute on function public.submit_project_brief(target_carpenter uuid, project_title text, project_details text) to authenticated;

-- Expand profile policies so collaborators can view relevant information.
drop policy if exists "Profiles are readable by their owner" on public.profiles;
create policy if not exists "Profiles are readable by their owner"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "Carpenters view assigned clients"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.carpenter_clients cc
      where cc.carpenter_id = auth.uid()
        and cc.client_id = public.profiles.id
    )
  );

create policy if not exists "Clients view assigned carpenter"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or exists (
      select 1
      from public.carpenter_clients cc
      where cc.client_id = auth.uid()
        and cc.carpenter_id = public.profiles.id
    )
  );

create policy if not exists "Authenticated users can view active carpenters"
  on public.profiles
  for select
  using (
    auth.uid() is not null
    and account_type = 'carpenter'
    and subscription_expires_at > timezone('utc', now())
  );

-- Ensure update policies still prevent privilege escalation.
create policy if not exists "Profiles are updatable by their owner"
  on public.profiles
  for update
  using (auth.uid() = id);
