# Supabase setup for CityFixAI

## Apply migrations
1. Create a Supabase project.
2. Run SQL in `supabase/migrations/` in order:
   - 20251125000000_init_schema.sql
   - 20251125000001_rls_policies.sql
   - 20251125000002_storage.sql
3. (Optional) Load demo data: run `supabase/seed.sql`.

## Environment
Backend (.env):
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-side only)
- SUPABASE_JWT_SECRET (optional, for local JWT verification)
- SUPABASE_STORAGE_BUCKET=cityfix-uploads

Mobile (.env):
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
Never ship service role key to mobile.

## Auth
Supabase Auth issues JWTs. FastAPI verifies tokens via /auth/v1/user when configured; otherwise falls back to local JWT for dev.

## RLS
All tables have RLS enabled. Citizens read public issues; insert own; update own while open; admins/moderators elevated.

## Storage
Bucket `civic-images` public read; authenticated users upload under their own folder `{user_id}/...`.
