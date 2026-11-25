from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.db import get_db
from app.models.ward import Ward
from app.models.report import Report
from app.models.category import Category
from app.schemas import WardOut, CategoryOut

router = APIRouter(tags=['wards'])

@router.get('/wards', response_model=list[WardOut])
async def list_wards(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Ward))
    return [WardOut.model_validate(w) for w in res.scalars().all()]

@router.get('/wards/{wid}', response_model=WardOut)
async def get_ward(wid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Ward).where(Ward.id == wid))
    w = res.scalar_one_or_none()
    if not w: raise __import__('fastapi').HTTPException(404, 'Not found')
    return WardOut.model_validate(w)

@router.get('/wards/{wid}/analytics')
async def ward_analytics(wid: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Report).where(Report.ward_id == wid))
    reports = res.scalars().all()
    by_status = {}
    by_category = {}
    for r in reports:
        by_status[r.status] = by_status.get(r.status, 0) + 1
        by_category[r.category] = by_category.get(r.category, 0) + 1
    return {
        'ward_id': wid,
        'total': len(reports),
        'by_status': by_status,
        'by_category': by_category,
        'hotspots': [{'id': r.id, 'lat': r.lat, 'lng': r.lng, 'severity': r.severity_score} for r in sorted(reports, key=lambda x: -x.severity_score)[:5]],
        'note': 'Based on platform-tracked community reports (synthetic demo data where is_demo=true).',
    }

@router.get('/categories', response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Category))
    return [CategoryOut.model_validate(c) for c in res.scalars().all()]
