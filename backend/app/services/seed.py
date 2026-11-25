import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ward import Ward
from app.models.category import Category
from app.models.report import Report
from app.models.user import User
from app.core.config import get_settings

DEMO_WARDS = [
    ('ward-northbridge', 'Northbridge', 42000),
    ('ward-riverside', 'Riverside', 38000),
    ('ward-oldtown', 'Old Town', 25000),
    ('ward-tech', 'Tech District', 31000),
    ('ward-greenfield', 'Greenfield', 29000),
]

CATEGORIES = [
    ('pothole', 'Pothole', '🕳️', '#ef4444', 60),
    ('streetlight', 'Broken Streetlight', '💡', '#f59e0b', 40),
    ('water_leak', 'Water Leak', '💧', '#3b82f6', 70),
    ('trash', 'Trash / Dumping', '🗑️', '#84cc16', 30),
    ('sidewalk', 'Sidewalk Damage', '🚶', '#a855f7', 45),
    ('graffiti', 'Graffiti', '🎨', '#ec4899', 15),
    ('traffic_signal', 'Traffic Signal', '🚦', '#f97316', 80),
    ('other', 'Other', '📌', '#6b7280', 30),
]

TITLES = {
    'pothole': ['Large pothole near bus stop', 'Pothole on main road'],
    'streetlight': ['Streetlight out for 2 weeks', 'Flickering lamp post'],
    'water_leak': ['Water pooling on sidewalk', 'Leaking pipe near park'],
    'trash': ['Illegal dumping behind store', 'Overflowing bin'],
    'sidewalk': ['Cracked sidewalk tripping hazard', 'Blocked wheelchair access'],
    'graffiti': ['Graffiti on underpass'],
    'traffic_signal': ['Signal not changing'],
    'other': ['Abandoned vehicle', 'Noise complaint'],
}

SEVS = ['low', 'medium', 'high', 'critical']
SCORES = {'low': 20, 'medium': 45, 'high': 75, 'critical': 90}
STATUSES = ['open', 'in_progress', 'resolved_pending_verification', 'resolved']

async def seed_demo(db: AsyncSession):
    if not get_settings().demo_seed_enabled:
        return
    # wards
    for wid, name, pop in DEMO_WARDS:
        db.add(Ward(id=wid, name=name, city='Demo City', population=pop, is_demo=True))
    # categories
    for cid, name, icon, color, sev in CATEGORIES:
        db.add(Category(id=cid, name=name, icon=icon, color=color, default_severity=sev, is_demo=False))
    # users
    for i in range(1, 6):
        db.add(User(id=f'demo-citizen-{i}', email=f'demo{i}@example.com', display_name=f'Demo Citizen {i}', role='citizen', ward_id=f'ward-{["northbridge","riverside","oldtown","tech","greenfield"][i-1]}', is_demo=True))
    from app.core.security import hash_password
    db.add(User(id='demo-admin-1', email='admin@example.com', display_name='Demo Admin', role='admin', password_hash=hash_password('admin'), is_demo=True))
    # reports
    import math
    i = 0
    for wid, _, _ in DEMO_WARDS:
        for j in range(8):
            cat = list(TITLES.keys())[(i + j) % len(TITLES)]
            title = TITLES[cat][(i + j) % len(TITLES[cat])]
            sev = SEVS[(i + j) % len(SEVS)]
            status = STATUSES[(i + j) % len(STATUSES)]
            lat = 40.7128 + (math.sin(i + j) * 0.02)
            lng = -74.006 + (math.cos(i + j) * 0.02)
            db.add(Report(
                id=str(uuid.uuid4()),
                client_request_id=None,
                reporter_id=f'demo-citizen-{(i % 5) + 1}',
                title=f'[DEMO] {title}',
                description=f'Synthetic demo report for {cat}. Clearly labelled demo data.',
                category=cat,
                severity_score=SCORES[sev],
                severity_label=sev,
                status=status,
                lat=lat, lng=lng,
                address=f'Demo St {(i + j) * 3 + 1}, Demo City',
                ward_id=wid,
                is_demo=True,
                ai_category=cat,
                ai_severity=SCORES[sev],
                ai_confidence=0.8,
                ai_rationale='Demo seed: pre-classified.',
                ai_model_version='demo-seed-v1',
                department_code='DEMO-PW-01',
            ))
            i += 1
    # community engagement seed
    from app.models.community import Badge, Challenge, Campaign, Announcement, ContributionEvent
    from datetime import datetime, timezone, timedelta
    badges = [
        ('first_report', 'First Report', 'Submitted your first issue', '🏅', 'Submit 1 report', 0),
        ('eagle_eye', 'Eagle Eye', '5 reports submitted', '👁️', 'Submit 5 reports', 0),
        ('resolver', 'Resolver', 'Verified a resolution', '✅', 'Verify 1 resolution', 0),
        ('community_hero', 'Community Hero', 'Top 10 contributor', '🦸', 'Reach top 10 leaderboard', 0),
        ('cleanup_champion', 'Cleanup Champion', 'Joined a cleanup campaign', '🧹', 'Participate in cleanup', 0),
    ]
    for bid, name, desc, icon, crit, pts in badges:
        db.add(Badge(id=bid, name=name, description=desc, icon=icon, criteria=crit, points_reward=pts, is_demo=True))
    now = datetime.now(timezone.utc)
    db.add(Challenge(id='challenge-monthly-reporter', title='Monthly Reporter', description='Submit 3 reports this month', start_at=now.replace(day=1), end_at=(now.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1), goal_type='reports', target_count=3, reward_points=50, reward_badge_id='eagle_eye', is_demo=True))
    db.add(Challenge(id='challenge-cleanup', title='Community Cleanup', description='Join a cleanup campaign', start_at=now, end_at=now + timedelta(days=30), goal_type='campaign', target_count=1, reward_points=30, reward_badge_id='cleanup_champion', is_demo=True))
    db.add(Campaign(id='campaign-northbridge-cleanup', title='Northbridge Cleanup Day', description='Community cleanup in Northbridge', ward_id='ward-northbridge', location='Northbridge Park', start_at=now + timedelta(days=7), end_at=now + timedelta(days=7, hours=4), status='upcoming', is_demo=True))
    db.add(Announcement(id='ann-welcome', title='Welcome to CityFixAI', body='Report civic issues and earn community points. Synthetic demo data.', priority='normal', is_demo=True))
    # contribution points for demo users
    for i in range(1, 6):
        pts = 320 - (i - 1) * 40
        db.add(ContributionEvent(id=str(__import__('uuid').uuid4()), user_id=f'demo-citizen-{i}', event_type='seed_points', points=pts, verified=True, reason='Demo seed contribution points', is_demo=True))
        u = await db.get(User, f'demo-citizen-{i}')
        if u:
            u.contribution_points = pts
    await db.commit()
