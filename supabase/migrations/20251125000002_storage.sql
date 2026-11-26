-- Storage buckets & policies (PROMPT 10)
insert into storage.buckets (id, name, public)
values ('civic-images', 'civic-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Public read for civic-images
create policy "civic_images_public_read" on storage.objects
for select using (bucket_id = 'civic-images');

create policy "civic_images_auth_upload" on storage.objects
for insert with check (
  bucket_id = 'civic-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "civic_images_owner_update" on storage.objects
for update using (
  bucket_id = 'civic-images' and auth.uid()::text = (storage.foldername(name))[1]
) with check (
  bucket_id = 'civic-images' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "civic_images_owner_delete" on storage.objects
for delete using (
  bucket_id = 'civic-images' and auth.uid()::text = (storage.foldername(name))[1]
);

-- avatars
create policy "avatars_public_read" on storage.objects
for select using (bucket_id = 'avatars');

create policy "avatars_auth_upload" on storage.objects
for insert with check (
  bucket_id = 'avatars'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
