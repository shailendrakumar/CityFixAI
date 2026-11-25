# CityFixAI — Screen Specifications

Routing via Expo Router (file-based). Tabs: (tabs)/index (Home/Map), (tabs)/feed, (tabs)/report (wizard), (tabs)/my-reports, (tabs)/wards, (tabs)/profile. Admin under (admin)/.

## Tab: Home (Map)
- MapView with clustered pins colored by severity (green low → red critical). Tap pin → bottom sheet preview (title, category, status, upvotes) → detail.
- Floating search/filter bar: category, status, severity, radius.
- Offline banner; "Last synced: X".
- Demo badge if any visible demo pins.

## Tab: Feed (Community)
- Infinite list of reports (FlatList) with card: photo thumb, title, category chip, severity, status, ward, upvotes, time.
- Filters: ward, category, status, sort (newest/severity/upvotes).
- Pull-to-refresh (triggers sync).

## Tab: Report (Wizard) — modal stack
- Step 1 Capture: camera/gallery, preview, retake; optional 2nd photo.
- Step 2 Describe: title (auto from AI), description textarea, category selector (AI-suggested highlighted), location map pin + address, anonymous toggle.
- Step 3 Review: AI preview card (category, severity, rationale, duplicate candidates). Editable. Confidence shown.
- Step 4 Submit: confirm, offline indicator, success animation → My Reports.

## Tab: My Reports
- List of own reports with sync status chip (pending/syncing/synced/failed) + retry button.
- Detail screen: full photos, AI fields, status timeline, comments, actions (edit while open, delete local if unsynced).

## Tab: Wards
- Ward list → Ward detail: stats cards, category breakdown chart, hotspot list, recent reports, top contributors (demo labelled).

## Tab: Profile
- Account, settings (location precision, notifications, theme), sync status, export my data, sign out, demo mode toggle.

## Admin (role-gated)
- Dashboard: KPIs (open, in progress, resolved this week), queue health, duplicate candidates.
- Triage queue: filterable report list with bulk actions.
- Report admin detail: status transitions, merge duplicates, assign department (synthetic), add resolution evidence.
- Users, audit log, analytics export.

## Shared Components
- OfflineBanner, SyncStatusChip, SeverityBadge, CategoryChip, DemoBadge, MapView (platform adapter), PhotoCapture, LocationPicker, EmptyState, ErrorState, LoadingSkeleton.

## Empty/Error States
- Every list has empty state with CTA; errors show retry; offline shows cached data + banner.
