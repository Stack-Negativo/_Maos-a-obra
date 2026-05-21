from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import ReviewDirection

if TYPE_CHECKING:
    from models.service_order import ServiceOrder
    from models.user import User


class Review(BaseEntity, Base):
    __tablename__ = "reviews"

    service_order_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False, index=True
    )
    reviewer_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    reviewed_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    direction: Mapped[ReviewDirection] = mapped_column(
        SQLEnum(ReviewDirection), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    service_order: Mapped["ServiceOrder"] = relationship("ServiceOrder")
    reviewer: Mapped["User"] = relationship("User", foreign_keys=[reviewer_id])
    reviewed: Mapped["User"] = relationship("User", foreign_keys=[reviewed_id])
