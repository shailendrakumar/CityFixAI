from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.user import User
from app.models.community import ContributionEvent, UserBadge, Badge, UserChallenge, CampaignParticipant
from app.models.report import Report
import uuid
from datetime import datetime, timezone


async def award_event(db: AsyncSession, user_id: str, event_type: str, points: int, report_id=None, ward_id=None, verified=True, reason=None, metadata=None, is_demo=False):
    # idempotency for report-linked events
    if report_id is not None:
        res = await db.execute(select(ContributionEvent).where(
            ContributionEvent.user_id == user_id,
            ContributionEvent.event_type == event_type,
            ContributionEvent.report_id == report_id,
        ))
        if res.scalar_one_or_none():
            return None
    ev = ContributionEvent(
        id=str(uuid.uuid4()),
        user_id=user_id,
        ward_id=ward_id,
        report_id=report_id,
        event_type=event_type,
        points=points,
        verified=verified,
        reason=reason,
        metadata_json=metadata,
        is_demo=is_demo,
    )
    db.add(ev)
    if verified:
        u = await db.get(User, user_id)
        if u:
            u.contribution_points = (u.contribution_points or 0) + points
    await db.commit()
    await db.refresh(ev)
    return ev


async def verify_event(db: AsyncSession, event_id: str, verifier_id: str):
    ev = await db.get(ContributionEvent, event_id)
    if not ev or ev.verified:
        return ev
    ev.verified = True
    u = await db.get(User, ev.user_id)
    if u:
        u.contribution_points = (u.contribution_points or 0) + ev.points
    await db.commit()
    await db.refresh(ev)
    return ev


async def award_badge(db: AsyncSession, user_id: str, badge_id: str, awarded_by=None, verified=True, is_demo=False):
    res = await db.execute(select(UserBadge).where(UserBadge.user_id == user_id, UserBadge.badge_id == badge_id))
    if res.scalar_one_or_none():
        return None
    ub = UserBadge(id=str(uuid.uuid4()), user_id=user_id, badge_id=badge_id, awarded_by=awarded_by, verified=verified, is_demo=is_demo)
    db.add(ub)
    # award badge points if any
    b = await db.get(Badge, badge_id)
    if b and b.points_reward:
        await award_event(db, user_id, 'badge_awarded', b.points_reward, reason=f'Badge {b.name}', is_demo=is_demo, verified=verified)
    await db.commit()
    await db.refresh(ub)
    return ub


def is_suspicious_report(ai: dict) -> bool:
    conf = ai.get('confidence', 1.0) or 0.0
    return conf < 0.7
