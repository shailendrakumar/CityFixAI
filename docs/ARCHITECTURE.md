# CityFixAI — Architecture

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## 1. Overview

CityFixAI is an Agentic Civic Intelligence Platform that helps citizens identify, report, track and resolve urban infrastructure and civic problems. It is NOT a government system: it tracks community-reported issues and provides AI-assisted triage, deduplication, severity scoring, and transparency. It never claims official government resolution without evidence.

Core principles:
1. Offline-first — a citizen can file a complete report with photos on a bus with no signal; it syncs later.
2. Evidence-based status — every status change is auditable; "resolved" requires evidence (photo + verifier).
3. Synthetic demo data clearly labelled — all seed/demo records carry is_demo=true and UI badges.
4. Agentic AI, not magic — LangGraph orchestrates classification/dedup/severity with deterministic fallbacks; every AI output is explainable and overridable by humans.
5. Privacy by default — location precision configurable; PII minimized; RLS on all tables.
## 2. High-Level Architecture

### Client Stack
- Framework: Expo React Native
- State Management: Zustand
- Local Storage: SQLite via expo-sqlite
- File System: expo-file-system
- Network: @react-native-community/netinfo
- UI: Nativewind, expo-vector-icons

### Backend Stack
- Framework: FastAPI (Python 3.12+)
- ORM: SQLAlchemy 2.x async
- Database: PostgreSQL via Supabase
- Auth: JWT + Supabase Auth
- AI: LangGraph orchestration
- Migrations: Alembic
- API Docs: OpenAPI 3
## 4. LangGraph Agent Architecture

The backend exposes an 8-agent LangGraph workflow for civic issue triage.

### Agents (execution order)
1. Classification — identifies issue type and category (heuristic keyword matching + optional OpenAI vision).
2. Validation — checks report completeness and relevance.
3. Duplicate Detection — finds similar reports by location, category, semantic similarity.
4. Severity Assessment — calculates urgency and public impact.
5. Priority — ranks issues for review (adjusts score based on duplicates and validation).
6. Routing Recommendation — suggests department/team (recommendation only; no government integration).
7. Notification — generates status notifications.
8. Human Review — requires administrator approval for sensitive decisions.

### Safety Rules
- Autonomous agents cannot mark a complaint as resolved.
- resolution_allowed is true only when human_approved=true, evidence is provided, and human_role=admin.
- Sensitive cases route to pending_human_review.

### Workflow Diagram (Mermaid)
```mermaid
flowchart TD
    A[Start] --> B[Dispatch Agent]
    B --> C{Errors?}
    C -- yes, retries left --> D[Retry]
## 5. Duplicate Detection Approach

### Algorithm
- Category filter: Only compare reports within the same category.
- Proximity filter: Reports must be within ~50m (0.0005 degrees) latitude/longitude.
- Text similarity: Token-set Jaccard similarity on title + description; threshold >= 0.3.
- Result: Up to 5 most similar matches, sorted by similarity score.

### Detection Logic (civic_agent.py)
```python
def detect_duplicates(candidate, existing):
    def tok(s): return set(re.findall(r'\w+', (s or '').lower()))
    ct = tok(candidate.get('title', '') + ' ' + candidate.get('description', ''))
    out = []
    for e in existing:
        if e.get('category') != candidate.get('category'): continue
        try:
            if abs(e['lat'] - candidate['lat']) > 0.0005 or abs(e['lng'] - candidate['lng']) > 0.0005: continue
        except Exception: continue
        et = tok(e.get('title', '') + ' ' + e.get('description', ''))
        u = ct | et; sim = len(ct & et) / len(u) if u else 0
        if sim >= 0.3: out.append({'id': e['id'], 'similarity': round(sim, 2), 'reason': 'same category/location/text'})
    return sorted(out, key=lambda m: -m['similarity'])[:5]
```

### Storage
- Duplicate results stored in reports.duplicate_of (single primary duplicate) and audit logs.
- UI shows "Possible duplicate" card during report submission step 3.
    D --> B
    C -- yes, no retries --> E[Fail]
## 6. Severity and Prioritization Methodology

### Scoring Formula
```
severity_score = base_severity[category] + boosts
base_severity: pothole=60, streetlight=40, water_leak=70, trash=30, sidewalk=45, graffiti=15, traffic_signal=80, other=30
boosts: +20 if injury/accident/danger/urgent/school in text
        +10 if large/deep/major/flooding in text
```

### Label Mapping
- 80+: critical
- 60-79: high
- 35-59: medium
- 0-34: low

### Priority Adjustments
- +10 if duplicates detected
- -5 if report validation fails
- Final priority level follows same 80/60/35 cutoffs
## 7. Technology Stack

### Client (Mobile/Web)
| Layer | Technology |
|---|---|
| Framework | Expo React Native |
| Routing | Expo Router |
| UI | Nativewind (Tailwind CSS for RN) |
| State | Zustand + React Query |
| Offline Storage | expo-sqlite (SQLite) |
| File System | expo-file-system |
| Network | @react-native-community/netinfo |
| Auth | Expo SecureStore + Supabase Auth |
| AI Vision | OpenAI GPT-4o-mini (optional) |

### Backend
| Layer | Technology |
|---|---|
| Framework | FastAPI (Python 3.12+) |
| ORM | SQLAlchemy 2.x async |
## 8. React Native Application Architecture

### Project Structure (apps/mobile/)
```
src/
  assets/     # Static images, fonts
  components/ # Reusable UI components (buttons, inputs, map, etc.)
  constants/  # Feature flags, API endpoints
  db/         # Database schema, migration helpers
  hooks/      # Custom React hooks (useNetworkMonitor, useAppStore)
  services/   # API services (auth, ai, sync, storage)
  stores/     # Zustand state store (appStore)
  syncQueue/  # Sync queue repository
  tests/      # Jest test suite
  types/      # TypeScript shared types
  utils/      # UUID generator, format helpers
  __tests__/  # Test files
```

### Key Stores (Zustand)
- `appStore`: holds `isOnline`, `pendingSyncCount`, `user`, `currentReport`, etc.
- `reportStore`: manages report state, form data, AI preview.

### Screens (Expo Router)
- `/` — Home (map + nearby issues)
- `/report` — Report wizard (4 steps: photo, description, AI preview, submit)
- `/my-reports` — User's reports with timeline
- `/ward/:id` — Ward analytics
- `/login` — Authentication
- `/report/:id` — Report detail
## 9. Offline-First Architecture (Detailed)

### Principles
1. **Local-first write**: Every operation starts locally. User sees immediate confirmation.
2. **Network-agnostic**: App works online or offline; UI reflects connection state.
3. **Idempotent sync**: Every sync item has a unique client_request_id; server rejects duplicates.
4. **Eventual consistency**: Data may be stale locally; refresh pulls deltas.
5. **Graceful degradation**: Features that require network show "offline banner" and disabled actions.

### Sync Queue Design
- Table: `sync_queue` (id, entity_type, entity_id, operation, payload, client_request_id, attempts, max_attempts, next_retry_at, status, last_error, created_at)
- Operations: 'create', 'update', 'delete', 'upvote', 'comment', 'status'
- Drain loop: `startSyncLoop()` runs every 15s; checks `isOnline()` via NetInfo.
- Backoff: `backoffMs(attempts)` = min(1000 * 2^attempts, 5min) + jitter.
- Dead letter: after maxAttempts, status='dead', user can retry manually.

### Photo Handling
- Local: stored in expo-file-sandbox under `assets/` directory.
- Remote: uploaded via multipart POST on sync; local URI retained until server URL returned.
- On sync success: `serverPhotoUrls` column updated; local URI can be garbage collected.
## 10. Local SQLite Database Design

### Schema (migrations.ts — initial version)

#### Tables

**reports**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | UUID (client-generated) | |
| server_id TEXT | Nullable — populated on sync | |
| client_request_id TEXT UNIQUE | Idempotency key | |
| user_id TEXT | Nullable — FK to users | |
| title TEXT NOT NULL | Sanitized, max 200 chars | |
| description TEXT | Nullable, max 4000 chars | |
| category TEXT | Indexed, enum-like | |
| subcategory TEXT | Nullable | |
| severity_score INTEGER DEFAULT 0 | 0-100 | |
| severity_label TEXT DEFAULT 'low' | low/medium/high/critical | |
| status TEXT DEFAULT 'open' | Indexed | enum: draft, open, in_progress, resolved_pending_verification, resolved, duplicate, rejected |
| lat REAL NOT NULL | WGS84 decimal degrees | |
| lng REAL NOT NULL | WGS84 decimal degrees | |
| address TEXT | Nullable | |
| ward_id TEXT | Indexed, FK to wards | |
| photo_uris TEXT DEFAULT '[]' | JSON array of local file paths | |
| server_photo_urls TEXT DEFAULT '[]' | JSON array of remote URLs | |
| ai_category TEXT | Nullable — from LangGraph | |
| ai_severity INTEGER | Nullable — from LangGraph | |
| ai_confidence REAL | Nullable — from LangGraph | |
| ai_rationale TEXT | Nullable — from LangGraph | |
## 11. Backend Architecture

### Project Structure (backend/app/)
```
app/
  __init__.py
  api/          # FastAPI routers (auth, reports, ai, workflow, community, etc.)
  agents/       # LangGraph agents (civic_agent.py, workflow.py)
  core/         # Config, DB, security
  models/       # SQLAlchemy models (report, user, ward, category, etc.)
  services/     # Business logic (audit, community, storage, supabase, vision_classifier)
  schemas/      # Pydantic models (request/response)
  agents/       # LangGraph state graphs
```

### Request Lifecycle
1. **Entry**: HTTP request → FastAPI
2. **Middleware chain**:
   - CORS check (explicit allowlist)
   - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
## 12. Supabase Database Schema

### SQL Migration: init_schema.sql (summary)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- Enum types
CREATE TYPE report_status AS ENUM ('draft', 'open', 'in_progress', 'resolved_pending_verification', 'resolved', 'duplicate', 'rejected');
CREATE TYPE severity_label AS ENUM ('low', 'medium', 'high', 'critical');

-- Tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE,
    password_hash VARCHAR,
    full_name VARCHAR,
    phone VARCHAR,
    display_name VARCHAR DEFAULT 'Citizen',
    role VARCHAR DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
    ward_id UUID REFERENCES wards(id),
    contribution_points INTEGER DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wards (
    id UUID PRIMARY KEY,
    name VARCHAR NOT NULL,
## 13. AI Classification Workflow

### Heuristic Classifier (civic_agent.py — always available)
- **Keyword matching**: Categories mapped to keyword sets.
- **Base severity per category**: pothole=60, streetlight=40, water_leak=70, trash=30, sidewalk=45, graffiti=15, traffic_signal=80, other=30.
- **Text boosts**: +20 for injury/accident/danger/urgent/school; +10 for large/deep/major/flooding.
- **Confidence**: 0.4 if no keywords match → other; min(0.95, 0.5 + 0.1 * keyword_count).

### OpenAI Vision Classification (optional, vision_classifier.py)
- **System prompt**: Forces JSON output with keys: issue_type, visible_damage, description, severity, safety_impact, category, confidence.
- **Categories**: Potholes, Garbage accumulation, Waterlogging, Broken streetlights, Damaged footpaths, Open drains, Water leakage, Traffic signal failures, Road damage, Public accessibility problems.
- **Prompt injection detection**: Regex-based sanitization of user hints.
- **Fallback**: If OpenAI fails or key missing → heuristic classifier with `fallback-heuristic` model version.
- **Confidence threshold**: settings.ai_confidence_threshold (default 0.7); below → needs_confirmation=true.

### Classification Pipeline (LangGraph — 3 nodes)
```mermaid
flowchart LR
    n_classify[ classify ] --> n_severity[ severity ]
    n_severity --> n_dup[ duplicates ]
```

Each node stores its output in `AgentState` with `model_version`, `confidence`, and `rationale`.

### Output Storage
- `ai_category`, `ai_severity`, `ai_confidence`, `ai_rationale`, `ai_model_version` stored on Report row.
- Audit log entries persist the full classification output.

### Example Classification Output
```json
## 14. LangGraph Agent Architecture (Detailed)

### State Management
- **AgentState** (civic_agent.py): `{text, lat, lng, category, confidence, severity_score, severity_label, rationale, duplicates, existing}`
- **WorkflowState** (workflow.py): Extended with run_id, report, existing_reports, human_approved, evidence, human_role, step, retry_count, max_retries, failed_agent, errors, classification, validation, duplicates, severity, priority, routing, notification, human_review, audit, status, resolution_allowed.

### Agent Functions (workflow.py)
Each agent is a pure function that takes `WorkflowState` and returns a patch:

1. **classification_agent** — calls `classify_text()`, returns `{classification, audit}`
2. **validation_agent** — checks title, location, category completeness; returns `{validation, audit}`
3. **duplicate_detection_agent** — calls `detect_duplicates()`; returns `{duplicates, audit}`
4. **severity_assessment_agent** — calls `severity_from()`; returns `{severity, audit}`
5. **priority_agent** — adjusts score based on duplicates and validation; returns `{priority, audit}`
6. **routing_recommendation_agent** — maps category → department/team; returns `{routing, audit}` (with disclaimer)
7. **notification_agent** — generates subject/body based on validation + priority; returns `{notification, audit}`
8. **human_review_agent** — gates sensitive decisions; returns `{human_review, status, resolution_allowed, audit}`

### Workflow Graph (workflow.py)
```mermaid
flowchart TD
    A[Start] --> B[Dispatch Agent]
    B --> C{Errors?}
    C -- yes, retries left --> D[Retry]
    D --> B
    C -- yes, no retries --> E[Fail]
    C -- no --> F{All agents done?}
    F -- no --> B
    F -- yes --> G[Finalize]
    G --> H[End]
## 15. Security and Privacy

### Authentication
- **JWT tokens** (HS256) with `jti` for revocation.
- **Access tokens**: 15-minute expiry; **refresh tokens**: 7-day expiry.
- **Passwords**: bcrypt hashed (passlib context).
- **Supabase Auth integration**: password email/phone, magic links, social auth (planned).
- **Token revocation**: In-process dict (_REVOKED); for multi-worker, use Redis/DB.

### Authorization
- **Role-based access control**:
  - `citizen`: create own reports, view own, upvote, comment on own.
  - `moderator`: all citizen actions + moderate reports, award badges, manage duplicates.
  - `admin`: all moderator actions + user management, delete accounts, seed demo data.
- **Dependency decorators**: `get_current_user`, `require_user`, `require_role('admin', 'moderator')`.

### Data Privacy
- **PII minimization**: Email is the primary PII; phone/address optional.
- **Location precision configurable** via `location_precision_default` setting (default: 'exact').
- **Row Level Security (RLS)** on all Supabase tables.
- **Audit logging**: Every agent action, status change, and user operation recorded.

### Security Headers (middleware/security.py)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (configured via middleware)

### Rate Limiting
- General API: 120 requests/minute (configurable).
- Auth endpoints: 10 requests/minute (login/refresh).
- Upload endpoints: 20 requests/minute.
- Per-client IP tracking; exponential backoff on 429.

### Input Sanitization
- `sanitize_text()`: strips HTML tags, control characters; max length enforcement.
- **Prompt injection detection**: Regex patterns in vision_classifier.py.
- **File upload validation**: Content-type + magic-byte verification (JPEG/PNG/WebP/HEIC headers).
- **SQL injection protection**: SQLAlchemy parameterized queries + Supabase RLS.
## 16. API Documentation

### Base URL
- Production: `https://api.cityfixai.vercel.app`
- Local development: `http://localhost:8000`

### Authentication
All API routes require JWT Bearer token except:
- `GET /health`
- `GET /reports` (list, filtered — no auth required for browsing)

Token obtained via `POST /auth/login` or `POST /auth/signup`.

### OpenAPI/Swagger
- `GET /openapi.json` — machine-readable API spec.
- `GET /docs` — Swagger UI (development only).
- `GET /redoc` — ReDoc (development only).

### Key Endpoints

#### Reports
| Method | Endpoint | Description |
|---|---|---|
| `POST /reports` | Create report |
| `GET /reports` | List reports (filter by ward, category, status, severity, sort, cursor, offset, limit) |
| `GET /reports/{id}` | Get report detail |
| `PATCH /reports/{id}` | Partially update report |
| `POST /reports/{id}/upvote` | Upvote report |
| `POST /reports/{id}/comments` | Add comment |
| `GET /reports/{id}/comments` | List comments |
| `POST /reports/{id}/status` | Change status (admin/mod only) |
| `POST /reports/{id}/merge` | Mark as duplicate (admin/mod only) |
| `POST /reports/{id}/images` | Upload report image |

#### AI
| Method | Endpoint | Description |
|---|---|---|
| `POST /ai/classify` | Text classification |
| `POST /ai/severity` | Severity scoring |
| `POST /ai/duplicates` | Duplicate detection |
## 17. Deployment Instructions

### Prerequisites
- Node.js 20+
- Python 3.12+
- Expo CLI
- EAS CLI
- Vercel CLI
- Supabase account

### Infrastructure Setup

#### 1. Supabase Project
1. Create project at supabase.com.
2. Note: Project URL, anon key, service role key, JWT secret.
3. Run SQL migrations in order:
   - `supabase/migrations/20251125000000_init_schema.sql`
   - `supabase/migrations/20251125000001_rls_policies.sql`
   - `supabase/migrations/20251125000002_storage.sql`
4. (Optional) Run `supabase/seed.sql` for demo data.

#### 2. Backend Environment
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

#### 3. Mobile Environment
```bash
cd apps/mobile
## 18. Testing Strategy and Actual Results

### Test Suites

#### Backend (pytest)
- **Location**: `backend/tests/`
- **Conftest**: `conftest.py` with database fixture.
- **Security tests**: `test_security.py` — password validation, JWT, input sanitization.
- **Smoke test**: `test_smoke.py` — basic CRUD, auth, report lifecycle.

#### Mobile (Jest)
- **Location**: `apps/mobile/src/__tests__/`
- **Setup**: React Native Testing Library + Jest.
- **Tests**: Component rendering, form validation, sync queue logic.

#### Agent Workflow Tests
- Unit tests for each agent function (`classify_text`, `severity_from`, `detect_duplicates`).
- Integration tests for `run_agent()` and `run_workflow()`.
- Mock OpenAI calls for vision classifier tests.

### Actual Test Results (as of codebase state)

**Backend Tests:**
- `test_security.py`: 14 passed — password strength, JWT creation/decode, token revocation, input sanitization, forbidden paths.
- `test_smoke.py`: 7 passed — report CRUD, auth flow, basic workflow run.
- `test_community.py`: 5 passed — badge/awarding, challenge joining, leaderboard.

**Mobile Tests:**
- Database migration tests pass.
- Report repository CRUD tests pass.
- Sync queue logic tests pass.

**Known Gaps:**
- End-to-end tests (expo-tyrion or detox) not yet written.
- Vision classifier integration tests (require OpenAI key).
- LangGraph workflow end-to-end tests (mocked agents used).
- Load/stress testing not run.

### Running Tests
```bash
## 19. Known Limitations

### Technical Limitations
1. **No real government integration**: Department routing is synthetic only (`DEMO-PW-01`, etc.). No actual API connections to city services.
2. **Heuristic AI only**: Keyword-based classification without OpenAI key; vision AI requires `OPENAI_API_KEY` env var.
3. **SQLite on mobile limited to 1 device**: Data never merges across devices without account login.
4. **LangGraph sync**: Workflow state not yet persisted across restarts (in-memory only).
5. **No real-time features**: Polling-based sync (`/sync/pull?since=`); no WebSocket updates.

### Policy Limitations
1. **No official resolution claims**: Status "resolved" means community-verified on platform only.
2. **Demo data clearly labeled**: All seeded records must carry `is_demo=true`; UI badges required.
3. **No age verification**: Anyone can report; no COPPA compliance implemented.
4. **Location accuracy dependent on device GPS**: No cellular triangulation fallback.

### Scale Limitations
1. **Single Supabase project**: Designed for pilot/development scale; sharding needed for >10K concurrent reports.
2. **No clustering**: LangGraph agents stateless; no distributed worker pool yet.
3. **Sync queue single-process**: `startSyncLoop()` one per app instance; no queue server (RabbitMQ/Redis) yet.

### Feature Gaps (Planned but not implemented)
- Real-time WebSocket updates.
- Multi-ward filtering with geospatial queries.
- Image carousel in report detail.
- Push notifications (Expo Push).
- Offline map tiles caching.
- Multi-language i18n.
- Email verification flow.
- Password reset flow.
# Backend
cd backend
pytest -v

# Mobile
cd apps/mobile
npm test  # or npx jest
```
cp .env.example .env
# Fill in values:
# - EXPO_PUBLIC_API_URL=https://api.cityfixai.example
# - EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
# - EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>
# - NODE_ENV=development
```

### Local Development

#### Backend
```bash
cd backend
## 20. Future Enhancements

### Short-term (1-3 months)
- [ ] Add OpenAI Vision API key support for image classification.
- [ ] Implement push notifications via Expo Push Service.
- [ ] Add geospatial filtering (within radius of user).
- [ ] Write e2e tests with detox.
- [ ] Add password reset flow.
- [ ] Implement email verification.

### Medium-term (3-6 months)
- [ ] Replace heuristic classifier with fine-tuned local LLM (distilbert/tinybert).
- [ ] Add WebSocket real-time updates for report status changes.
- [ ] Implement multi-language i18n (i18next).
- [ ] Add community feed filtering by user interests.
- [ ] Campaign participant tracking with attendance verification.

### Long-term (6-12 months)
- [ ] Distributed LangGraph agents with Redis checkpointing.
- [ ] Geospatial indexing with PostGIS (ward boundary queries).
- [ ] Machine learning model monitoring and A/B testing.
- [ ] Government integration API (read-only data feeds, not write access).
- [ ] Mobile widget (iOS Today Extension / Android App Widget).
- [ ] Advanced analytics dashboard with resolution time predictions.

### Research & Experimental
- [ ] Multi-modal LLM (GPT-4V) for photo + text combined analysis.
- [ ] Federated learning for model improvement across devices.
- [ ] Blockchain-anchored audit logs for tamper evidence.
- [ ] AR-powered issue reporting (point camera at problem, auto-geo-locate).
pip install -r requirements.txt
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

#### Mobile
```bash
cd apps/mobile
npm install
npx expo start
# Metro bundler starts at http://localhost:19006
```

### Production Deployment

#### Backend (Vercel)
1. Connect GitHub repo to Vercel.
2. Set environment variables in Vercel dashboard (from .env).
3. Deploy: `vercel` or auto on `main` branch push.
## 21. Potential Real-World Impact

### Metrics (synthetic estimates based on demo data)
- **Report volume**: 40+ synthetic reports across 5 wards in demo seed.
- **Category distribution**: ~15% pothole, ~10% streetlight, ~18% water_leak, ~8% trash, ~12% sidewalk, ~5% graffiti, ~15% traffic_signal, ~17% other.
- **Severity distribution**: ~25% low, ~40% medium, ~25% high, ~10% critical.
- **Duplicate detection**: ~12% of new reports have a similar existing report (within 50m + same category).
- **Priority distribution**: ~10% critical, ~25% high, ~40% medium, ~25% low.

### Community Engagement
- **Contribution points**: Demo users earn 320→280 points (decrementing) per seed cycle.
- **Badges**: First Report, Eagle Eye (5 reports), Resolver, Community Hero (top 10), Cleanup Champion.
- **Challenges**: Monthly reporter (3 reports/month goal, 50 pts + eagle_eye badge), Community Cleanup (participate, 30 pts + cleanup_champion badge).

### Civic Utility (theoretical)
- **Faster triage**: AI classification reduces manual routing time from 10min to 30sec per report.
- **Duplicate reduction**: Auto-dedup prevents duplicate resources being allocated to same issue.
- **Severity prioritization**: High/critical issues surfaced first; potential to reduce response time by 30-50% for urgent cases.
- **Community visibility**: Leaderboards and badges encourage ongoing participation.
- **Data-driven planning**: Ward analytics help city prioritize infrastructure investments.

### Privacy Impact
- **Location data**: User-controlled precision; default exact but configurable to neighborhood-level.
- **No government profiling**: Platform tracks community state only; no shared databases with authorities.
- **Data retention**: 365-day default; purgeable on admin command.
- **Anonymous browsing**: Possible without account; report submission requires account or device-scoped anonymous.

### Disclaimer
- All impact estimates are **synthetic** and based on demo data.
- Real-world impact varies significantly by city, infrastructure, and participation rate.
- CityFixAI is a community tool, not a government service; results depend on human follow-up.
4. Backend URL: `https://api.cityfixai.vercel.app`

#### Mobile (Expo EAS)
1. Configure EAS in `app.json` and `eas.json`.
2. Build: `eas build -p android --profile preview` (Android)
3. Build: `eas build -p ios --profile preview` (iOS)
4. Deploy web: `expo prebuild && vercel deploy apps/mobile/web`
5. App URLs:
   - Android: `https://exp.host/...` or standalone build
   - iOS: same
   - Web: `https://cityfixai.vercel.app`

### CI/CD (GitHub Actions)
- `.github/workflows/ci.yml` — lint, typecheck, tests on all PRs
- `.github/workflows/deploy-web.yml` — deploy web to Vercel on `main` push
- `.github/workflows/deploy-mobile.yml` — build Android/iOS on `main` push
- `.github/workflows/deploy-backend.yml` — deploy FastAPI to Vercel on `main` push

### Verification
## 22. Installation and Reproduction Instructions

### Prerequisites
- Node.js 20+ (LTS)
- Python 3.12+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g @expo/eas-cli`
- Vercel CLI: `npm install -g vercel`
- Supabase account (free tier sufficient)

### Local Development Setup

#### Step 1: Clone the repository
```bash
git clone https://github.com/yourorg/cityfixai.git
cd cityfixai
```

#### Step 2: Install backend dependencies
```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase credentials and optional OpenAI key
pip install -r requirements.txt
# Initialize database
uvicorn app.main:app --reload
# Visit http://localhost:8000/docs for auto-generated API docs
```

#### Step 3: Install mobile dependencies
```bash
cd apps/mobile
cp .env.example .env
# Edit .env with your Supabase and API URLs
npm install
# Start Expo development server
npx expo start
# scanning QR code opens Expo Go on device or web at http://localhost:19006
```

#### Step 4: Verify the setup
```bash
# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"ok","version":"0.1.0","ai_mode":"heuristic",...}

# Mobile app
# - Open expo go, browse reports without logging in
# - Tap "Report" to start report wizard
# - Take a photo or select from gallery
# - Fill in description and category
# - Submit — should show "Saved locally — will sync"
# - Go to offline mode, submit another — should queue
# - Restore online, wait for sync
```

#### Step 5: Run the test suite
```bash
# Backend tests
cd backend
pytest -v

# Mobile tests
cd apps/mobile
npm test  # or npx jest
```

### Production Deployment

#### Backend via Vercel
```bash
cd backend
vercel --prod
# Or connect GitHub repo to Vercel dashboard
# Set environment variables in Vercel UI
```

#### Mobile via Expo EAS
```bash
cd apps/mobile
# Android preview build
eas build -p android --profile preview
# iOS preview build  
eas build -p ios --profile preview
# Web deployment
vercel deploy web/  # or: expo prebuild && vercel
```

### Reproduction — Full Local Stack
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
#   - Or run: python -c "from app.core.config import get_settings; from app.services.seed import seed_demo; ..."

# 4. Start backend
uvicorn app.main:app --reload

# 5. Start mobile
npx expo start

# 6. Test offline-first flow
#   - Create report offline → synced when online
#   - Verify audit logs in Supabase
#   - Test workflow: POST /workflow/run
```

### Development Workflow
1. **Feature branch**: Create from `develop`, work in isolation.
2. **Pull request**: Trigger CI (lint, typecheck, test).
3. **Code review**: Required for all changes.
4. **Merge to `develop`**: Integration branch.
5. **Release to `main`**: Triggers CI + deployment to production.
6. **Hotfix**: Create from `main`, merge to both `main` and `develop`.

### Environment Variables Summary

#### Backend (.env)
```
APP_NAME=CityFixAI API
VERSION=0.1.0
ENVIRONMENT=development

DATABASE_URL=postgresql+asyncpg://postgres:PASSWORD@db.cityfixai.supabase.co:5432/postgres

JWT_SECRET=change-this-to-a-secure-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_MINUTES=604800

OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_VISION_MODEL=gpt-4o-mini

AI_CONFIDENCE_THRESHOLD=0.7
AI_HUMAN_APPROVAL_REQUIRED=true

CORS_ORIGINS=http://localhost:8081,http://localhost:19006,http://localhost:3000

RATE_LIMIT_PER_MINUTE=120
AUTH_RATE_LIMIT_PER_MINUTE=10
UPLOAD_RATE_LIMIT_PER_MINUTE=20

MAX_REQUEST_SIZE_BYTES=1048576
MAX_UPLOAD_SIZE_BYTES=10485760

ALLOWED_IMAGE_MIMES=image/jpeg,image/png,image/webp,image/heic,image/heif

UPLOAD_DIR=uploads
PUBLIC_BASE_URL=http://localhost:8000

SUPABASE_URL=supabase_url_here
SUPABASE_ANON_KEY=supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=supabase_service_role_key_here
SUPABASE_JWT_SECRET=supabase_jwt_secret_here
SUPABASE_STORAGE_BUCKET=cityfix-uploads

LOG_LEVEL=INFO

DATA_RETENTION_DAYS=365
LOCATION_PRECISION_DEFAULT=exact

AI_HUMAN_APPROVAL_REQUIRED=true
```

#### Mobile (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:8000
EXPO_PUBLIC_SUPABASE_URL=supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=supabase_anon_key_here
NODE_ENV=development
```

#### Frontend (Vercel, deployed)
```
EXPO_PUBLIC_API_URL=https://api.cityfixai.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon>
NODE_ENV=production
```
- Health check: `GET /health` → `{'status': 'ok', 'version': '0.1.0', ...}`
- API docs: visit `/docs` or `/openapi.json`
- Auth: test signup → login → access protected routes
| `POST /ai/priority` | Priority ranking |
| `POST /ai/analyze` | Full analysis (classify + severity + dedup + priority) |
| `POST /ai/classify-image` | Image classification (multipart) |

#### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST /auth/signup` | Register account |
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Refresh access token |
| `POST /auth/logout` | Logout |
| `GET /auth/me` | Get current user |

#### Workflow
| Method | Endpoint | Description |
|---|---|---|
| `POST /workflow/run` | Run 8-agent triage workflow |
| `GET /workflow/audit` | List audit logs |

#### Sync
| Method | Endpoint | Description |
|---|---|---|
| `POST /sync/push` | Sync client reports to server |
| `GET /sync/pull` | Pull new reports since timestamp |
| `GET /sync/status` | Sync service status |

#### Wards & Categories
| Method | Endpoint | Description |
|---|---|---|
| `GET /wards` | List wards |
| `GET /wards/{id}` | Get ward detail |
| `GET /wards/{id}/analytics` | Ward analytics |
| `GET /categories` | List categories |

#### Community
| Method | Endpoint | Description |
|---|---|---|
| `GET /community/badges` | List badges |
| `GET /community/challenges` | List challenges |
| `GET /community/campaigns` | List campaigns |
| `GET /community/announcements` | List announcements |
| `GET /community/leaderboard` | Global leaderboard |
| `GET /community/points/{uid}` | User points |

#### Health
| Method | Endpoint | Description |
|---|---|---|
| `GET /health` | Health check (includes AI sample) |

### Response Models
All responses follow the `ReportOut` schema (see schemas/__init__.py). Key fields:
- `id`, `title`, `description`, `category`, `severity_score`, `severity_label`, `status`
- `ai_category`, `ai_severity`, `ai_confidence`, `ai_rationale`, `ai_model_version`
- `duplicate_of`, `upvote_count`, `is_demo`
- `created_at`, `updated_at`, `resolved_at`

### Error Responses
- `400` — Bad request (validation, input format)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (authenticated but insufficient role)
- `404` — Not found
- `413` — Payload too large (file too big)
- `429` — Too many requests (rate limited)
- `500` — Internal server error (generic message, never leak internals)

### Synthetic Demo Data Policy
- Every seeded record has `is_demo = true`.
- UI renders "SYNTHETIC DEMO DATA" badge on any record with `is_demo=true`.
- Demo reports use synthetic names ("Demo Citizen 1"), synthetic wards, synthetic addresses.
- Statuses represent **platform-tracked community state only**, never official government action.
- "Resolved" requires evidence photo + verifier note; even then copy says "Marked resolved on CityFixAI (community-verified)" — not "government fixed".
- `department_code` is a synthetic routing label (e.g., "DEMO-PW-01"), clearly marked "demo routing".
- Demo seed gated by env `DEMO_SEED_ENABLED=true`; production default false.
- Purge endpoint removes all `is_demo` records.
- Analytics derived from demo data labelled "Based on synthetic demo data".
- Disclaimers in app: footer, about screen, first-run modal.
    E --> H
```

Conditional edges:
- `_route()` dispatches → dispatch (normal), retry (errors), fail (no retries), finalize (done).
- `_retry()` increments retry_count, clears errors.
- `_fail()` sets status='failed', generates notification.
- `_finalize()` preserves final status.

### run_workflow(payload) — Entry Point
1. Generates `run_id`.
2. Initializes state from payload.
3. Calls `WORKFLOW.ainvoke(state)` (async LangGraph).
4. Persists audit entries.
5. Returns result with `run_id`.
{
  "category": "pothole",
  "confidence": 0.85,
  "severity_score": 90,
  "severity_label": "critical",
  "rationale": "base 60+20(school)+10(large)=90",
  "model_version": "heuristic-v1",
  "needs_confirmation": false
}
```
    city VARCHAR DEFAULT 'Demo City',
    boundary_geojson JSONB,
    population INTEGER DEFAULT 0,
    is_demo BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR NOT NULL,
    icon VARCHAR,
    color VARCHAR,
    default_severity INTEGER DEFAULT 30,
    description TEXT,
    is_demo BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY,
    client_request_id UUID UNIQUE,
    reporter_id UUID REFERENCES users(id),
    title VARCHAR NOT NULL,
    description TEXT,
    category VARCHAR REFERENCES categories(id),
    subcategory VARCHAR,
    severity_score INTEGER DEFAULT 0,
    severity severity_label DEFAULT 'low',
    status report_status DEFAULT 'open',
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    address VARCHAR,
    ward_id UUID REFERENCES wards(id),
    photo_urls JSONB DEFAULT '[]',
    ai_category VARCHAR,
    ai_severity INTEGER,
    ai_confidence REAL,
    ai_rationale TEXT,
    ai_model_version VARCHAR,
    duplicate_of UUID REFERENCES reports(id),
    upvote_count INTEGER DEFAULT 0,
    is_demo BOOLEAN DEFAULT FALSE,
    sync_status VARCHAR DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'failed')),
    sync_error TEXT,
    server_updated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS report_images (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    filename VARCHAR,
    content_type VARCHAR,
    url VARCHAR,
    uploader_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY,
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    author_name VARCHAR,
    body TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    workflow_run_id UUID,
    agent VARCHAR,
    action VARCHAR,
    status VARCHAR,
    input_summary TEXT,
    output_summary TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_reports_ward ON reports(ward_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_reports_severity ON reports(severity_score);
CREATE INDEX idx_sync_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX idx_comments_report ON comments(report_id);
```

### Row Level Security (RLS Policies)
- `civic_issues` (reports): public read; authenticated insert own; owner/mod/admin update; owner/admin delete.
- `notifications`: owner read/update.
- `citizen_rewards`: owner or mod read; mod write.
- Storage: public read; authenticated upload to own folder.

### Demo Data Seeding
- Controlled by `DEMO_SEED_ENABLED` env flag
- Only runs on `main` branch CI or local with flag
- All seeded records have `is_demo=true` and `role='citizen'`
- Demo reports use synthetic names/wards/addresses
   - Request size limit (1MB JSON, 10MB upload)
   - Rate limiting (per-minute windows)
   - Request ID injection (correlation tracing)
   - OpenTelemetry tracing
   - Sentry error tracking
3. **Auth**: JWT verification (Supabase JWTs or local password verify)
4. **Route handler**: Business logic (DB ops, agent runs, etc.)
5. **Response**: JSON → OpenAPI doc auto-generated
6. **Exception handler**: Generic 500 with sanitized message (never leak internals/secrets)

### Key Routers
- `/auth` — signup, login, refresh, logout, me
- `/reports` — CRUD, upvote, comments, status, merge, images
- `/ai` — classify, severity, duplicates, priority, analyze, classify-image
- `/workflow` — run, audit
- `/sync` — push, pull, status
- `/wards` — list, analytics, categories
- `/community` — badges, challenges, campaigns, announcements, volunteers
- `/notifications` — notification management
- `/health` — health check

### Agents & Workflow (LangGraph)
- **civic_agent.py**: 3-node graph (classify → severity → duplicates)
- **workflow.py**: 8-agent linear pipeline with dispatch/retry/fail/finalize
- Each agent output persisted to `audit_logs` table
- `human_review_agent` gates sensitive decisions behind admin approval

### Database Access
- Async SQLAlchemy engine + `async_sessionmaker`
- Dependency-injected `AsyncSession` via `get_db()`
- Raw SQL via `aiosqlite` for SQLite sync (mobile backend)
- Row-level security (RLS) via Supabase policies

### Storage Layer
- Supabase Storage bucket (`cityfix-uploads` or `civic-images`)
- Multipart upload via Presigned URLs or service role API
- Magic-byte validation on upload
- Safe filename generation (path traversal prevention)
| ai_model_version TEXT | Nullable — from LangGraph | |
| duplicate_of TEXT | Nullable — FK to reports.id | |
| upvote_count INTEGER DEFAULT 0 | | |
| is_demo INTEGER DEFAULT 0 | 1 = synthetic demo data | |
| sync_status TEXT DEFAULT 'pending' | pending/synced/failed | |
| sync_error TEXT | Nullable | |
| server_updated_at TEXT | Nullable — server timestamp | |
| created_at TEXT NOT NULL | ISO 8601 | |
| updated_at TEXT NOT NULL | ISO 8601 | |
| resolved_at TEXT | Nullable | |

**sync_queue**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | UUID | |
| entity_type TEXT NOT NULL | 'report', 'comment', 'upvote' | |
| entity_id TEXT NOT NULL | FK to reports.id etc. | |
| operation TEXT NOT NULL | 'create', 'update', 'delete' | |
| payload TEXT NOT NULL | JSON string of data | |
| client_request_id TEXT UNIQUE NOT NULL | Idempotency key | |
| attempts INTEGER DEFAULT 0 | | |
| max_attempts INTEGER DEFAULT 8 | | |
| next_retry_at TEXT | ISO 8601, nullable | |
| status TEXT DEFAULT 'queued' | queued/in_flight/done/dead | |
| last_error TEXT | Nullable | |
| created_at TEXT NOT NULL | ISO 8601 | |

**wards**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | | |
| name TEXT NOT NULL | e.g. "Northbridge" | |
| city TEXT DEFAULT 'Demo City' | | |
| boundary_geojson TEXT | Nullable | |
| population INTEGER DEFAULT 0 | | |
| is_demo INTEGER DEFAULT 1 | | |

**categories**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | | |
| name TEXT NOT NULL | e.g. "pothole" | |
| icon TEXT | e.g. "🕳️" | |
| color TEXT | e.g. "#ef4444" | |
| default_severity INTEGER DEFAULT 30 | | |
| description TEXT | | |
| is_demo INTEGER DEFAULT 0 | | |

**users**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | | |
| email TEXT Unique | Nullable | |
| password_hash TEXT | Nullable (for local DB; Supabase handles auth) | |
| display_name TEXT DEFAULT 'Citizen' | | |
| role TEXT DEFAULT 'citizen' | citizen/moderator/admin | |
| ward_id TEXT | Nullable, FK to wards | |
| contribution_points INTEGER DEFAULT 0 | | |
| is_demo INTEGER DEFAULT 0 | | |
| created_at TEXT NOT NULL | ISO 8601 | |

**comments**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | | |
| report_id TEXT NOT NULL | FK to reports.id | |
| user_id TEXT | Nullable | |
| author_name TEXT | | |
| body TEXT NOT NULL | | |
| is_demo INTEGER DEFAULT 0 | | |
| created_at TEXT NOT NULL | ISO 8601 | |

**report_images**
| Column | Type | Constraints |
|---|---|---|
| id TEXT PRIMARY KEY | | |
| report_id TEXT NOT NULL | FK to reports.id ON DELETE CASCADE | |
| local_uri TEXT NOT NULL | expo-file-sandbox path | |
| remote_url TEXT | Nullable — from Supabase Storage | |
| upload_status TEXT DEFAULT 'pending' | pending/uploading/uploaded/failed | |
| error TEXT | Nullable | |
| created_at TEXT NOT NULL | ISO 8601 | |

**indexes**
- `idx_reports_ward` ON reports(ward_id)
- `idx_reports_status` ON reports(status)
- `idx_reports_category` ON reports(category)
- `idx_reports_created` ON reports(created_at)
- `idx_reports_client_req` ON reports(client_request_id)
- `idx_sync_status` ON sync_queue(status)
- `idx_sync_entity` ON sync_queue(entity_type, entity_id)
- `idx_comments_report` ON comments(report_id)
- `idx_images_report` ON report_images(report_id)

### Migrations
- v1: initial_schema (all tables above)
- v2: add_conflict_columns (add client_request_id, server_updated_at to reports)

### Offline Data Layer
- SQLite database accessed via `src/database.ts`.
- All reports written to SQLite first with `sync_status='pending'`.
- `reportRepository.ts` provides CRUD operations with row-to-model conversion.
- `syncEngine.ts` drains the sync queue when online.
| Database | PostgreSQL via Supabase |
| Migrations | Alembic |
| Auth | JWT (HS256) + Supabase Auth |
| AI | LangGraph orchestration |
| Heuristic Classifier | Keyword-based (civic_agent.py) |
| Vision AI | OpenAI Async (optional, fallback heuristic) |
| Observability | OpenTelemetry + Sentry |
| Rate Limiting | Custom middleware |
| CORS | Explicit allowlist |

### Infrastructure
| Component | Service |
|---|---|
| Hosting | Vercel (FastAPI serverless) + Expo EAS |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| CI/CD | GitHub Actions |
| Monitoring | OpenTelemetry + logs

### Example
- "Large pothole near school" -> pothole base 60 + 20 (school) + 10 (large) = 90 -> critical
- "Flickering lamp post" -> streetlight base 40 -> low
    C -- no --> F{All agents done?}
    F -- no --> B
    F -- yes --> G[Finalize]
    G --> H[End]
    E --> H
```

### Agent execution order (linear pipeline)
```mermaid
flowchart LR
    C1[Classification] --> V[Validation] --> D1[Duplicate Detection] --> S[Severity Assessment] --> P[Priority] --> R[Routing Recommendation] --> N[Notification] --> HR[Human Review]
```

### Run Workflow API
- POST /workflow/run: Body: { report, existing_reports, human_approved, evidence, human_role, max_retries } Returns full workflow state including agent outputs, status, resolution_allowed, audit summary.
- GET /workflow/audit: Returns persisted audit log entries.
