from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.db import get_db
from app.api.deps import get_current_user, require_user, require_role
from app.models.user import User
from app.models.ward import Ward
from app.models.report import Report
from app.models.community import (
    Badge, UserBadge, Challenge, UserChallenge, Campaign, CampaignParticipant,
    VolunteerRegistration, Announcement, ContributionEvent,
)
from app.schemas import (
    BadgeOut, UserBadgeOut, ChallengeOut, UserChallengeOut, CampaignOut,
    VolunteerRegistrationIn, VolunteerRegistrationOut, AnnouncementOut, AnnouncementIn,
    ContributionEventOut, LeaderboardEntry, WardLeaderboardEntry, AwardPointsRequest,
    CampaignParticipantIn, ChallengeProgressIn,
)
from app.services.community import award_event, award_badge, verify_event, is_suspicious_report
import uuid
from datetime import datetime, timezone

router = APIRouter(tags=['community'])
community_router = APIRouter(prefix='/community', tags=['community'])


def _dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace('Z', '+00:00'))
    except Exception:
        return None


# ---------- Badges ----------
@router.get('/badges', response_model=list[BadgeOut])
@community_router.get('/badges', response_model=list[BadgeOut])
async def list_badges(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Badge).order_by(Badge.created_at))
    return [BadgeOut.model_validate(b) for b in res.scalars().all()]


@router.post('/badges', response_model=BadgeOut)
@community_router.post('/badges', response_model=BadgeOut)
async def create_badge(body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    b = Badge(id=str(uuid.uuid4()), name=body.get('name', 'Badge'), description=body.get('description'), icon=body.get('icon'), criteria=body.get('criteria'), points_reward=body.get('points_reward', 0), is_demo=body.get('is_demo', False))
    db.add(b); await db.commit(); await db.refresh(b)
    return BadgeOut.model_validate(b)


@router.get('/users/{uid}/badges', response_model=list[UserBadgeOut])
@community_router.get('/users/{uid}/badges', response_model=list[UserBadgeOut])
async def user_badges(uid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(UserBadge).where(UserBadge.user_id == uid))
    out = []
    for ub in res.scalars().all():
        badge = await db.get(Badge, ub.badge_id)
        data = UserBadgeOut.model_validate(ub)
        data.badge = BadgeOut.model_validate(badge) if badge else None
        out.append(data)
    return out


@router.post('/users/{uid}/badges/{bid}', response_model=UserBadgeOut)
@community_router.post('/users/{uid}/badges/{bid}', response_model=UserBadgeOut)
async def award_user_badge(uid: str, bid: str, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    ub = await award_badge(db, uid, bid, awarded_by=user.id, verified=True)
    if ub is None:
        # already awarded
        res = await db.execute(select(UserBadge).where(UserBadge.user_id == uid, UserBadge.badge_id == bid))
        ub = res.scalar_one()
    badge = await db.get(Badge, bid)
    data = UserBadgeOut.model_validate(ub)
    data.badge = BadgeOut.model_validate(badge) if badge else None
    return data

# ---------- Challenges ----------
@router.get('/challenges', response_model=list[ChallengeOut])
@community_router.get('/challenges', response_model=list[ChallengeOut])
async def list_challenges(ward_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(Challenge)
    if ward_id:
        q = q.where((Challenge.ward_id == ward_id) | (Challenge.ward_id.is_(None)))
    res = await db.execute(q.order_by(Challenge.created_at.desc()))
    return [ChallengeOut.model_validate(c) for c in res.scalars().all()]


@router.post('/challenges', response_model=ChallengeOut)
@community_router.post('/challenges', response_model=ChallengeOut)
async def create_challenge(body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    c = Challenge(
        id=str(uuid.uuid4()),
        title=body.get('title', 'Challenge'),
        description=body.get('description'),
        start_at=_dt(body.get('start_at')),
        end_at=_dt(body.get('end_at')),
        goal_type=body.get('goal_type', 'reports'),
        target_count=body.get('target_count', 1),
        reward_points=body.get('reward_points', 0),
        reward_badge_id=body.get('reward_badge_id'),
        ward_id=body.get('ward_id'),
        is_demo=body.get('is_demo', False),
    )
    db.add(c); await db.commit(); await db.refresh(c)
    return ChallengeOut.model_validate(c)


@router.post('/challenges/{cid}/join')
@community_router.post('/challenges/{cid}/join')
async def join_challenge(cid: str, db: AsyncSession = Depends(get_db), user=Depends(require_user)):
    ch = await db.get(Challenge, cid)
    if not ch:
        raise HTTPException(404, 'Challenge not found')
    res = await db.execute(select(UserChallenge).where(UserChallenge.user_id == user.id, UserChallenge.challenge_id == cid))
    uc = res.scalar_one_or_none()
    if not uc:
        uc = UserChallenge(id=str(uuid.uuid4()), user_id=user.id, challenge_id=cid, progress=0)
        db.add(uc); await db.commit(); await db.refresh(uc)
    return {'status': 'joined', 'challenge_id': cid, 'user_id': user.id}


@router.get('/challenges/{cid}/progress', response_model=UserChallengeOut)
@community_router.get('/challenges/{cid}/progress', response_model=UserChallengeOut)
async def challenge_progress(cid: str, user_id: str | None = Query(None), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    uid = user_id or (user.id if user else None)
    if not uid:
        raise HTTPException(400, 'user_id required')
    res = await db.execute(select(UserChallenge).where(UserChallenge.user_id == uid, UserChallenge.challenge_id == cid))
    uc = res.scalar_one_or_none()
    if not uc:
        raise HTTPException(404, 'Not joined')
    return UserChallengeOut.model_validate(uc)


@router.post('/challenges/{cid}/progress')
@community_router.post('/challenges/{cid}/progress')
async def update_challenge_progress(cid: str, body: ChallengeProgressIn, user_id: str | None = Query(None), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    uid = user_id or (user.id if user else None)
    if not uid:
        raise HTTPException(400, 'user_id required')
    res = await db.execute(select(UserChallenge).where(UserChallenge.user_id == uid, UserChallenge.challenge_id == cid))
    uc = res.scalar_one_or_none()
    if not uc:
        uc = UserChallenge(id=str(uuid.uuid4()), user_id=uid, challenge_id=cid, progress=0)
        db.add(uc)
    uc.progress = body.progress
    ch = await db.get(Challenge, cid)
    if ch and uc.progress >= ch.target_count and not uc.completed_at:
        uc.completed_at = datetime.now(timezone.utc)
        if ch.reward_points:
            await award_event(db, uid, 'challenge_completed', ch.reward_points, reason=f'Challenge {ch.title}', verified=True)
        if ch.reward_badge_id:
            await award_badge(db, uid, ch.reward_badge_id, verified=True)
    uc.updated_at = datetime.now(timezone.utc)
    await db.commit(); await db.refresh(uc)
    return UserChallengeOut.model_validate(uc)


# ---------- Campaigns ----------
@router.get('/campaigns', response_model=list[CampaignOut])
@community_router.get('/campaigns', response_model=list[CampaignOut])
async def list_campaigns(ward_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(Campaign)
    if ward_id:
        q = q.where(Campaign.ward_id == ward_id)
    res = await db.execute(q.order_by(Campaign.created_at.desc()))
    return [CampaignOut.model_validate(c) for c in res.scalars().all()]


@router.post('/campaigns', response_model=CampaignOut)
@community_router.post('/campaigns', response_model=CampaignOut)
async def create_campaign(body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    c = Campaign(
        id=str(uuid.uuid4()),
        title=body.get('title', 'Campaign'),
        description=body.get('description'),
        ward_id=body.get('ward_id'),
        location=body.get('location'),
        start_at=_dt(body.get('start_at')),
        end_at=_dt(body.get('end_at')),
        status=body.get('status', 'upcoming'),
        organizer_id=(user.id if user else None),
        is_demo=body.get('is_demo', False),
    )
    db.add(c); await db.commit(); await db.refresh(c)
    return CampaignOut.model_validate(c)


@router.post('/campaigns/{cid}/register')
@community_router.post('/campaigns/{cid}/register')
async def register_campaign(cid: str, body: CampaignParticipantIn | None = None, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    c = await db.get(Campaign, cid)
    if not c:
        raise HTTPException(404, 'Campaign not found')
    body = body or CampaignParticipantIn()
    name = body.name or (user.display_name if user else 'Citizen')
    email = body.email or (user.email if user else None)
    p = CampaignParticipant(id=str(uuid.uuid4()), campaign_id=cid, user_id=(user.id if user else None), name=name, email=email)
    db.add(p); await db.commit(); await db.refresh(p)
    return {'status': 'registered', 'participant_id': p.id, 'campaign_id': cid}


@router.get('/campaigns/{cid}/participants')
@community_router.get('/campaigns/{cid}/participants')
async def campaign_participants(cid: str, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    res = await db.execute(select(CampaignParticipant).where(CampaignParticipant.campaign_id == cid))
    return [{'id': p.id, 'user_id': p.user_id, 'name': p.name, 'email': p.email, 'registered_at': p.registered_at.isoformat(), 'attended': p.attended} for p in res.scalars().all()]


@router.post('/campaigns/{cid}/verify-attendance')
@community_router.post('/campaigns/{cid}/verify-attendance')
async def verify_attendance(cid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    pid = body.get('participant_id')
    p = await db.get(CampaignParticipant, pid)
    if not p or p.campaign_id != cid:
        raise HTTPException(404, 'Participant not found')
    p.attended = True
    p.verified_by = user.id
    p.verified_at = datetime.now(timezone.utc)
    await db.commit()
    if p.user_id:
        await award_event(db, p.user_id, 'campaign_participation', 20, reason='Campaign attendance verified', verified=True)
    return {'status': 'verified', 'participant_id': pid}


# ---------- Announcements ----------
@router.get('/announcements', response_model=list[AnnouncementOut])
@community_router.get('/announcements', response_model=list[AnnouncementOut])
async def list_announcements(ward_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(Announcement)
    if ward_id:
        q = q.where((Announcement.ward_id == ward_id) | (Announcement.ward_id.is_(None)))
    res = await db.execute(q.order_by(Announcement.created_at.desc()))
    return [AnnouncementOut.model_validate(a) for a in res.scalars().all()]


@router.post('/announcements', response_model=AnnouncementOut)
@community_router.post('/announcements', response_model=AnnouncementOut)
async def create_announcement(body: AnnouncementIn, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    a = Announcement(id=str(uuid.uuid4()), title=body.title, body=body.body, ward_id=body.ward_id, priority=body.priority or 'normal', author_id=user.id)
    db.add(a); await db.commit(); await db.refresh(a)
    return AnnouncementOut.model_validate(a)


# ---------- Volunteers ----------
@router.post('/volunteers', response_model=VolunteerRegistrationOut)
@community_router.post('/volunteers', response_model=VolunteerRegistrationOut)
async def register_volunteer(body: VolunteerRegistrationIn, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    v = VolunteerRegistration(
        id=str(uuid.uuid4()),
        user_id=(user.id if user else None),
        name=body.name,
        email=body.email or (user.email if user else None),
        phone=body.phone,
        ward_id=body.ward_id or (user.ward_id if user else None),
        skills=body.skills,
        availability=body.availability,
        status='pending',
    )
    db.add(v); await db.commit(); await db.refresh(v)
    return VolunteerRegistrationOut.model_validate(v)


@router.get('/volunteers', response_model=list[VolunteerRegistrationOut])
@community_router.get('/volunteers', response_model=list[VolunteerRegistrationOut])
async def list_volunteers(status: str | None = Query(None), db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    q = select(VolunteerRegistration)
    if status:
        q = q.where(VolunteerRegistration.status == status)
    res = await db.execute(q.order_by(VolunteerRegistration.created_at.desc()))
    return [VolunteerRegistrationOut.model_validate(v) for v in res.scalars().all()]


@router.patch('/volunteers/{vid}', response_model=VolunteerRegistrationOut)
@community_router.patch('/volunteers/{vid}', response_model=VolunteerRegistrationOut)
async def update_volunteer(vid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    v = await db.get(VolunteerRegistration, vid)
    if not v:
        raise HTTPException(404, 'Not found')
    if 'status' in body:
        v.status = body['status']
    await db.commit(); await db.refresh(v)
    return VolunteerRegistrationOut.model_validate(v)


# ---------- Points / Contributions ----------
@router.get('/points/{uid}')
@community_router.get('/points/{uid}')
async def user_points(uid: str, db: AsyncSession = Depends(get_db)):
    u = await db.get(User, uid)
    if not u:
        raise HTTPException(404, 'User not found')
    res = await db.execute(select(ContributionEvent).where(ContributionEvent.user_id == uid).order_by(ContributionEvent.created_at.desc()))
    events = res.scalars().all()
    return {'user_id': uid, 'points': u.contribution_points or 0, 'events': [ContributionEventOut.model_validate(e) for e in events]}


@router.get('/users/{uid}/contributions', response_model=list[ContributionEventOut])
@community_router.get('/users/{uid}/contributions', response_model=list[ContributionEventOut])
async def user_contributions(uid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(ContributionEvent).where(ContributionEvent.user_id == uid).order_by(ContributionEvent.created_at.desc()))
    return [ContributionEventOut.model_validate(e) for e in res.scalars().all()]


@router.get('/contributions', response_model=list[ContributionEventOut])
@community_router.get('/contributions', response_model=list[ContributionEventOut])
async def list_contributions(user_id: str | None = Query(None), db: AsyncSession = Depends(get_db)):
    q = select(ContributionEvent)
    if user_id:
        q = q.where(ContributionEvent.user_id == user_id)
    res = await db.execute(q.order_by(ContributionEvent.created_at.desc()))
    return [ContributionEventOut.model_validate(e) for e in res.scalars().all()]


@router.post('/points/award')
@community_router.post('/points/award')
async def award_points_endpoint(body: AwardPointsRequest, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    ev = await award_event(db, body.user_id, body.event_type, body.points, report_id=body.report_id, ward_id=body.ward_id, verified=body.verified, reason=body.reason)
    return {'status': 'awarded', 'event_id': (ev.id if ev else None)}


@router.post('/points/{eid}/verify')
@community_router.post('/points/{eid}/verify')
async def verify_points(eid: str, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    ev = await verify_event(db, eid, user.id)
    if not ev:
        raise HTTPException(404, 'Event not found')
    return {'status': 'verified', 'event_id': ev.id}


# ---------- Leaderboards ----------
@router.get('/leaderboard', response_model=list[LeaderboardEntry])
@community_router.get('/leaderboard', response_model=list[LeaderboardEntry])
async def leaderboard(ward_id: str | None = Query(None), limit: int = Query(50, le=200), db: AsyncSession = Depends(get_db)):
    q = select(User)
    if ward_id:
        q = q.where(User.ward_id == ward_id)
    res = await db.execute(q.order_by(desc(User.contribution_points)).limit(limit))
    users = res.scalars().all()
    out = []
    for i, u in enumerate(users, start=1):
        bres = await db.execute(select(UserBadge).where(UserBadge.user_id == u.id))
        badges = [ub.badge_id for ub in bres.scalars().all()]
        out.append(LeaderboardEntry(user_id=u.id, display_name=u.display_name, ward_id=u.ward_id, points=u.contribution_points or 0, rank=i, badges=badges))
    return out


@router.get('/leaderboard/wards', response_model=list[WardLeaderboardEntry])
@community_router.get('/leaderboard/wards', response_model=list[WardLeaderboardEntry])
async def ward_leaderboard(db: AsyncSession = Depends(get_db)):
    wards = (await db.execute(select(Ward))).scalars().all()
    out = []
    for w in wards:
        users = (await db.execute(select(User).where(User.ward_id == w.id))).scalars().all()
        pts = sum((u.contribution_points or 0) for u in users)
        out.append(WardLeaderboardEntry(ward_id=w.id, ward_name=w.name, points=pts, contributors=len(users)))
    out.sort(key=lambda x: -x.points)
    for i, e in enumerate(out, start=1):
        e.rank = i
    return out


@router.get('/leaderboard/wards/{wid}', response_model=list[LeaderboardEntry])
@community_router.get('/leaderboard/wards/{wid}', response_model=list[LeaderboardEntry])
async def ward_leaderboard_users(wid: str, limit: int = Query(50, le=200), db: AsyncSession = Depends(get_db)):
    return await leaderboard(ward_id=wid, limit=limit, db=db)

