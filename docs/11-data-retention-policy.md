# CityFixAI — Data Retention & Privacy Policy

## Minimum data collection
- Email is stored only in Supabase Auth.
- Display name is optional.
- Reports may be submitted anonymously (reporter_id null).
- Phone numbers are collected only for volunteer registrations and are visible to moderators/admins only.

## Consent
- Camera and location permissions are requested at point of use with explicit user consent.
- Location precision is user-configurable: exact, ~100m, or ward-only.

## Retention
- Resolved reports: retained for 365 days (configurable via DATA_RETENTION_DAYS), then purged by scheduled job.
- Rejected/spam reports: retained for 30 days.
- Audit logs: retained for 2 years.
- Account deletion: user row removed; reports anonymized (reporter_id set to null).

## Account deletion
- Endpoint: DELETE /auth/me
- Revokes tokens and anonymizes associated reports.

## PII exposure controls
- /auth/me returns the caller's own profile only.
- Public endpoints (reports, leaderboard) never expose email or phone.
- RLS ensures users can only read their own notifications and profile.