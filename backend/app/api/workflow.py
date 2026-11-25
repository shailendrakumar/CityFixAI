from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.agents.workflow import run_workflow
from app.services.audit import list_audit_logs

router = APIRouter(prefix='/workflow', tags=['workflow'])


@router.post('/run')
async def run(payload: dict):
    result = await run_workflow(payload)
    return result


@router.get('/audit')
async def audit(workflow_run_id: str | None = None, limit: int = 100, db: AsyncSession = Depends(get_db)):
    logs = await list_audit_logs(workflow_run_id, limit)
    return [
        {
            'id': l.id,
            'workflow_run_id': l.workflow_run_id,
            'agent': l.agent,
            'action': l.action,
            'status': l.status,
            'input_summary': l.input_summary,
            'output_summary': l.output_summary,
            'created_at': l.created_at.isoformat(),
        }
        for l in logs
    ]
