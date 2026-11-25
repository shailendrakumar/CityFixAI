# CityFixAI — Synthetic Demo Data Policy

## Principle
CityFixAI never fakes government integration or claims real-world resolution. All demo/seed data is explicitly synthetic and labelled.

## Rules
1. Every seeded record has `is_demo = true`.
2. UI renders a "SYNTHETIC DEMO DATA" badge on any record with is_demo=true (list cards, detail, map pins tooltip).
3. Demo reports use synthetic names ("Demo Citizen 1"), synthetic wards, synthetic addresses.
4. Statuses represent **platform-tracked community state only**, never official government action. Copy uses "community-reported", "platform status".
5. "Resolved" requires evidence photo + verifier note; even then copy says "Marked resolved on CityFixAI (community-verified)" — not "government fixed".
6. No real department integration: `department_code` is a synthetic routing label (e.g., "DEMO-PW-01"), clearly marked "demo routing".
7. Demo seed is gated by env `DEMO_SEED_ENABLED=true` and admin role; production default false.
8. Purge endpoint removes all is_demo records.
9. Analytics derived from demo data labelled "Based on synthetic demo data".
10. Disclaimers in app: footer + about screen + first-run modal.

## Demo Data Set (seed)
- 5 wards: "Northbridge", "Riverside", "Old Town", "Tech District", "Greenfield" (fictional).
- 8 categories: Pothole, Broken Streetlight, Water Leak, Trash/Dumping, Sidewalk Damage, Graffiti, Traffic Signal, Other.
- ~40 reports distributed across wards/categories with varied severity/status.
- 6 demo users (5 citizens + 1 admin).
- Comments/upvotes seeded.

## Honesty Checklist (release gate)
- [ ] No string claims "government resolved" or "official".
- [ ] All demo records badged.
- [ ] AI rationale says "suggestion".
- [ ] About screen disclaimer present.
- [ ] Seed endpoint gated.
