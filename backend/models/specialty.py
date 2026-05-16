
from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from domain.base import BaseEntity


class Specialty(BaseEntity, Base):
    __tablename__ = "specialties"

    name: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
