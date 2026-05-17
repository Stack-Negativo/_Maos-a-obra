from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.database import Base
from domain.base import BaseEntity
from domain.enums import ApplicationStatus

if TYPE_CHECKING:
    from models.provider import Provider
    from models.service_order import ServiceOrder


class ServiceOrderApplication(BaseEntity, Base):
    __tablename__ = "service_order_applications"

    service_order_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_orders.id"), nullable=False, index=True
    )
    provider_id: Mapped[UUID] = mapped_column(
        ForeignKey("providers.id"), nullable=False, index=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus),
        default=ApplicationStatus.PENDING,
        nullable=False,
        index=True,
    )

    # Relationships
    service_order: Mapped["ServiceOrder"] = relationship("ServiceOrder")
    provider: Mapped["Provider"] = relationship("Provider")

    __table_args__ = (
        UniqueConstraint("service_order_id", "provider_id", name="uq_order_provider"),
    )
