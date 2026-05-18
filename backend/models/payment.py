from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import PaymentStatus

if TYPE_CHECKING:
    from models.service_order import ServiceOrder
    from models.user import User
    from models.payment_transaction import PaymentTransaction


class Payment(BaseEntity, Base):
    __tablename__ = "payments"

    service_order_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False, index=True, unique=True
    )
    client_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True
    )

    # Audit Metadata
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    correlation_id: Mapped[UUID | None] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Relationships
    service_order: Mapped["ServiceOrder"] = relationship("ServiceOrder")
    client: Mapped["User"] = relationship("User")
    transactions: Mapped[list["PaymentTransaction"]] = relationship(back_populates="payment")
