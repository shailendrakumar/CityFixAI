from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.db import get_db
from app.api.deps import get_current_user, require_user, require_role
from app.models.notification import Notification
from app.schemas import NotificationOut, NotificationCreate
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix='/notifications', tags=['notifications'])


@router.get('', response_model=list[NotificationOut])
async def list_notifications(user_id: str | None = Query(None), limit: int = Query(50, le=200), db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    uid = user_id or (user.id if user else None)
    q = select(Notification)
    if uid:
        q = q.where((Notification.user_id == uid) | (Notification.user_id.is_(None)))
    q = q.order_by(desc(Notification.created_at)).limit(limit)
    res = await db.execute(q)
    return [NotificationOut.model_validate(n) for n in res.scalars().all()]


@router.post('', response_model=NotificationOut)
async def create_notification(body: NotificationCreate, db: AsyncSession = Depends(get_db), user=Depends(require_role('admin', 'moderator'))):
    n = Notification(id=str(uuid.uuid4()), user_id=body.user_id, title=body.title, body=body.body, type=body.type or 'info', data=body.data)
    db.add(n); await db.commit(); await db.refresh(n)
    return NotificationOut.model_validate(n)


@router.post('/{nid}/read', response_model=NotificationOut)
async def read_notification(nid: str, db: AsyncSession = Depends(get_db), user=Depends(require_user)):
    n = await db.get(Notification, nid)
    if not n:
        raise HTTPException(404, 'Not found')
    n.read = True
    await db.commit(); await db.refresh(n)
    return NotificationOut.model_validate(n)
