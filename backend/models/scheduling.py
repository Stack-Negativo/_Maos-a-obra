from enum import StrEnum
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity

if TYPE_CHECKING:
    from models.provider import Provider
    from models.service_order import ServiceOrder


class BusySlotSource(StrEnum):
    SERVICE_ORDER = "SERVICE_ORDER"
    MANUAL_BLOCK = "MANUAL_BLOCK"
    UNAVAILABILITY = "UNAVAILABILITY"


class BusySlotStatus(StrEnum):
    CONFIRMED = "CONFIRMED"
    TENTATIVE = "TENTATIVE"


class ProviderBusySlot(BaseEntity, Base):
    """
    Represents periods where a provider is occupied.
    Implements the 'Busy Slot' concept from documentation.
    """

    __tablename__ = "provider_busy_slots"

    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("providers.id"), nullable=False, index=True
    )
    service_order_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("service_orders.id"), nullable=True, index=True
    )

    start_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    end_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )

    source: Mapped[BusySlotSource] = mapped_column(
        Enum(BusySlotSource),
        default=BusySlotSource.SERVICE_ORDER,
        nullable=False,
        index=True,
    )
    status: Mapped[BusySlotStatus] = mapped_column(
        Enum(BusySlotStatus),
        default=BusySlotStatus.CONFIRMED,
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relationships
    provider: Mapped["Provider"] = relationship("Provider")
    service_order: Mapped["ServiceOrder | None"] = relationship("ServiceOrder")
