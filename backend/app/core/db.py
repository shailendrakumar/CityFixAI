from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()
engine = create_async_engine(settings.database_url, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with SessionLocal() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # backward-compatible column additions for existing SQLite dbs
    async with engine.begin() as conn:
        try:
            await conn.execute(__import__('sqlalchemy').text('ALTER TABLE reports ADD COLUMN assigned_to VARCHAR'))
        except Exception:
            pass
    async with engine.begin() as conn:
        try:
            await conn.execute(__import__('sqlalchemy').text('ALTER TABLE users ADD COLUMN contribution_points INTEGER DEFAULT 0'))
        except Exception:
            pass
