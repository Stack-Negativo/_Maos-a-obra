from datetime import UTC, datetime
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity

if TYPE_CHECKING:
    from models.specialty import Specialty
    from models.user import User


class Provider(BaseEntity, Base):
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    rating_average: Mapped[float] = mapped_column(
        Numeric(3, 2), default=0.0, nullable=False
    )
    total_reviews: Mapped[int] = mapped_column(default=0, nullable=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User")
    specialties: Mapped[list["ProviderSpecialty"]] = relationship(
        back_populates="provider", cascade="all, delete-orphan"
    )


class ProviderSpecialty(Base):
    __tablename__ = "providers_specialties"

    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("providers.id"), primary_key=True
    )
    specialty_id: Mapped[UUID] = mapped_column(
        ForeignKey("specialties.id"), primary_key=True
    )
    linked_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    provider: Mapped["Provider"] = relationship(back_populates="specialties")
    specialty: Mapped["Specialty"] = relationship("Specialty")


class Admin(BaseEntity, Base):
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )
    access_level: Mapped[int] = mapped_column(default=1, nullable=False)

    # Relationships
    user: Mapped["User"] = relationship("User")


class Client(BaseEntity, Base):
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), unique=True, nullable=False
    )

    # Relationships
    user: Mapped["User"] = relationship("User")
