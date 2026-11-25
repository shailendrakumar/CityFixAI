# CityFixAI — Security Plan

## Authentication & Authorization
- Supabase Auth (email+password, magic link). JWT access (short-lived) + refresh. Stored in SecureStore (native) / httpOnly cookie (web).
- Roles: citizen (default), moderator, admin. Role in JWT claims + server-side check (never trust client).
- Row-Level Security on all tables: citizens read public reports; insert own; update own while status=open; admins all.

## Input Validation
- Pydantic v2 schemas with strict types; reject unknown fields.
- File uploads: validate MIME (jpeg/png/webp/heic), max 10MB, dimensions <= 4096px; strip EXIF GPS optionally (user choice); re-encode.
- Text: length limits, profanity filter on public fields, sanitize HTML (no rich text stored raw).

## Transport & Secrets
- HTTPS only (HSTS). CORS allowlist (app origins). Secrets via env (.env not committed); rotate keys.
- Rate limiting: per-IP and per-user on auth, report creation, comments (slowapi/redis).
- Request size limits.

## Data Privacy
- Location precision user-configurable (exact / ~100m / ward-only).
- PII minimization: store email only in auth; display_name optional; reports can be anonymous (reporter_id null).
- Right to delete: user can delete account → soft-delete reports, anonymize.
- Audit log for admin actions and status changes.

## Offline Queue Integrity
- Idempotency keys (client_request_id) prevent duplicate submissions.
- Queue persisted in SQLite; tamper-evident not required (local device trust).
- On sync conflict, server wins for status; client notified.

## AI Safety
- AI outputs are suggestions; humans approve status changes. No auto-resolution.
- Prompt injection mitigation: user text treated as data, not instructions; structured output via JSON schema; validate enum values.
- Model version + confidence stored; low confidence flagged for human review.

## Mobile Security
- Expo SecureStore for tokens; no tokens in AsyncStorage.
- Certificate pinning optional (prod).
- Screenshot protection for sensitive admin screens (optional).

## Demo Data
- Demo seed gated by env DEMO_SEED_ENABLED and admin role; purgable. UI always labels demo records.

## Threat Model (summary)
- Abuse/spam: rate limits + moderation queue + report flagging.
- Location stalking: precision controls + no real-time tracking.
- Data exfiltration: RLS + least privilege service account.
- Supply chain: lockfile, dependency audits in CI.
