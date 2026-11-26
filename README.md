# CityFixAI

CityFixAI is a community-driven pothole and infrastructure reporting platform that leverages AI to categorize and prioritize repairs.

## Project Structure

```
CityFixAI/
├── .github/                    # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml              # CI: lint, typecheck, tests
│       ├── deploy-web.yml      # Deploy Expo Web to Vercel
│       ├── deploy-mobile.yml   # Deploy mobile builds via Expo EAS
│       └── deploy-backend.yml  # Deploy FastAPI to Vercel
├── apps/
│   └── mobile/                 # Expo React Native application
│       ├── .env.example        # Mobile environment variables
│       ├── .gitignore
│       ├── app.json            # Expo configuration
│       ├── package.json        # Dependencies
│       ├── tsconfig.json       # TypeScript config
│       ├── jest.config.js      # Test configuration
│       └── src/                # Source code
├── backend/                    # FastAPI backend
│   ├── .env.example            # Backend environment variables
│   ├── requirements.txt        # Python dependencies
│   ├── main.py                 # FastAPI application entry point
│   ├── app/                    # Application source code
│   ├── tests/                  # Test suite
│   └── supabase/               # Supabase configuration
└── docs/                       # Documentation
```

## Branches

- `main` - Production branch: Deployed code is always production-ready
- `develop` - Development branch: Integration branch for features and bug fixes
- Feature branches: Created from `develop`, merged back via Pull Requests

## CI/CD Pipeline

### Continuous Integration (CI)

Every push and pull request triggers the CI pipeline:

1. **Lint** - Runs ESLint/Style checks on mobile code
2. **TypeScript** - Type checks the mobile codebase
3. **Frontend Tests** - Runs Jest test suite
4. **Backend Tests** - Runs pytest suite against FastAPI
5. **Build** - Runs `expo prebuild` to prepare native code
6. **Deploy** - Deploys to Vercel/Expo only on `main` branch merges

### Workflows

- `.github/workflows/ci.yml` - Lint, typecheck, and test on all PRs
- `.github/workflows/deploy-web.yml` - Deploy web to Vercel on `main` push
- `.github/workflows/deploy-mobile.yml` - Build Android/iOS on `main` push
- `.github/workflows/deploy-backend.yml` - Deploy FastAPI to Vercel on `main` push

## Deployment

### Web (Vercel + Expo)

1. Expo Web is built and deployed to Vercel
2. Production environment variables are configured:
   - `EXPO_PUBLIC_API_URL` - Backend API endpoint
   - `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `NODE_ENV` - Set to `production`
3. Web app accessible at: `https://cityfixai.vercel.app`

### Mobile (Expo EAS)

1. **Android**: `eas build -p android --profile preview` creates APK
2. **iOS**: `eas build -p ios --profile preview` creates IPA build
3. Builds are triggered on `main` branch pushes
4. Artifacts are available as GitHub Actions workflow artifacts

### Backend (FastAPI + Vercel)

1. FastAPI deployed as Vercel Serverless Function
2. HTTPS enforced via Vercel HTTPS configuration
3. CORS configured with production allowlist
4. Production database connection via Supabase
5. Health check endpoint: `GET /health`
6. API accessible at: `https://api.cityfixai.vercel.app`

## Environment Variables

### Mobile (.env.example)

| Variable | Description |
|---|---|
| `EXPO_PUBLIC_API_URL` | Public API endpoint (safe to expose) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL (safe to expose) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (safe to expose) |
| `NODE_ENV` | Environment: development/production |

### Backend (.env.example)

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `JWT_SECRET` | HMAC secret for JWT tokens (keep secret!) |
| `OPENAI_API_KEY` | OpenAI API key |
| `CORS_ORIGINS` | Allowed frontend domains |
| `RATE_LIMIT_PER_MINUTE` | API rate limit |
| `SUPABASE_*` | Supabase project credentials |
| `ENVIRONMENT` | development/production |

## Security

- **Never commit API keys or production secrets** to version control
- Use GitHub Actions secrets for all production credentials
- Branch protection rules on `main` require PR reviews
- Production CORS origins are explicitly allowlisted
- HTTPS enforced on all deployed endpoints
- Security headers via middleware (X-Content-Type-Options, X-Frame-Options, etc.)

## Development

### Prerequisites

- Node.js 20+
- Python 3.12+
- Expo CLI
- EAS CLI
- Vercel CLI
- Supabase account

### Local Development

```bash
# Mobile
cd apps/mobile
cp .env.example .env
# Fill in local Supabase/ API values
npm install
npx expo start

# Backend
cd backend
cp .env.example .env
# Fill in local values
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## License

MIT
EOF

## Working solution


## Project documentation
https://docs.google.com/document/d/1wvTuwYWwnvTb6Hrk2TEonHe-CUGKPn6-7frZPGDLYYI/edit?tab=t.0#heading=h.zfmor7fbhk9a

## Landing page

## Brand kit

## Launch film

## Explainer video

## Social media posts

## Social media engagement

## Tools and technologies
 * React Native
* Expo
* TypeScript
* Expo Router
* NativeWind
* Expo SQLite
* Expo Camera
* Expo Image Picker
* Expo Location
* Expo Network
* Python
* FastAPI
* Pydantic
* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage
* LangGraph
* OpenAI API (Vision-capable model)
* Scikit-learn
* pgvector
* OpenStreetMap
* Leaflet
* React Native Maps
* Next.js
* Tailwind CSS
* Recharts
* Git
* GitHub
* VS Code
* Postman
* Pytest
* Jest
* Expo Go
* Expo EAS
* Vercel
* Render / Railway
* Sentry
