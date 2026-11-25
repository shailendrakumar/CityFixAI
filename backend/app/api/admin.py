from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.db import get_db
from app.api.deps import require_role
from app.models.report import Report
from app.models.user import User
from app.models.ward import Ward
from app.models.status_history import StatusHistory
from app.services.seed import seed_demo
from app.services.audit import persist_audit_entries
from app.services.community import award_event, award_badge
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix='/admin', tags=['admin'])


@router.get('/dashboard')
async def dashboard(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    total = await db.scalar(select(func.count()).select_from(Report))
    pending = await db.scalar(select(func.count()).select_from(Report).where(Report.status == 'open'))
    under_review = await db.scalar(select(func.count()).select_from(Report).where(Report.status == 'pending_human_review'))
    in_progress = await db.scalar(select(func.count()).select_from(Report).where(Report.status == 'in_progress'))
    resolved = await db.scalar(select(func.count()).select_from(Report).where(Report.status == 'resolved'))
    high_priority = await db.scalar(select(func.count()).select_from(Report).where(Report.severity_score >= 60))
    duplicates = await db.scalar(select(func.count()).select_from(Report).where(Report.status == 'duplicate'))
    return {
        'total_reports': total or 0,
        'pending': pending or 0,
        'under_review': under_review or 0,
        'in_progress': in_progress or 0,
        'verified_resolved': resolved or 0,
        'high_priority': high_priority or 0,
        'duplicate_reports': duplicates or 0,
        'synthetic_demo_data': True,
    }
@router.get('/wards/analytics')
async def ward_analytics(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    wards = (await db.execute(select(Ward))).scalars().all()
    out = []
    for w in wards:
        reports = (await db.execute(select(Report).where(Report.ward_id == w.id))).scalars().all()
        by_status = {}
        by_category = {}
        for r in reports:
            by_status[r.status] = by_status.get(r.status, 0) + 1
            by_category[r.category] = by_category.get(r.category, 0) + 1
        out.append({
            'ward_id': w.id,
            'ward_name': w.name,
            'total': len(reports),
            'by_status': by_status,
            'by_category': by_category,
            'hotspots': [{'id': r.id, 'lat': r.lat, 'lng': r.lng, 'severity': r.severity_score} for r in sorted(reports, key=lambda x: -x.severity_score)[:5]],
        })
    return {'wards': out, 'synthetic_demo_data': True}


@router.get('/categories/distribution')
async def category_distribution(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    rows = (await db.execute(select(Report.category, func.count()).group_by(Report.category))).all()
    return {'distribution': [{'category': c, 'count': n} for c, n in rows], 'synthetic_demo_data': True}


@router.get('/hotspots')
async def hotspots(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    reports = (await db.execute(select(Report))).scalars().all()
    centers = []
    for r in reports:
        nearby = [o for o in reports if abs(o.lat - r.lat) < 0.0025 and abs(o.lng - r.lng) < 0.0025]
        if len(nearby) >= 3 and not any(abs(c['lat'] - r.lat) < 0.001 and abs(c['lng'] - r.lng) < 0.001 for c in centers):
            centers.append({'lat': r.lat, 'lng': r.lng, 'count': len(nearby), 'severity_avg': round(sum(o.severity_score for o in nearby) / len(nearby), 1)})
    return {'hotspots': centers, 'synthetic_demo_data': True}


@router.get('/duplicates')
async def duplicate_groups(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    reports = (await db.execute(select(Report))).scalars().all()
    groups = []
    seen = set()
    for r in reports:
        if r.id in seen:
            continue
        similars = [o for o in reports if o.id != r.id and o.category == r.category and abs(o.lat - r.lat) < 0.0006 and abs(o.lng - r.lng) < 0.0006]
        if similars:
            grp = [r] + similars
            for g in grp:
                seen.add(g.id)
            groups.append({'primary': r.id, 'members': [x.id for x in grp], 'count': len(grp)})
    return {'groups': groups, 'synthetic_demo_data': True}
@router.post('/reports/{rid}/assign')
async def assign_report(rid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, 'Not found')
    r.assigned_to = body.get('assigned_to')
    r.department_code = body.get('department_code', r.department_code)
    r.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await persist_audit_entries([{
        'id': str(uuid.uuid4()),
        'workflow_run_id': None,
        'agent': 'admin',
        'action': 'assign_report',
        'status': 'ok',
        'input_summary': rid,
        'output_summary': r.assigned_to,
        'details': {'assigned_to': r.assigned_to, 'by': user.id},
        'created_at': datetime.now(timezone.utc).isoformat(),
    }])
    return {'id': r.id, 'assigned_to': r.assigned_to, 'department_code': r.department_code}


@router.post('/reports/{rid}/status')
async def set_status(rid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, 'Not found')
    new_status = body.get('status', r.status)
    note = body.get('note')
    evidence = body.get('evidence_photo_url')
    if new_status == 'resolved' and not evidence:
        raise HTTPException(400, 'Resolution requires verified evidence photo URL')
    r.status = new_status
    if new_status == 'resolved':
        r.resolved_at = datetime.now(timezone.utc)
    r.updated_at = datetime.now(timezone.utc)
    hist = StatusHistory(
        id=str(uuid.uuid4()),
        report_id=rid,
        status=new_status,
        note=note,
        evidence_photo_url=evidence,
        changed_by=user.id,
    )
    db.add(hist)
    await db.commit()
    if new_status == 'resolved' and evidence:
        if r.reporter_id:
            await award_event(db, r.reporter_id, 'resolution_verified', 25, report_id=r.id, ward_id=r.ward_id, verified=True, reason='Report resolved with verified evidence')
        await award_event(db, user.id, 'verification_performed', 15, report_id=r.id, ward_id=r.ward_id, verified=True, reason='Verified resolution')
        await award_badge(db, user.id, 'resolver', awarded_by=user.id, verified=True)
    await persist_audit_entries([{
        'id': str(uuid.uuid4()),
        'workflow_run_id': None,
        'agent': 'admin',
        'action': 'status_change',
        'status': 'ok',
        'input_summary': rid,
        'output_summary': new_status,
        'details': {'status': new_status, 'note': note, 'evidence': evidence, 'by': user.id},
        'created_at': datetime.now(timezone.utc).isoformat(),
    }])
    return {'id': r.id, 'status': r.status, 'resolved_at': r.resolved_at}


@router.get('/reports/{rid}/history')
async def report_history(rid: str, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    rows = (await db.execute(select(StatusHistory).where(StatusHistory.report_id == rid).order_by(StatusHistory.created_at))).scalars().all()
    return [{'id': h.id, 'status': h.status, 'note': h.note, 'evidence_photo_url': h.evidence_photo_url, 'changed_by': h.changed_by, 'created_at': h.created_at.isoformat()} for h in rows]


@router.get('/triage')
async def triage(status: str | None = None, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    q = select(Report)
    if status:
        q = q.where(Report.status == status)
    q = q.order_by(Report.created_at.desc()).limit(200)
    res = await db.execute(q)
    return [{'id': r.id, 'title': r.title, 'status': r.status, 'severity': r.severity_score, 'ward_id': r.ward_id, 'assigned_to': r.assigned_to, 'is_demo': r.is_demo} for r in res.scalars().all()]


@router.post('/demo/seed')
async def demo_seed(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin'))):
    from app.core.config import get_settings
    if not get_settings().demo_seed_enabled:
        raise HTTPException(403, 'Demo seed disabled')
    await seed_demo(db)
    return {'status': 'seeded', 'synthetic_demo_data': True}


@router.delete('/demo/purge')
async def demo_purge(db: AsyncSession = Depends(get_db), user=Depends(require_role('admin'))):
    res = await db.execute(select(Report).where(Report.is_demo == True))
    for r in res.scalars().all():
        await db.delete(r)
    await db.commit()
    return {'status': 'purged'}
