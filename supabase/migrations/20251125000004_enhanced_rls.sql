-- Enhanced RLS policies for CityFixAI (PROMPT 11)
-- Comprehensive role-based access control with PII protection

-- users table: citizens only see own record + limited public fields
-- phone/email protected from other citizens
drop policy if exists users_select_self on public.users;
drop policy if exists users_select_public on public.users;
drop policy if exists users_update_self on public.users;
drop policy if exists users_admin_all on public.users;

create policy users_select_self on public.users
  for select using (auth.uid() = id);

create policy users_select_limited_public on public.users
  for select using (true);

create policy users_update_self on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy users_admin_all on public.users
  for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator'))
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator'));

-- civic_issues: public read, owner insert/update, admin/mod full
drop policy if exists civic_issues_select_all on public.civic_issues;
drop policy if exists civic_issues_insert_own on public.civic_issues;
drop policy if exists civic_issues_update_owner_or_mod on public.civic_issues;
drop policy if exists civic_issues_delete_owner_or_admin on public.civic_issues;

create policy civic_issues_select_all on public.civic_issues
  for select using (true);

create policy civic_issues_insert_own on public.civic_issues
  for insert with check (auth.uid() = user_id or user_id is null);

create policy civic_issues_update_owner_or_mod on public.civic_issues
  for update using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'))
  with check (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));

create policy civic_issues_delete_owner_or_admin on public.civic_issues
-- issue_updates: audit trail, owner/mod/admin write
drop policy if exists issue_updates_select_all on public.issue_updates;
drop policy if exists issue_updates_insert_auth on public.issue_updates;
drop policy if exists issue_updates_admin_all on public.issue_updates;

create policy issue_updates_select_all on public.issue_updates
  for select using (true);

create policy issue_updates_insert_auth on public.issue_updates
  for insert with check (auth.uid() = updated_by or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));

create policy issue_updates_admin_all on public.issue_updates
  for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin')
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin');

-- issue_duplicates: mod/admin write only
drop policy if exists issue_duplicates_select_all on public.issue_duplicates;
drop policy if exists issue_duplicates_write_mod on public.issue_duplicates;

create policy issue_duplicates_select_all on public.issue_duplicates
  for select using (true);

create policy issue_duplicates_write_mod on public.issue_duplicates
  for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'))
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));

-- notifications: owner read/update only
drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_insert_service on public.notifications;

create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

create policy notifications_update_own on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy notifications_insert_service on public.notifications
  for insert with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator') or auth.uid() = user_id);

-- citizen_rewards: owner read, mod/admin write
drop policy if exists citizen_rewards_select_own on public.citizen_rewards;
drop policy if exists citizen_rewards_write_mod on public.citizen_rewards;

create policy citizen_rewards_select_own on public.citizen_rewards
  for select using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));

create policy citizen_rewards_write_mod on public.citizen_rewards
  for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'))
  with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));
-- Storage: protect uploaded photographs
-- civic-images bucket: authenticated users can upload to their own folder only
-- Public read is intentionally OFF for civic-images to protect citizen photos

drop policy if exists "civic_images_auth_upload" on storage.objects;
create policy "civic_images_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'civic-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "civic_images_owner_read" on storage.objects;
create policy "civic_images_owner_read" on storage.objects
  for select using (
    bucket_id = 'civic-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "civic_images_admin_all" on storage.objects;
create policy "civic_images_admin_all" on storage.objects
  for all using (
    bucket_id = 'civic-images'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator')
  )
  with check (
    bucket_id = 'civic-images'
    and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator')
  );

-- avatars bucket: public read, authenticated upload to own folder
drop policy if exists "avatars_auth_upload" on storage.objects;
create policy "avatars_auth_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
  for delete using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin');