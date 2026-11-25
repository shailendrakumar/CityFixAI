import os
from fastapi import UploadFile, File, Form
from app.core.config import get_settings

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.models.report import Report
from app.api.deps import get_current_user, require_user, require_role
from app.schemas import ReportCreate, ReportOut, ReportPatch
from app.agents.civic_agent import run_agent
from app.services.community import award_event, is_suspicious_report
import uuid

router = APIRouter(prefix='/reports', tags=['reports'])

def report_to_out(r: Report) -> ReportOut:
    return ReportOut.model_validate(r)

@router.post('', response_model=ReportOut)
async def create_report(body: ReportCreate, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    if body.client_request_id:
        res = await db.execute(select(Report).where(Report.client_request_id == body.client_request_id))
        existing = res.scalar_one_or_none()
        if existing:
            return report_to_out(existing)
    reporter_id = None if body.anonymous else (user.id if user else None)
    suspicious = False
    existing_reports = []
    res = await db.execute(select(Report))
    for r in res.scalars().all():
        existing_reports.append({'id': r.id, 'title': r.title, 'description': r.description or '', 'category': r.category, 'lat': r.lat, 'lng': r.lng})
    ai = run_agent(body.title + ' ' + (body.description or ''), body.lat, body.lng, existing_reports)
    suspicious = is_suspicious_report(ai)
    r = Report(
        id=str(uuid.uuid4()),
        client_request_id=body.client_request_id,
        reporter_id=reporter_id,
        title=body.title,
        description=body.description,
        category=body.category or ai['category'],
        severity_score=ai['severity_score'],
        severity_label=ai['severity_label'],
        status=('pending_human_review' if suspicious else 'open'),
        lat=body.lat,
        lng=body.lng,
        address=body.address,
        ward_id=body.ward_id,
        photo_urls=body.photo_urls or [],
        ai_category=ai['category'],
        ai_severity=ai['severity_score'],
        ai_confidence=ai['confidence'],
        ai_rationale=ai['rationale'],
        ai_model_version=ai['model_version'],
        duplicate_of=(ai['duplicates'][0]['id'] if ai['duplicates'] else None),
        is_demo=False,
    )
    db.add(r); await db.commit(); await db.refresh(r)
    if reporter_id and not suspicious and not r.duplicate_of:
        await award_event(db, reporter_id, 'report_submitted', 10, report_id=r.id, ward_id=r.ward_id, verified=True, reason='Unique report submitted')
    return report_to_out(r)
@router.patch('/{rid}', response_model=ReportOut)
async def patch_report(rid: str, body: ReportPatch, db: AsyncSession = Depends(get_db), user=Depends(require_user)):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r: raise HTTPException(404, 'Not found')
    if r.reporter_id != user.id and user.role != 'admin':
        raise HTTPException(403, 'Forbidden')
    if body.title is not None: r.title = body.title
    if body.description is not None: r.description = body.description
    if body.category is not None: r.category = body.category
    from datetime import datetime, timezone
    r.updated_at = datetime.now(timezone.utc)
    await db.commit(); await db.refresh(r)
    return report_to_out(r)

@router.post('/{rid}/upvote')
async def upvote(rid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r: raise HTTPException(404, 'Not found')
    r.upvote_count += 1
    await db.commit()
    return {'upvote_count': r.upvote_count, 'voted': True}

@router.post('/{rid}/comments')
async def add_comment(rid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    from app.models.comment import Comment
    c = Comment(id=str(uuid.uuid4()), report_id=rid, user_id=(user.id if user else None), author_name=(user.display_name if user else 'Anonymous'), body=body.get('body', ''))
    db.add(c); await db.commit(); await db.refresh(c)
    return {'id': c.id, 'report_id': c.report_id, 'body': c.body, 'author_name': c.author_name, 'created_at': c.created_at.isoformat()}

@router.get('/{rid}/comments')
async def list_comments(rid: str, db: AsyncSession = Depends(get_db)):
    from app.models.comment import Comment
    res = await db.execute(select(Comment).where(Comment.report_id == rid).order_by(Comment.created_at))
    return [{'id': c.id, 'report_id': c.report_id, 'body': c.body, 'author_name': c.author_name, 'created_at': c.created_at.isoformat()} for c in res.scalars().all()]

@router.post('/{rid}/status')
async def set_status(rid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r: raise HTTPException(404, 'Not found')
    r.status = body.get('status', r.status)
    if r.status == 'resolved':
        from datetime import datetime, timezone
        r.resolved_at = datetime.now(timezone.utc)
    await db.commit(); await db.refresh(r)
    return report_to_out(r)

@router.post('/{rid}/merge')
async def merge(rid: str, body: dict, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    target_id = body.get('target_id')
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r: raise HTTPException(404, 'Not found')
    r.status = 'duplicate'
    r.duplicate_of = target_id
    await db.commit()
    return report_to_out(r)
@router.get('', response_model=list[ReportOut])
async def list_reports(
    ward_id: str | None = Query(None),
    category: str | None = Query(None),
    status: str | None = Query(None),
    severity_min: int | None = Query(None),
    sort: str | None = Query('newest'),
    cursor: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(100, le=500),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import Query
    q = select(Report)
    if ward_id: q = q.where(Report.ward_id == ward_id)
    if category: q = q.where(Report.category == category)
    if status: q = q.where(Report.status == status)
    if severity_min is not None: q = q.where(Report.severity_score >= severity_min)
    if cursor:
        try:
            from datetime import datetime
            cdt = datetime.fromisoformat(cursor.replace('Z', '+00:00'))
            q = q.where(Report.created_at < cdt)
        except Exception:
            pass
    if sort == 'severity':
        q = q.order_by(Report.severity_score.desc(), Report.created_at.desc())
    elif sort == 'upvotes':
        q = q.order_by(Report.upvote_count.desc(), Report.created_at.desc())
    else:
        q = q.order_by(Report.created_at.desc())
    q = q.offset(offset).limit(limit)
    res = await db.execute(q)
    return [report_to_out(r) for r in res.scalars().all()]

@router.get('/{rid}', response_model=ReportOut)
async def get_report(rid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r: raise HTTPException(404, 'Not found')
    return report_to_out(r)

@router.post('/{rid}/images')
async def upload_report_image(rid: str, file: UploadFile = File(...), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    from app.models.image import ReportImage
    res = await db.execute(select(Report).where(Report.id == rid))
    r = res.scalar_one_or_none()
    if not r:
        raise HTTPException(404, 'Report not found')
    settings = get_settings()
    ext = os.path.splitext(file.filename or 'image.jpg')[1] or '.jpg'
    fname = f'{rid}_{uuid.uuid4().hex}{ext}'
    content = await file.read()
    from app.services.storage import store_bytes
    url = await store_bytes(fname, content, file.content_type)
    img = ReportImage(id=str(uuid.uuid4()), report_id=rid, filename=fname, content_type=file.content_type, url=url, uploader_id=(user.id if user else None))
    db.add(img)
    # attach to report photo_urls if not present
    if url not in (r.photo_urls or []):
        r.photo_urls = (r.photo_urls or []) + [url]
        r.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(img)
    return {'id': img.id, 'report_id': rid, 'url': url, 'filename': fname}
