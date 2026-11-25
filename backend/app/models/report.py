from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.core.db import Base


class Report(Base):
    __tablename__ = 'reports'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    client_request_id: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    reporter_id: Mapped[str | None] = mapped_column(String)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String, index=True)
    subcategory: Mapped[str | None] = mapped_column(String)
    severity_score: Mapped[int] = mapped_column(Integer, default=0)
    severity_label: Mapped[str] = mapped_column(String, default='low')
    status: Mapped[str] = mapped_column(String, default='open', index=True)
    lat: Mapped[float] = mapped_column(Float)
    lng: Mapped[float] = mapped_column(Float)
    address: Mapped[str | None] = mapped_column(String)
    ward_id: Mapped[str | None] = mapped_column(String, index=True)
    photo_urls: Mapped[list] = mapped_column(JSON, default=list)
    ai_category: Mapped[str | None] = mapped_column(String)
    ai_severity: Mapped[int | None] = mapped_column(Integer)
    ai_confidence: Mapped[float | None] = mapped_column(Float)
    ai_rationale: Mapped[str | None] = mapped_column(Text)
    ai_model_version: Mapped[str | None] = mapped_column(String)
    duplicate_of: Mapped[str | None] = mapped_column(String)
    upvote_count: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False)
    department_code: Mapped[str | None] = mapped_column(String)
    assigned_to: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
