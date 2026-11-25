# CityFixAI — Product Architecture

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.
**Platforms:** Android, iOS, Web (React Native + Expo + Expo Router).
**Offline-first:** Report creation, local history, and queued submissions work without network.

## 1. Vision & Principles

CityFixAI is an **Agentic Civic Intelligence Platform** that helps citizens identify, report, track and resolve urban infrastructure and civic problems. It is NOT a government system: it tracks community-reported issues and provides AI-assisted triage, deduplication, severity scoring, and transparency. It never claims official government resolution without evidence.

Core principles:
1. **Offline-first** — a citizen can file a complete report with photos on a bus with no signal; it syncs later.
2. **Evidence-based status** — every status change is auditable; "resolved" requires evidence (photo + verifier).
3. **Synthetic demo data clearly labelled** — all seed/demo records carry `is_demo=true` and UI badges.
4. **Agentic AI, not magic** — LangGraph orchestrates classification/dedup/severity with deterministic fallbacks; every AI output is explainable and overridable by humans.
5. **Privacy by default** — location precision configurable; PII minimized; RLS on all tables.

## 2. High-Level Architecture

Client (Expo): Expo Router + Screens + Zustand + React Query over an Offline Data Layer (SQLite + FileSystem), drained by a Sync Engine (queue + retry + idempotency).

Backend (FastAPI): Auth (JWT/Supabase) + REST routers + LangGraph agents (classify/dedup/severity/explain) + SQLAlchemy async over PostgreSQL (Supabase) with RLS, Alembic migrations.

## 3. Repository Layout

CityFixAI/
  apps/mobile/   Expo app (Android/iOS/Web)
  backend/       FastAPI
  docs/
  scripts/

## 4. Offline-First Strategy

- Source of truth on device: SQLite. Every report written locally first with client UUID (local_id).
- Sync queue: each mutating op enqueues SyncQueueItem with idempotency key (client_request_id). Drains when online (NetInfo), exponential backoff + jitter, max retries, dead-letter.
- Conflict resolution: last-writer-wins with server timestamp for status; client edits re-open as "updated" event.
- Photos: app sandbox (expo-file-system); uploaded multipart on sync; local URI retained until server URL returned.
- Reads: lists from SQLite; background refresh pulls deltas (/sync/pull?since=).

## 5. Agentic AI (LangGraph)

Graph nodes: intake -> classify -> duplicate_detect -> severity_score -> explain -> persist. Each node has deterministic fallback (demo mode without LLM key). AI outputs stored with model_version, confidence, rationale.

## 6. Data Flow — Report Creation (Offline)

1. User captures photo + description + location.
2. Client creates Report row in SQLite (sync_status='pending'), saves photo to sandbox.
3. Enqueue create_report sync item.
4. UI shows "Saved locally — will sync" (optimistic).
5. Sync engine (when online) POSTs report + photo; server runs LangGraph; returns server_id + AI fields.
6. Client updates row (sync_status='synced', merge AI fields).
7. On failure: retry with backoff; after N retries mark failed; user can retry manually.

## 7. Non-Goals / Honesty Constraints

- No claim of official government resolution. Statuses are platform-tracked community states.
- No real government API integration claimed. Any "department" field is synthetic demo routing.
- Demo data clearly labelled SYNTHETIC.
- AI never auto-closes a report; human verification required for "resolved".
