from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import OrderStatus
from domain.value_objects.date_range import DateRange
from domain.value_objects.money import Money

if TYPE_CHECKING:
    from models.address import Address
    from models.provider import Provider
    from models.specialty import Specialty
    from models.user import User


class ServiceOrder(BaseEntity, Base):
    __tablename__ = "service_orders"

    client_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    provider_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("providers.id"), nullable=True, index=True
    )
    address_id: Mapped[UUID] = mapped_column(
        ForeignKey("addresses.id"), nullable=False, index=True
    )
    specialty_id: Mapped[UUID] = mapped_column(
        ForeignKey("specialties.id"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # Time Range (Value Object Integration Ready)
    preferred_date_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    preferred_date_end: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    scheduled_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Financials (Value Object Integration Ready)
    estimated_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    final_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus), default=OrderStatus.CREATED, nullable=False, index=True
    )

    cancellation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    client: Mapped["User"] = relationship("User", foreign_keys=[client_id])
    provider: Mapped["Provider | None"] = relationship(
        "Provider", foreign_keys=[provider_id]
    )
    address: Mapped["Address"] = relationship("Address")
    specialty: Mapped["Specialty"] = relationship("Specialty")

    @property
    def preferred_range(self) -> DateRange:
        return DateRange(
            start_at=self.preferred_date_start, end_at=self.preferred_date_end
        )

    @preferred_range.setter
    def preferred_range(self, value: DateRange) -> None:
        self.preferred_date_start = value.start_at
        self.preferred_date_end = value.end_at

    @property
    def estimated_money(self) -> Money | None:
        if self.estimated_price is None:
            return None
        return Money(self.estimated_price)

    @estimated_money.setter
    def estimated_money(self, value: Money | None) -> None:
        self.estimated_price = value.to_decimal() if value else None
