# CityFixAI

Offline-first Agentic Civic Intelligence Platform. Synthetic demo data only.

## Structure

- `apps/mobile` — Expo (React Native) app for Android/iOS/Web
- `backend` — FastAPI + SQLAlchemy (PostgreSQL/Supabase-ready) + LangGraph

## Run backend

```
cd backend
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt  # or install from pyproject
cp .env.example .env
.venv/bin/uvicorn app.main:app --reload
```

## Run mobile

```
cd apps/mobile
npm install
npx expo start --web   # or --ios / --android
```

Set `EXPO_PUBLIC_API_URL` to point to backend (default http://localhost:8000).

## Honesty

No real government integration. All demo records labelled SYNTHETIC DEMO DATA. Statuses are platform-tracked community states.
EOF