# CityFixAI — Security and Privacy

**Tagline:** Report Smarter. Resolve Faster. Build Better Cities.

**Status:** Phase 0 (Planning) — synthetic demo data policy applies throughout.

## Authentication

### JWT Tokens (HS256)
- Access tokens: 15-minute expiry with `jti` for revocation
- Refresh tokens: 7-day expiry with `jti` for revocation
- Password hashing: bcrypt via passlib context
- Token revocation: In-process dict (`_REVOKED`); for multi-worker, use Redis or shared DB

## Authorization

### Role-Based Access Control

| Role | Permissions |
|---|---|
| `citizen` | Create own reports, view own reports, upvote reports, add comments to own reports, view community features (badges, leaderboard) |
| `moderator` | All citizen permissions + moderate reports (change status, merge duplicates) + award badges + verify resolutions + access community management endpoints |
| `admin` | All moderator permissions + user management (create/edit/delete users) + seed/purge demo data + access all administrative endpoints + configure system settings |

### Dependency Decorators
- `get_current_user`: Gets current user from JWT, returns None if not authenticated
- `require_user`: Requires authentication, raises 401 if missing
- `require_role('admin', 'moderator')`: Requires specific role, raises 403 if insufficient

## Data Privacy

### PII Minimization
- Email: Primary PII; stored encrypted via Supabase
- Phone: Optional field; not displayed publicly
- Location: Configurable precision via `location_precision_default` setting (default: 'exact')
- Display name: Shown publicly; can be changed by user

### Row Level Security (RLS)
All Supabase tables have RLS policies enabled:

| Table | Policy | Details |
|---|---|---|
| `civic_issues` (reports) | Public READ | Anyone can view reports |
| | Auth INSERT | Authenticated users can insert their own reports |
| | Owner UPDATE | Report reporter can update their own report |
| | Owner/Admin DELETE | Reporter or admin can delete their own report |
| `notifications` | Owner READ/UPDATE | Users can only access their own notifications |
| `citizen_rewards` | Owner/Mod READ | Users or moderators can view reward data |
| | Mod WRITE | Moderators can write/manage rewards |
| Storage | Public READ | Public assets are readable |
| | Authenticated UPLOAD | Authenticated users can upload to their own folder |

### Input Sanitization
- `sanitize_text()`: Strips HTML tags, control characters; enforces max length
- Prompt injection detection: Regex patterns in `vision_classifier.py` detect and sanitize prompt injection attempts in user-provided hints
- File upload validation: Content-type + magic-byte verification (JPEG/PNG/WebP/HEIC headers)
- SQL injection protection: SQLAlchemy parameterized queries + Supabase RLS

### Rate Limiting
- General API: 120 requests/minute (configurable via `RATE_LIMIT_PER_MINUTE`)
- Auth endpoints: 10 requests/minute (login/refresh)
- Upload endpoints: 20 requests/minute
- Per-client IP tracking with exponential backoff on 429 responses

### Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy`: Configured via middleware

## Synthetic Demo Data Policy

### Principle
CityFixAI never fakes government integration or claims real-world resolution. All demo/seed data is explicitly synthetic and labelled.

### Rules
1. Every seeded record has `is_demo = true`
2. UI renders "SYNTHETIC DEMO DATA" badge on any record with `is_demo=true`
3. Demo reports use synthetic names ("Demo Citizen 1"), synthetic wards, synthetic addresses
4. Statuses represent **platform-tracked community state only**, never official government action
5. "Resolved" requires evidence photo + verifier note; even then copy says "Marked resolved on CityFixAI (community-verified)" — not "government fixed"
6. `department_code` is a synthetic routing label (e.g., "DEMO-PW-01"), clearly marked "demo routing"
7. Demo seed gated by env `DEMO_SEED_ENABLED=true`; production default false
8. Purge endpoint removes all `is_demo` records
9. Analytics derived from demo data labelled "Based on synthetic demo data"
10. Disclaimers in app: footer, about screen, first-run modal

### Honesty Checklist (release gate)
- [ ] No string claims "government resolved" or "official"
- [ ] All demo records badged with SYNTHETIC DEMO DATA
- [ ] AI rationale says "suggestion" or includes "fallback"
- [ ] About screen disclaimer present
- [ ] Seed endpoint gated by DEMO_SEED_ENABLED
- [ ] Purge endpoint works correctly

## Security Scanning & Dependencies

### Regular Scans
- `pip-audit` for known vulnerabilities
- `safety check` for dependency security
- GitHub Dependabot (automated PRs for dependency updates)

### Dependency Management
- `requirements.txt` pinned to specific versions
- GitHub Actions CI runs security checks on every PR

### Secrets Management
- Never commit API keys or production secrets to version control
- Use GitHub Actions secrets for all production credentials
- Branch protection rules on `main` require PR reviews
- Production CORS origins are explicitly allowlisted
- HTTPS enforced on all deployed endpoints
- Security headers via middleware

### Audit Logging
- Every agent action, status change, and user operation recorded in `audit_logs` table
- Includes: agent name, action, status, input summary, output summary, timestamp
- Used for: Security incident investigation, compliance reporting, system debugging
- Retention: 365 days default (configurable via `DATA_RETENTION_DAYS`)
### Supabase Auth Integration
- Password login: Email + password flow
- Magic links: Email authentication links (planned)
- Social auth: Apple, Google (planned)
- Token verification: FastAPI middleware verifies Supabase JWTs via `/auth/v1/user`