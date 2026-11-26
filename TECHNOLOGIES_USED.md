# CityFixAI — Technologies Used

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## Client Technologies

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Expo React Native | Cross-platform mobile framework for Android/iOS/Web |
| **Routing** | Expo Router | File-based routing for native and web apps |
| **UI** | Nativewind | Tailwind CSS for React Native; rapid UI development |
| **State Management** | Zustand | Lightweight state store; replaces Redux |
| **Offline Storage** | expo-sqlite | SQLite database on device; source of truth for offline |
| **File System** | expo-file-system | File sandbox for photos and assets |
| **Network** | @react-native-community/netinfo | Network state monitoring (online/offline) |
| **Auth** | Expo SecureStore | Encrypted storage for JWT tokens; never AsyncStorage |
| **AI Vision** | OpenAI GPT-4o-mini | Optional image classification model |
| **Charts/Maps** | Recharts + Expo Maps | Data visualization and map displays |

## Backend Technologies

| Layer | Technology | Details |
|---|---|---|
| **Framework** | FastAPI (Python 3.12+) | Modern, fast API framework with automatic OpenAPI docs |
| **ORM** | SQLAlchemy 2.x async | Async SQL toolkit and ORM for PostgreSQL |
| **Database** | PostgreSQL via Supabase | Hosted PostgreSQL with RLS, Auth, and Storage |
| **Migrations** | Alembic | Database schema migration tool |
| **Auth** | JWT (HS256) + Supabase Auth | Token-based authentication with refresh flows |
| **AI** | LangGraph orchestration | 8-agent workflow for civic issue triage |
| **Heuristic AI** | Keyword-based classifier (civic_agent.py) | Always available; no API key required |
| **Vision AI** | OpenAI Async (vision_classifier.py) | Optional; fallback to heuristic if key missing |
| **Observability** | OpenTelemetry + Sentry | Tracing, metrics, and error tracking |
| **Rate Limiting** | Custom middleware | Per-endpoint rate limits (120/min general, 10/min auth, 20/min upload) |
| **CORS** | FastAPI CORSMiddleware | Explicit allowlist of frontend domains |

## Infrastructure Technologies

| Component | Service | Details |
|---|---|---|
| **Hosting** | Vercel | FastAPI serverless functions; automatic HTTPS |
| **Database** | Supabase | PostgreSQL + Auth + Storage + RLS |
| **CI/CD** | GitHub Actions | Lint, typecheck, test on every PR; deploy on main push |
| **Mobile Build** | Expo EAS | Android/iOS build service; over-the-air updates |
| **Monitoring** | OpenTelemetry | Custom traces for agent workflow and API routes |
| **Error Tracking** | Sentry | Captures JavaScript and Python errors with stack traces |
| **DNS/SSL** | Vercel | Automatic HTTPS certificate management |

## AI/ML Technologies

| Technology | Purpose | Details |
|---|---|---|
| **Heuristic Classifier** | Keyword-based categorization | Always available; categories: pothole, streetlight, water_leak, trash, sidewalk, graffiti, traffic_signal, other |
| **Base Severity** | Category-dependent severity scores | pothole=60, streetlight=40, water_leak=70, trash=30, sidewalk=45, graffiti=15, traffic_signal=80, other=30 |
| **Text Boosts** | +20 for injury/urgent/school, +10 for large/deep/major/flooding | Modifies base severity based on text content |
| **Confidence Score** | `min(0.95, 0.5 + 0.1 * keyword_count)` | Ranges from 0.4 (no matches) to 0.95 (many matches) |
| **OpenAI Vision** | Image analysis via GPT-4o-mini | Optional; system prompt forces JSON output; fallback to heuristic if key missing |
| **Prompt Injection Detection** | Regex-based sanitization | Protects against malicious user hints |
| **Duplicate Detection** | Token-set Jaccard similarity + location filter | Category filter + 50m proximity + 0.3 Jaccard threshold; up to 5 matches |

## Development Dependencies

### Python Dependencies (requirements.txt key packages)
- `fastapi==0.165.0` — Web framework
- `sqlalchemy==2.1.9` — ORM
- `langgraph==1.2.24` — Agentic workflow orchestration
- `supabase` — Supabase Python client
- `pgvector==0.5.1` — Vector similarity search
- `bcrypt==5.0.0` — Password hashing
- `passlib[bcrypt]` — Password context
- `python-jose` — JWT encoding/decoding
- `python-multipart` — Form file uploads

### Node.js Dependencies (package.json key packages)
- `expo` — 51+ — Core Expo framework
- `react-native` — Latest stable version
- `nativewind` — Tailwind CSS for RN
- `@react-native-community/netinfo` — Network monitoring
- `expo-sqlite` — SQLite integration
- `expo-file-system` — File sandbox
- `@types/react-native-vector-icons` — UI icons

## External Services

| Service | Purpose | Notes |
|---|---|---|
| **Supabase** | PostgreSQL, Auth, Storage | Free tier sufficient for pilot; paid plans for scale |
| **OpenAI** | Vision AI classification | Optional; `OPENAI_API_KEY` env var gates this feature |
| **Vercel** | Backend hosting | Serverless FastAPI functions |
| **Expo EAS** | Mobile builds | Android/iOS standalone builds |
| **GitHub** | Version control, CI/CD, secrets | All production credentials via GitHub Actions secrets |
| **Sentry** | Error tracking | Optional; captures Python/JS exceptions |
| **OpenTelemetry** | Tracing | Custom traces for agent workflow debugging |