-- Provision the avatars Storage bucket and policies without relying on the
-- storage.create_bucket helper, which is missing on some Supabase instances.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false)
on conflict (id) do nothing;

drop policy if exists "Avatar files are readable by their owner" on storage.objects;
create policy "Avatar files are readable by their owner"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

drop policy if exists "Avatar files are uploaded by their owner" on storage.objects;
create policy "Avatar files are uploaded by their owner"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

drop policy if exists "Avatar files are replaceable by their owner" on storage.objects;
create policy "Avatar files are replaceable by their owner"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );

drop policy if exists "Avatar files are removable by their owner" on storage.objects;
create policy "Avatar files are removable by their owner"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid() = owner
  );
