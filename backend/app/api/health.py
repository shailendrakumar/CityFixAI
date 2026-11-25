from fastapi import APIRouter
from app.core.config import get_settings
from app.agents.civic_agent import run_agent

router = APIRouter(tags=['health'])

@router.get('/health')
async def health():
    s = get_settings()
    # quick AI smoke
    ai = run_agent('pothole on main road', 40.7, -74.0, [])
    return {'status': 'ok', 'version': s.version, 'ai_mode': 'heuristic', 'ai_sample': ai['category']}
