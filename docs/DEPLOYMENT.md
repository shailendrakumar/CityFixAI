# CityFixAI — Deployment Instructions

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## Prerequisites

- Node.js 20+ (LTS)
- Python 3.12+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g @expo/eas-cli`
- Vercel CLI: `npm install -g vercel`
- Supabase account (free tier sufficient)

## Infrastructure Setup

### 1. Supabase Project

1. Create project at <https://supabase.com>.
2. Note: Project URL, anon key, service role key, JWT secret.
3. Run SQL migrations in order:
   - `supabase/migrations/20251125000000_init_schema.sql`
   - `supabase/migrations/20251125000001_rls_policies.sql`
   - `supabase/migrations/20251125000002_storage.sql`
4. (Optional) Run `supabase/seed.sql` for demo data.

### 2. Backend Environment

```bash
cd backend
cp .env.example .env
# Fill in values:
# - DATABASE_URL=postgresql+asyncpg://postgres:<password>@db.<project>.supabase.co:5432/postgres
# - SUPABASE_URL=https://<project>.supabase.co
# - SUPABASE_ANON_KEY=<anon>
# - SUPABASE_SERVICE_ROLE_KEY=<service_role>
# - SUPABASE_JWT_SECRET=<jwt_secret>
# - SUPABASE_STORAGE_BUCKET=cityfix-uploads
# - OPENAI_API_KEY=sk-... (optional, enables vision AI)
# - AI_CONFIDENCE_THRESHOLD=0.7
# - ENVIRONMENT=development
```

### 3. Mobile Environment

```bash
cd apps/mobile
cp .env.example .env
# Fill in values:
# - EXPO_PUBLIC_API_URL=https://api.cityfixai.example
# - EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
# - EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>
# - NODE_ENV=development
```

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Mobile

```bash
cd apps/mobile
npm install
npx expo start
# Metro bundler starts at http://localhost:19006
# scanning QR code opens Expo Go on device or web
```

### Verification

```bash
# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"0.1.0","ai_mode":"heuristic",...}
```

## Production Deployment

### Backend (Vercel)

1. Connect GitHub repo to Vercel.
2. Set environment variables in Vercel dashboard (from `.env`).
3. Deploy: `vercel` or auto on `main` branch push.
4. Backend URL: `https://api.cityfixai.vercel.app`

### Mobile (Expo EAS)

1. Configure EAS in `app.json` and `eas.json`.
2. Build Android: `eas build -p android --profile preview`
3. Build iOS: `eas build -p ios --profile preview`
4. Deploy web: `expo prebuild && vercel deploy web/`
5. App URLs:
   - Android: `https://exp.host/...` or standalone build
   - iOS: same
   - Web: `https://cityfixai.vercel.app`

### CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — lint, typecheck, tests on all PRs
- `.github/workflows/deploy-web.yml` — deploy web to Vercel on `main` push
- `.github/workflows/deploy-mobile.yml` — build Android/iOS on `main` push
- `.github/workflows/deploy-backend.yml` — deploy FastAPI to Vercel on `main` push

## Verification

- Health check: `GET /health` → `{'status': 'ok', 'version': '0.1.0', ...}`
- API docs: visit `/docs` or `/openapi.json`
- Auth: test signup → login → access protected routes

## Full Local Stack

```bash
# 1. Start Supabase (local)
#   - Using Supabase CLI: supabase start
#   - Or use Supabase hosted project

# 2. Apply migrations
cd backend
supabase db reset  # or run SQL migrations manually

# 3. Seed demo data (optional)
#   - Set DEMO_SEED_ENABLED=true in .env
#   - uvicorn app.main:app --reload
#   - Visit /auth/signup to create account
#   - Or run: python -c "from app.services.seed import seed_demo; ..."

# 4. Start backend
uvicorn app.main:app --reload

# 5. Start mobile
npx expo start

# 6. Test offline-first flow
#   - Create report offline → synced when online
#   - Verify audit logs in Supabase
#   - Test workflow: POST /workflow/run
```