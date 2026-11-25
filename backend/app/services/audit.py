# app/services/audit.py
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


async def persist_audit_entries(entries: list[dict], db: AsyncSession | None = None) -> None:
    from app.core.db import SessionLocal
    async with (db if db else SessionLocal()) as session:
        for e in entries:
            log = AuditLog(
                id=e['id'],
                workflow_run_id=e.get('workflow_run_id'),
                agent=e.get('agent', 'unknown'),
                action=e.get('action', 'unknown'),
                status=e.get('status', 'ok'),
                input_summary=e.get('input_summary'),
                output_summary=e.get('output_summary'),
                details=e.get('details'),
            )
            session.add(log)
        await session.commit()


async def list_audit_logs(workflow_run_id: str | None = None, limit: int = 100):
    from app.core.db import SessionLocal
    async with SessionLocal() as session:
        q = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit)
        if workflow_run_id:
            q = q.where(AuditLog.workflow_run_id == workflow_run_id)
        res = await session.execute(q)
        return [r for r in res.scalars().all()]