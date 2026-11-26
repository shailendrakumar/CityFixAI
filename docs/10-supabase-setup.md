# Supabase Database & Authentication — Setup

## Overview
CityFixAI uses Supabase (PostgreSQL + Auth + Storage) with Row Level Security (RLS).
Service role keys are server-side only (FastAPI); mobile uses anon key.

## 1. Create Supabase project
- Create project in Supabase dashboard.
- Copy Project URL, anon key, service role key, JWT secret.

## 2. Apply SQL migrations
Run in Supabase SQL editor (in order):
1. `supabase/migrations/20251125000000_init_schema.sql`
2. `supabase/migrations/20251125000001_rls_policies.sql`
3. `supabase/migrations/20251125000002_storage.sql`

Optional demo data:
- `supabase/seed.sql` (synthetic, labelled `is_demo=true`)

## 3. Configure backend
`backend/.env`:
```
DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project>.supabase.co:5432/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon>
SUPABASE_SERVICE_ROLE_KEY=<service_role>  # server only
SUPABASE_JWT_SECRET=<jwt_secret>
SUPABASE_STORAGE_BUCKET=civic-images
DEMO_SEED_ENABLED=false
```

## 4. Configure mobile
`apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=https://api.cityfixai.example
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>
```
Never include service role key in mobile.

## 5. Auth flow
- Signup/Login via FastAPI `/auth/*` (proxies to Supabase Auth when configured).
- FastAPI verifies Supabase JWTs via `/auth/v1/user`.
- Roles stored in `app_metadata.role` and `public.users.role`.

## 6. RLS
- `civic_issues`: public read; authenticated insert own; owner/mod/admin update; owner/admin delete.
- `notifications`: owner read/update.
- `citizen_rewards`: owner or mod read; mod write.
- Storage: public read; authenticated upload to own folder.

## 7. Pagination & filtering
- `GET /reports` supports ward_id, category, status, severity_min, sort, cursor, offset, limit.
- DB indexes support filtering by ward/status/category/created_at/priority.

## 8. Security notes
- Service role key only in backend env.
- RLS prevents unauthorized data access even if anon key used.
- Mobile never receives service role key.
