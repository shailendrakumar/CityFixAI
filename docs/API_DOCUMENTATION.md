# CityFixAI — API Documentation

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

**Base URL**
- Production: `https://api.cityfixai.vercel.app`
- Local development: `http://localhost:8000`

**OpenAPI/Swagger**
- `GET /openapi.json` — machine-readable API spec.
- `GET /docs` — Swagger UI (development only).
- `GET /redoc` — ReDoc (development only).

**Authentication**
All API routes require JWT Bearer token except:
- `GET /health`
- `GET /reports` (list, filtered — no auth required for browsing)

Token obtained via `POST /auth/login` or `POST /auth/signup`.

---

## AI

| Method | Endpoint | Description |
|---|---|---|
| `POST /ai/classify` | Text classification |
| `POST /ai/severity` | Severity scoring |
| `POST /ai/duplicates` | Duplicate detection |
| `POST /ai/priority` | Priority ranking |
| `POST /ai/analyze` | Full analysis (classify + severity + dedup + priority) |
| `POST /ai/classify-image` | Image classification (multipart) |
## Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST /auth/signup` | Register account |
| `POST /auth/login` | Login |
| `POST /auth/refresh` | Refresh access token |
| `POST /auth/logout` | Logout |
| `GET /auth/me` | Get current user |

## Workflow

| Method | Endpoint | Description |
|---|---|---|
| `POST /workflow/run` | Run 8-agent triage workflow |
| `GET /workflow/audit` | List audit logs |

### POST /workflow/run
**Description**: Execute the full LangGraph agentic workflow for report triage.

## Sync

| Method | Endpoint | Description |
|---|---|---|
| `POST /sync/push` | Sync client reports to server |
| `GET /sync/pull` | Pull new reports since timestamp |
| `GET /sync/status` | Sync service status |

### POST /sync/push
**Description**: Push pending reports from client device to server.
## Wards & Categories

| Method | Endpoint | Description |
|---|---|---|
| `GET /wards` | List wards |
| `GET /wards/{id}` | Get ward detail |
| `GET /wards/{id}/analytics` | Ward analytics |
| `GET /categories` | List categories |

### GET /wards/{id}/analytics
## Community

| Method | Endpoint | Description |
|---|---|---|
| `GET /community/badges` | List badges |
| `GET /community/challenges` | List challenges |
| `GET /community/campaigns` | List campaigns |
| `GET /community/announcements` | List announcements |
| `GET /community/leaderboard` | Global leaderboard |
| `GET /community/points/{uid}` | User points |
## Health

| Method | Endpoint | Description |
|---|---|---|
| `GET /health` | Health check |

### GET /health
**Description**: Health check endpoint. Includes AI mode and sample classification.

**Response**:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "ai_mode": "heuristic",
  "ai_sample": "pothole",
  "supabase_configured": true,
  "supabase_storage_bucket": "cityfix-uploads"
}
```

**Errors**: None expected (always returns 200 with status info).
```

### GET /community/points/{uid}
**Description**: Get user's contribution points and event history.

**Response**:
```json
{
  "user_id": "uid",
  "points": 125,
  "events": [
    {"event_id": "ev-1", "type": "report_submitted", "points": 10, "verified": true},
    {"event_id": "ev-2", "type": "badge_awarded", "points": 25, "verified": true}
  ]
}
```
**Description**: Get analytics for a specific ward.

**Response**:
```json
{
  "ward_id": "ward-northbridge",
  "total": 24,
  "by_status": {"open": 18, "resolved": 6},
  "by_category": {"pothole": 10, "streetlight": 5, "water_leak": 3, "other": 6},
  "hotspots": [
    {"id": "report-uuid", "lat": 40.7, "lng": -74.0, "severity": 85}
  ],
  "note": "Based on platform-tracked community reports (synthetic demo data where is_demo=true)."
}
```

**Request body**:
```json
{
  "items": [
    {
      "client_request_id": "unique-id",
      "entity_type": "report",
      "operation": "create",
      "payload": {
        "title": "Report title",
        "description": "Report description",
        "category": "pothole",
        "lat": 40.7128,
        "lng": -74.0060
      }
    }
  ]
}
```

**Response**: `SyncPushResponse` with results for each item.

### GET /sync/pull
**Description**: Pull new reports from server since a given timestamp.

**Query parameters**:
- `since`: ISO 8601 timestamp (optional)
- `limit`: Max reports to return (default 200, max 1000)

**Response**:
```json
{
  "reports": [...],
  "server_time": "2025-01-15T10:30:00Z"
}
```
**Request body**:
```json
{
  "report": {
    "title": "Large pothole on main road near school",
    "description": "Deep pothole causing accidents, near elementary school",
    "category": "pothole",
    "lat": 40.7128,
    "lng": -74.0060
  },
  "existing_reports": [],
  "human_approved": false,
  "human_role": "citizen",
  "max_retries": 2
}
```

**Response**: Full workflow state including agent outputs, status, resolution_allowed, audit summary.

### GET /workflow/audit
**Description**: Retrieve persisted audit log entries for a workflow run.

**Query parameters**:
- `workflow_run_id`: Filter by specific run ID
- `limit`: Max number of entries (default 100, max 200)
```
### POST /auth/signup
**Request body**:
```json
{
  "email": "user@example.com",
  "password": "secure-password",
  "display_name": "Citizen"
}
```

**Response**:
```json
{
  "access_token": "jwt-token",
  "refresh_token": "refresh-token",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "display_name": "Citizen",
    "role": "citizen",
    "ward_id": null,
    "contribution_points": 0,
    "is_demo": false
  }
}
```

### POST /ai/classify
**Description**: Classify text into a civic issue category.

**Request body**:
```json
{
  "text": "Large pothole on main road near school"
}
```

**Response**:
```json
{
  "category": "pothole",
  "confidence": 0.85
}
```

### POST /ai/analyze
**Description**: Full 8-agent workflow triage.

**Request body**:
```json
{
  "text": "Large pothole on main road near school",
  "lat": 40.7128,
  "lng": -74.0060,
  "candidates": []
}
```

**Response**:
```json
{
  "category": "pothole",
  "confidence": 0.85,
  "severity_score": 90,
  "severity_label": "critical",
  "rationale": "base 60+20(school)+10(large)=90",
  "duplicates": [],
  "priority": "critical"
}
```
## Reports

| Method | Endpoint | Description |
|---|---|---|
| `POST /reports` | Create report |
| `GET /reports` | List reports |
| `GET /reports/{id}` | Get report detail |
| `PATCH /reports/{id}` | Partially update report |
| `POST /reports/{id}/upvote` | Upvote report |
| `POST /reports/{id}/comments` | Add comment |
| `GET /reports/{id}/comments` | List comments |
| `POST /reports/{id}/status` | Change status (admin/mod only) |
| `POST /reports/{id}/merge` | Mark as duplicate (admin/mod only) |
| `POST /reports/{id}/images` | Upload report image |

### POST /reports
**Description**: Create a new civic report.

**Request body**:
```json
{
  "client_request_id": "optional-id-for-idempotency",
  "title": "Pothole on main road",
  "description": "Large pothole causing accidents, near bus stop",
  "category": "pothole",
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "Main St & 1st Ave, New York, NY",
  "ward_id": "ward-northbridge",
  "anonymous": false,
  "photo_urls": []
}
```

**Response**: `ReportOut` model

**Errors**:
- `400` — Validation error (invalid category, missing required fields)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (anonymous reports not allowed in this deployment)
- `413` — Payload too large (file exceeds limit)