insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public can read profile avatars" on storage.objects;
create policy "public can read profile avatars"
on storage.objects for select
using (bucket_id = 'profile-avatars');

drop policy if exists "users can upload own profile avatars" on storage.objects;
create policy "users can upload own profile avatars"
on storage.objects for insert
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users can update own profile avatars" on storage.objects;
create policy "users can update own profile avatars"
on storage.objects for update
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "users can delete own profile avatars" on storage.objects;
create policy "users can delete own profile avatars"
on storage.objects for delete
using (
  bucket_id = 'profile-avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
