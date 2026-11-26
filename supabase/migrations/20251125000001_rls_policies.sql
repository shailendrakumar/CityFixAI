-- RLS policies for CityFixAI (PROMPT 10)
alter table public.users enable row level security;
alter table public.wards enable row level security;
alter table public.civic_issues enable row level security;
alter table public.issue_updates enable row level security;
alter table public.issue_duplicates enable row level security;
alter table public.notifications enable row level security;
alter table public.citizen_rewards enable row level security;

-- users
create policy users_select_self on public.users for select using (auth.uid() = id);
create policy users_update_self on public.users for update using (auth.uid() = id) with check (auth.uid() = id);
create policy users_admin_all on public.users for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator')) with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') in ('admin','moderator'));

-- wards (public read)
create policy wards_select_all on public.wards for select using (true);
create policy wards_admin_write on public.wards for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') = 'admin') with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'citizen') = 'admin');

-- civic_issues (public read)
create policy civic_issues_select_all on public.civic_issues for select using (true);
create policy civic_issues_insert_own on public.civic_issues for insert with check (auth.uid() = user_id or user_id is null);
create policy civic_issues_update_owner_or_mod on public.civic_issues for update using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator')) with check (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));
create policy civic_issues_delete_owner_or_admin on public.civic_issues for delete using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin');

-- issue_updates
create policy issue_updates_select_all on public.issue_updates for select using (true);
create policy issue_updates_insert_auth on public.issue_updates for insert with check (auth.uid() = updated_by or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));
create policy issue_updates_admin_all on public.issue_updates for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin') with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') = 'admin');

-- issue_duplicates
create policy issue_duplicates_select_all on public.issue_duplicates for select using (true);
create policy issue_duplicates_write_mod on public.issue_duplicates for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator')) with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));

-- notifications
create policy notifications_select_own on public.notifications for select using (auth.uid() = user_id);
create policy notifications_update_own on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy notifications_insert_service on public.notifications for insert with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator') or auth.uid() = user_id);

-- citizen_rewards
create policy citizen_rewards_select_own on public.citizen_rewards for select using (auth.uid() = user_id or coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));
create policy citizen_rewards_write_mod on public.citizen_rewards for all using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator')) with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role','citizen') in ('admin','moderator'));
