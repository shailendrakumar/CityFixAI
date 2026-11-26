# CityFixAI — Database Schema

## Overview

CityFixAI uses PostgreSQL via Supabase with Row Level Security (RLS). All tables have RLS policies. Demo data is clearly labelled with `is_demo=true`.

## Core Tables

### reports

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| client_request_id | UUID | UNIQUE, idempotency key |
| reporter_id | UUID | FK to users |
| title | VARCHAR | NOT NULL, max 200 chars |
| description | TEXT | NULLABLE, max 4000 chars |
| category | VARCHAR | FK to categories |
| subcategory | VARCHAR | NULLABLE |
| severity_score | INTEGER | DEFAULT 0, 0-100 |
| severity | VARCHAR | DEFAULT "low" |
| status | VARCHAR | DEFAULT "open" |
| lat | FLOAT | NOT NULL |
| lng | FLOAT | NOT NULL |
| address | VARCHAR | NULLABLE |
| ward_id | UUID | FK to wards |
| photo_urls | JSONB | DEFAULT "[]" |
| ai_category | VARCHAR | NULLABLE |
| ai_severity | INTEGER | NULLABLE |
| ai_confidence | REAL | NULLABLE |
| ai_rationale | TEXT | NULLABLE |
| ai_model_version | VARCHAR | NULLABLE |
| duplicate_of | UUID | FK to reports (self) |
| upvote_count | INTEGER | DEFAULT 0 |
| is_demo | BOOLEAN | DEFAULT FALSE |
| sync_status | VARCHAR | DEFAULT "pending" |
| sync_error | TEXT | NULLABLE |
| server_updated_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |
| resolved_at | TIMESTAMPTZ | NULLABLE |

### Indexes

- `idx_reports_ward` ON reports(ward_id)
- `idx_reports_status` ON reports(status)
- `idx_reports_category` ON reports(category)
- `idx_reports_created` ON reports(created_at)
- `idx_reports_severity` ON reports(severity_score)
- `idx_sync_entity` ON sync_queue(entity_type, entity_id)
### wards
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| name | VARCHAR | NOT NULL |
| city | VARCHAR | DEFAULT "Demo City" |
| boundary_geojson | JSONB | NULLABLE |
| population | INTEGER | DEFAULT 0 |
| is_demo | BOOLEAN | DEFAULT TRUE |

### categories
| Column | Type | Constraints |
|---|---|---|
| id | VARCHAR(20) | PRIMARY KEY |
| name | VARCHAR | NOT NULL |
| icon | VARCHAR | NULLABLE |
| color | VARCHAR | NULLABLE |
| default_severity | INTEGER | DEFAULT 30 |
| description | TEXT | NULLABLE |
| is_demo | BOOLEAN | DEFAULT FALSE |

### users
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| email | VARCHAR | UNIQUE |
| password_hash | VARCHAR | NULLABLE (Supabase handles auth) |
| display_name | VARCHAR | DEFAULT "Citizen" |
| role | VARCHAR | DEFAULT "citizen", CHECK (role IN ('citizen', 'moderator', 'admin')) |
| ward_id | UUID | NULLABLE, FK to wards |
| contribution_points | INTEGER | DEFAULT 0 |
| is_demo | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### comments
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| report_id | UUID | FK to reports ON DELETE CASCADE |
| user_id | UUID | NULLABLE, FK to users |
| author_name | VARCHAR | NULLABLE |
| body | TEXT | NOT NULL |
| is_demo | BOOLEAN | DEFAULT FALSE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### report_images
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| report_id | UUID | FK to reports ON DELETE CASCADE |
| filename | VARCHAR | NULLABLE |
| content_type | VARCHAR | NULLABLE |
| url | VARCHAR | NULLABLE |
| uploader_id | UUID | NULLABLE, FK to users |
| created_at | TIMESTAMPTZ | DEFAULT now() |

### audit_logs
| Column | Type | Constraints |
|---|---|---|
| id | UUID | PRIMARY KEY |
| workflow_run_id | UUID | NULLABLE |
| agent | VARCHAR | NULLABLE |
| action | VARCHAR | NULLABLE |
| status | VARCHAR | NULLABLE |
| input_summary | TEXT | NULLABLE |
| output_summary | TEXT | NULLABLE |
| details | JSONB | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

## Row Level Security (RLS Policies)

### civic_issues (reports)
- **Public**: SELECT (read access)
- **Authenticated**: INSERT (own reports only)
- **Owner**: UPDATE (own reports)
- **Owner/Admin**: DELETE (own reports)

### notifications
- **Owner**: SELECT, UPDATE
- **Others**: No access

### citizen_rewards
- **Owner or mod**: SELECT
- **Mod**: WRITE (insert/update)

### Storage
- **Public**: READ (public assets)
- **Authenticated**: UPLOAD (to own folder only)

## Demo Data Seeding
- Controlled by `DEMO_SEED_ENABLED` env flag
- All seeded records have `is_demo=true`
- Demo reports use synthetic names ("Demo Citizen 1"), synthetic wards, synthetic addresses
- Statuses represent platform-tracked community state only, never official government action
- "Resolved" requires evidence photo + verifier note; clearly marked "community-verified"
- `department_code` is synthetic routing label (e.g., "DEMO-PW-01"), marked "demo routing"
- Demo seed gated by env `DEMO_SEED_ENABLED=true`; production default false
- Purge endpoint removes all `is_demo` records
- Analytics from demo data labelled "Based on synthetic demo data"

## Migration Versions

### v1: initial_schema
All tables above, plus:
- `sync_queue` table (id, entity_type, entity_id, operation, payload, client_request_id, attempts, max_attempts, next_retry_at, status, last_error, created_at)
- `categories` seed data (8 categories)
- `wards` seed data (5 wards with is_demo=true)
- `users` seed data (5 citizens + 1 admin with is_demo=true)
- `reports` seed data (~40 reports distributed across wards/categories)
- `community` seed data (badges, challenges, campaigns, announcements)

### v2: add_conflict_columns
- Add `client_request_id` column to `reports` (UNIQUE, for idempotency)
- Add `server_updated_at` column to `reports`
- Add index `idx_reports_client_req` ON reports(client_request_id)

### v3: add_rls_policies
- Enable RLS on all tables
- Add RLS policies as described above
- Set up storage bucket policies

### v4: add_fulltext_indexes
- Add full-text search indexes on reports.title and reports.description
- Add `tsvector` column for search (if needed)
- `idx_comments_report` ON comments(report_id)