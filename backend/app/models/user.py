from sqlalchemy import String, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, timezone
from app.core.db import Base


class User(Base):
    __tablename__ = 'users'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String)
    display_name: Mapped[str] = mapped_column(String, default='Citizen')
    role: Mapped[str] = mapped_column(String, default='citizen')
    ward_id: Mapped[str | None] = mapped_column(String)
    contribution_points: Mapped[int] = mapped_column(Integer, default=0)
    is_demo: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
