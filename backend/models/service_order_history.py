from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import OrderStatus

if TYPE_CHECKING:
    from models.service_order import ServiceOrder
    from models.user import User


class ServiceOrderHistory(BaseEntity, Base):
    __tablename__ = "service_order_history"

    service_order_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False, index=True
    )
    # Use native_enum=False to avoid migration issues with Postgres types
    old_status: Mapped[OrderStatus | None] = mapped_column(
        SQLEnum(OrderStatus, native_enum=False), nullable=True
    )
    new_status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus, native_enum=False), nullable=False
    )
    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    service_order: Mapped["ServiceOrder"] = relationship("ServiceOrder")
    actor: Mapped["User"] = relationship("User")
