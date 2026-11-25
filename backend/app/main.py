from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.core.config import get_settings
from app.core.db import init_db, SessionLocal
from app.middleware.observability import configure_logging, RequestLoggingMiddleware, RateLimitMiddleware
from app.models import User, Report, Ward, Category, Comment, AuditLog, StatusHistory
from app.models import Badge, UserBadge, Challenge, UserChallenge, Campaign, CampaignParticipant, VolunteerRegistration, Announcement, ContributionEvent, ReportImage, Notification
from app.api import auth, reports, wards, sync, admin, health, ai, workflow, community, notifications
from app.services.seed import seed_demo
from sqlalchemy import select, func

settings = get_settings()
configure_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    async with SessionLocal() as db:
        n = await db.scalar(select(func.count()).select_from(Report))
        if (n or 0) == 0 and settings.demo_seed_enabled:
            await seed_demo(db)
    yield

app = FastAPI(title=settings.app_name, version=settings.version, lifespan=lifespan, docs_url='/docs', redoc_url='/redoc', openapi_url='/openapi.json')
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(RateLimitMiddleware, limit_per_minute=settings.rate_limit_per_minute)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount('/uploads', StaticFiles(directory=settings.upload_dir), name='uploads')
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(reports.router)
app.include_router(wards.router)
app.include_router(sync.router)
app.include_router(admin.router)
app.include_router(ai.router)
app.include_router(workflow.router)
app.include_router(community.router)
app.include_router(community.community_router)
app.include_router(notifications.router)
