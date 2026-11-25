# CityFixAI — API Contracts

Base URL: `https://api.cityfixai.example/v1` (demo). Auth: `Authorization: Bearer <jwt>` (Supabase). All responses JSON. Errors: `{ "error": { "code", "message", "details" } }`. Idempotency via `X-Client-Request-Id` header or `client_request_id` body.

## Auth
- POST /auth/signup  { email, password, display_name } → { user, access_token, refresh_token }
- POST /auth/login    { email, password } → { user, access_token, refresh_token }
- POST /auth/refresh  { refresh_token } → { access_token }
- GET  /auth/me → User

## Reports
- POST /reports  (multipart: meta JSON + photos[]) → Report (runs AI pipeline)
  - meta: { client_request_id, title, description, category?, lat, lng, address, ward_id?, is_demo? (server ignores client is_demo except demo seed endpoint), anonymous }
- GET  /reports?ward_id&category&status&severity_min&bbox&limit&cursor → { items, next_cursor }
- GET  /reports/{id} → Report (incl. comments_count, ai)
- PATCH /reports/{id}  { title?, description?, category? } → Report (re-runs classify if changed)
- DELETE /reports/{id} → 204 (soft delete; owner or admin)
- POST /reports/{id}/upvote → { upvote_count, voted }
- DELETE /reports/{id}/upvote → { upvote_count, voted }
- POST /reports/{id}/comments { body } → Comment
- GET  /reports/{id}/comments → Comment[]
- POST /reports/{id}/status (admin) { status, note, evidence_photo_url? } → Report + StatusHistory
- POST /reports/{id}/merge (admin) { target_id } → Report

## Wards
- GET /wards → Ward[]
- GET /wards/{id} → Ward
- GET /wards/{id}/analytics → { totals_by_status, by_category, avg_resolution_hours, hotspots[], top_contributors[], trend_30d[] }

## AI (also invoked internally)
- POST /ai/classify { text, image_meta? } → { category, subcategory, confidence }
- POST /ai/severity { report } → { score, label, rationale }
- POST /ai/duplicates { report, candidates[] } → { matches: [{id, similarity, reason}] }

## Sync
- POST /sync/push { items: [{client_request_id, entity_type, operation, payload}] } → { results: [{client_request_id, status, server_id?, error?}] }
- GET  /sync/pull?since=<iso>&limit= → { reports[], comments[], wards[], categories[], server_time }
- GET  /sync/status → { queue_depth_server? } (client uses own queue)

## Admin
- GET /admin/dashboard → KPIs
- GET /admin/triage?status=&... → reports
- GET /admin/audit?since= → AuditLog[]
- POST /admin/demo/seed → { created counts } (dev/demo only, gated by env DEMO_SEED_ENABLED)
- DELETE /admin/demo/purge → purge all is_demo records

## Notifications
- GET /notifications → Notification[]
- POST /notifications/{id}/read

## Health
- GET /health → { status, version, db, ai_mode }
