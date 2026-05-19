from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import PaymentStatus

if TYPE_CHECKING:
    from models.payment import Payment


class PaymentTransaction(BaseEntity, Base):
    __tablename__ = "payment_transactions"

    payment_id: Mapped[UUID] = mapped_column(
        ForeignKey("payments.id"), nullable=False, index=True
    )
    previous_status: Mapped[PaymentStatus | None] = mapped_column(
        SQLEnum(PaymentStatus), nullable=True
    )
    new_status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Audit Metadata
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    correlation_id: Mapped[UUID | None] = mapped_column(nullable=True)
    source: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    payment: Mapped["Payment"] = relationship("Payment", back_populates="transactions")
