-- Security hardening (PROMPT 11)
-- Ensure RLS is enabled on all public tables.
alter table public.users enable row level security;
alter table public.wards enable row level security;
alter table public.civic_issues enable row level security;
alter table public.issue_updates enable row level security;
alter table public.issue_duplicates enable row level security;
alter table public.notifications enable row level security;
alter table public.citizen_rewards enable row level security;

-- Revoke direct anon access to PII-heavy tables; authenticated users only via policies.
revoke all on public.users from anon;
revoke all on public.notifications from anon;
revoke all on public.citizen_rewards from anon;

-- Storage: keep public read for civic images but restrict writes to owner folders.
-- (Already defined in 20251125000002_storage.sql; re-assert.)
drop policy if exists "civic_images_auth_upload" on storage.objects;
create policy "civic_images_auth_upload" on storage.objects
for insert with check (
  bucket_id = 'civic-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Data retention: soft-delete helper (application-level). No automatic purge here;
-- backend job should delete rows older than configured retention window.