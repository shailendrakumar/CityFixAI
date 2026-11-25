# CityFixAI — User Journeys

## Persona A: Citizen (primary)
Goals: quickly report an issue, see if it's already reported, track progress, engage community.

### Journey 1 — First report (offline capable)
1. Open app → Home (map + nearby issues). No login required for browsing; login prompted on submit.
2. Tap FAB "Report" → Report wizard step 1: capture photo (camera or gallery), optional second photo.
3. Step 2: describe issue (text + voice-to-text optional), pick category (AI suggests), auto-detect location (GPS) with manual pin adjust.
4. Step 3: review AI preview (category, severity, duplicate candidates) — editable.
5. Step 4: submit → saved locally, queued; toast "Saved offline — will sync". Redirect to My Reports.
6. When online, sync completes; push notification "Report synced + classified"; status becomes "Triaged".

### Journey 2 — Duplicate awareness
- During step 3, if a similar report exists within 50m + same category in last 30 days, show "Possible duplicate" card with link. User can upvote existing instead of creating new, or proceed and server marks as duplicate.

### Journey 3 — Track & engage
- My Reports → detail: timeline of status changes, comments, upvotes, photos. Can add comment, upvote, share link.
- Community feed: browse by ward/category, filter by status, sort by severity/upvotes.

### Journey 4 — Ward analytics (citizen)
- Wards tab → select ward → stats: open issues by category, avg resolution time (platform-tracked), hotspot heatmap, top contributors.

## Persona B: Moderator/Admin
Goals: triage queue, verify resolutions, manage duplicates, publish analytics.

### Journey 5 — Admin triage
- Login with admin role → Admin Dashboard: pending sync queue health, untriaged reports, duplicate candidates needing merge decision, flagged content.
- Report detail (admin): change status (open→in_progress→resolved_pending_verification→resolved), add note, assign synthetic department, merge duplicates.
- Resolution requires evidence photo + verifier note; system records `resolved_at`, `resolved_by`.

### Journey 6 — Analytics export
- Export ward report CSV (synthetic demo labelled) for transparency.

## Persona C: Anonymous/Guest
- Can browse public reports & map. Submitting requires account (or device-scoped anonymous with email verification later). Offline queue persists across app restarts.

## Key UX Decisions
- Report wizard is 4 steps max, each < 30s; progress indicator.
- All destructive/irreversible actions confirm.
- Offline banner always visible when no network.
- Demo data badge on every seeded record.
- Accessibility: min touch targets 44px, screen reader labels, high contrast mode.
- i18n-ready (strings externalized) for future localization.
