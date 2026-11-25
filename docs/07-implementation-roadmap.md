# CityFixAI — Implementation Roadmap

Build increments; each phase ends with runnable, tested artifact.

## Phase 0 — Planning (DONE)
Architecture, journeys, screens, data models, API contracts, security, roadmap, demo policy.

## Phase 1 — Mobile Scaffold + Offline DB (current)
- Expo app (TS) with Expo Router, tabs, theme, env.
- SQLite schema + repos; file storage helper.
- Zustand stores; NetInfo; offline banner.
- Acceptance: app runs on web + (native via expo), DB init, insert/list reports locally.

## Phase 2 — Citizen Reporting Offline
- Report wizard (4 steps), photo capture, location, category.
- Local save + sync queue enqueue.
- My Reports list/detail with sync status + retry.
- Acceptance: full report created offline persists across restart; syncs when online (mock server).

## Phase 3 — Sync Engine + Backend Skeleton
- FastAPI skeleton, DB models, migrations, auth, health.
- Sync push/pull endpoints with idempotency.
- Client sync engine: drain queue, pull deltas, backoff.
- Acceptance: offline report syncs to backend; appears in DB; no duplicates on retry.

## Phase 4 — AI Orchestration (LangGraph)
- Classify, dedup, severity, explain nodes + deterministic fallback.
- Integrate into POST /reports.
- Client shows AI fields after sync.
- Acceptance: report gets category/severity/rationale; duplicate detection returns candidates.

## Phase 5 — Maps & Community
- Map view with clustering; community feed; filters; upvotes/comments.
- Acceptance: map renders pins; feed infinite scroll; comment flow works online+offline queued.

## Phase 6 — Wards & Analytics
- Ward list/detail; analytics endpoint; charts.
- Acceptance: ward analytics display; hotspot list.

## Phase 7 — Admin Workflows
- Role-gated admin routes; triage; status transitions with evidence; merge duplicates; audit log; demo seed/purge.
- Acceptance: admin can triage and resolve with evidence; audit recorded.

## Phase 8 — Polish, Testing, Deploy
- Unit/integration tests; E2E (Detox optional); accessibility; i18n; CI; build profiles (EAS); backend Docker.
- Synthetic demo data seed script; disclaimers.

## Testing Strategy
- Backend: pytest (unit + integration with test DB).
- Mobile: Jest + React Native Testing Library for components/stores; manual E2E.
- Each phase gated by acceptance criteria + smoke run.

## Definition of Done (per feature)
- Code compiles (tsc --noEmit), lint passes, tests pass, manual smoke, docs updated, demo data labelled.
