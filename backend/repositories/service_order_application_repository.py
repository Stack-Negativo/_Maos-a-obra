from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from domain.enums import ApplicationStatus
from models.service_order_application import ServiceOrderApplication


class ServiceOrderApplicationRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self, application: ServiceOrderApplication
    ) -> ServiceOrderApplication:
        self.session.add(application)
        await self.session.commit()
        await self.session.refresh(application)
        return application

    async def get_by_id(self, application_id: UUID) -> ServiceOrderApplication | None:
        result = await self.session.execute(
            select(ServiceOrderApplication).where(
                ServiceOrderApplication.id == application_id
            )
        )
        return result.scalars().first()

    async def get_by_order_and_provider(
        self, order_id: UUID, provider_id: UUID
    ) -> ServiceOrderApplication | None:
        result = await self.session.execute(
            select(ServiceOrderApplication).where(
                ServiceOrderApplication.service_order_id == order_id,
                ServiceOrderApplication.provider_id == provider_id,
            )
        )
        return result.scalars().first()

    async def list_by_order(self, order_id: UUID) -> Sequence[ServiceOrderApplication]:
        result = await self.session.execute(
            select(ServiceOrderApplication)
            .where(ServiceOrderApplication.service_order_id == order_id)
            .order_by(ServiceOrderApplication.created_at.desc())
        )
        return result.scalars().all()

    async def reject_others(self, order_id: UUID, accepted_id: UUID) -> None:
        """
        Mark all other pending applications for this order as REJECTED.
        This is part of the atomic acceptance process.
        """
        await self.session.execute(
            update(ServiceOrderApplication)
            .where(
                ServiceOrderApplication.service_order_id == order_id,
                ServiceOrderApplication.id != accepted_id,
                ServiceOrderApplication.status == ApplicationStatus.PENDING,
            )
            .values(status=ApplicationStatus.REJECTED)
        )

    async def count_active_by_order(self, order_id: UUID) -> int:
        """Counts pending or accepted applications for an order."""
        result = await self.session.execute(
            select(ServiceOrderApplication).where(
                ServiceOrderApplication.service_order_id == order_id,
                ServiceOrderApplication.status.in_(
                    [ApplicationStatus.PENDING, ApplicationStatus.ACCEPTED]
                ),
            )
        )
        return len(result.scalars().all())
