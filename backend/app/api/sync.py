from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.db import get_db
from app.api.deps import get_current_user
from app.models.report import Report
from app.schemas import SyncPushRequest, SyncPushResponse, SyncPushResult
from app.agents.civic_agent import run_agent
from app.services.community import award_event, is_suspicious_report
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix='/sync', tags=['sync'])

@router.post('/push', response_model=SyncPushResponse)
async def sync_push(body: SyncPushRequest, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    results = []
    for item in body.items:
        try:
            if item.entity_type == 'report' and item.operation == 'create':
                payload = item.payload
                # idempotency
                res = await db.execute(select(Report).where(Report.client_request_id == item.client_request_id))
                existing = res.scalar_one_or_none()
                if existing:
                    results.append(SyncPushResult(client_request_id=item.client_request_id, status='ok', server_id=existing.id, server_fields={}))
                    continue
                existing_reports = []
                rres = await db.execute(select(Report))
                for r in rres.scalars().all():
                    existing_reports.append({'id': r.id, 'title': r.title, 'description': r.description or '', 'category': r.category, 'lat': r.lat, 'lng': r.lng})
                ai = run_agent((payload.get('title') or '') + ' ' + (payload.get('description') or ''), payload['lat'], payload['lng'], existing_reports)
                suspicious = is_suspicious_report(ai)
                reporter_id = payload.get('user_id') or (user.id if user else None)
                if payload.get('anonymous'):
                    reporter_id = None
                r = Report(
                    id=str(uuid.uuid4()),
                    client_request_id=item.client_request_id,
                    reporter_id=reporter_id,
                    title=payload.get('title', 'Untitled'),
                    description=payload.get('description', ''),
                    category=payload.get('category') or ai['category'],
                    severity_score=ai['severity_score'],
                    severity_label=ai['severity_label'],
                    status=('pending_human_review' if suspicious else 'open'),
                    lat=payload['lat'],
                    lng=payload['lng'],
                    address=payload.get('address'),
                    photo_urls=payload.get('photo_urls', []),
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
                    await award_event(db, reporter_id, 'report_submitted', 10, report_id=r.id, ward_id=r.ward_id, verified=True, reason='Synced unique report')
                results.append(SyncPushResult(client_request_id=item.client_request_id, status='ok', server_id=r.id, server_fields={
                    'serverId': r.id, 'aiCategory': r.ai_category, 'aiSeverity': r.ai_severity,
                    'aiConfidence': r.ai_confidence, 'aiRationale': r.ai_rationale,
                    'aiModelVersion': r.ai_model_version, 'severityScore': r.severity_score,
                    'severityLabel': r.severity_label, 'duplicateOf': r.duplicate_of,
                }))
            else:
                results.append(SyncPushResult(client_request_id=item.client_request_id, status='ok'))
        except Exception as e:
            results.append(SyncPushResult(client_request_id=item.client_request_id, status='error', error=str(e)))
    return SyncPushResponse(results=results)

@router.get('/pull')
async def sync_pull(since: str | None = Query(None), limit: int = Query(200, le=1000), db: AsyncSession = Depends(get_db)):
    q = select(Report)
    if since:
        try:
            dt = datetime.fromisoformat(since.replace('Z', '+00:00'))
            q = q.where(Report.updated_at > dt)
        except Exception:
            pass
    q = q.order_by(Report.updated_at).limit(limit)
    res = await db.execute(q)
    reports = res.scalars().all()
    return {
        'reports': [{
            'id': r.id, 'title': r.title, 'description': r.description, 'category': r.category,
            'severity_score': r.severity_score, 'severity_label': r.severity_label, 'status': r.status,
            'lat': r.lat, 'lng': r.lng, 'address': r.address, 'ward_id': r.ward_id,
            'photo_urls': r.photo_urls, 'ai_category': r.ai_category, 'ai_severity': r.ai_severity,
            'ai_confidence': r.ai_confidence, 'ai_rationale': r.ai_rationale,
            'ai_model_version': r.ai_model_version, 'duplicate_of': r.duplicate_of,
            'upvote_count': r.upvote_count, 'is_demo': r.is_demo,
            'created_at': r.created_at.isoformat(), 'updated_at': r.updated_at.isoformat(),
        } for r in reports],
        'server_time': datetime.now(timezone.utc).isoformat(),
    }

@router.get('/status')
async def sync_status():
    return {'status': 'ok'}
