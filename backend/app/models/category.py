from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.db import Base


class Category(Base):
    __tablename__ = 'categories'
    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String)
    icon: Mapped[str | None] = mapped_column(String)
    color: Mapped[str | None] = mapped_column(String)
    default_severity: Mapped[int] = mapped_column(Integer, default=30)
    is_demo: Mapped[bool] = mapped_column(default=False)
