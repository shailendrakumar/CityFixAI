# CityFixAI — Data Models

All timestamps ISO-8601 UTC. IDs are UUID v4. `is_demo` boolean on seed records.

## Client (SQLite)

### reports
- id TEXT PK (client uuid = local_id)
- server_id TEXT NULL
- user_id TEXT NULL (device/account)
- title TEXT NOT NULL
- description TEXT
- category TEXT NOT NULL
- subcategory TEXT
- severity_score INTEGER (0-100)
- severity_label TEXT (low|medium|high|critical)
- status TEXT (draft|open|in_progress|resolved_pending_verification|resolved|duplicate|rejected)
- lat REAL, lng REAL
- address TEXT
- ward_id TEXT
- photo_uris TEXT (JSON array of local paths)
- server_photo_urls TEXT (JSON array)
- ai_category TEXT, ai_severity INTEGER, ai_confidence REAL, ai_rationale TEXT, ai_model_version TEXT
- duplicate_of TEXT NULL (report id)
- upvote_count INTEGER DEFAULT 0
- is_demo INTEGER DEFAULT 0
- sync_status TEXT (pending|syncing|synced|failed)
- sync_error TEXT
- created_at TEXT, updated_at TEXT, resolved_at TEXT

### sync_queue
- id TEXT PK
- entity_type TEXT (report|comment|vote|status)
- entity_id TEXT
- operation TEXT (create|update|delete|upvote|comment)
- payload TEXT (JSON)
- client_request_id TEXT UNIQUE (idempotency)
- attempts INTEGER DEFAULT 0
- max_attempts INTEGER DEFAULT 8
- next_retry_at TEXT
- status TEXT (queued|in_flight|done|dead)
- last_error TEXT
- created_at TEXT

### categories (cached)
- id TEXT PK, name, icon, color, default_severity, description, is_demo

### wards (cached)
- id TEXT PK, name, city, boundary_geojson TEXT, population INTEGER, is_demo

### comments (cached/local)
- id TEXT PK, report_id, user_id, author_name, body, is_demo, created_at, sync_status

### users (local profile)
- id TEXT PK, email, display_name, role, ward_id, is_demo, created_at

### meta
- key TEXT PK, value TEXT (last_sync_at, device_id, etc.)

## Server (PostgreSQL/Supabase)

Mirrors client with server-authoritative columns: `id` (server uuid), `client_request_id` UNIQUE, `created_at`, `updated_at`, `deleted_at` (soft delete). Additional:
- reports: `reporter_id FK users`, `verified_by FK users`, `department_code TEXT (synthetic)`, `embedding VECTOR(384)` for dedup, `search_tsv tsvector`.
- RLS: citizens read public reports; write own; admins all.
- Indexes: (ward_id, status), (category, created_at), GIN on search_tsv, pgvector index on embedding.

## Enums
- ReportStatus, SeverityLabel, SyncStatus, SyncOp, UserRole (citizen/moderator/admin).

## Synthetic Demo Data
- Seed users: `demo-citizen-1..n`, `demo-admin-1`.
- Seed reports: ~40 across 5 wards, labelled is_demo=true, author names "Demo Citizen".
- Seed wards: 5 synthetic city wards with polygon boundaries.
- All demo records carry `is_demo=true` and are filterable/excludable.
