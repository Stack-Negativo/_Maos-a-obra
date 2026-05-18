from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.scheduling import ProviderBusySlot


class SchedulingRepository:
    """
    Repository for ProviderBusySlot persistence and availability queries.
    Focuses on transactional safety and efficient overlap checks.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_busy_slot(self, slot: ProviderBusySlot) -> ProviderBusySlot:
        """Persists a new busy slot in the database."""
        self.session.add(slot)
        # Session is flushed but not committed yet to allow
        # transaction orchestration in Service
        await self.session.flush()
        await self.session.refresh(slot)
        return slot

    async def get_by_id(self, slot_id: UUID) -> ProviderBusySlot | None:
        """Retrieves a busy slot by its ID."""
        result = await self.session.execute(
            select(ProviderBusySlot).where(ProviderBusySlot.id == slot_id)
        )
        return result.scalars().first()

    async def list_by_provider(self, provider_id: UUID) -> Sequence[ProviderBusySlot]:
        """Lists all busy slots for a specific provider."""
        result = await self.session.execute(
            select(ProviderBusySlot)
            .where(ProviderBusySlot.provider_id == provider_id)
            .order_by(ProviderBusySlot.start_at.asc())
        )
        return result.scalars().all()

    async def find_overlaps(
        self, provider_id: UUID, start_at: datetime, end_at: datetime
    ) -> Sequence[ProviderBusySlot]:
        """
        Finds any busy slots for a provider that overlap with the given range.
        This is the core implementation of RS01.
        """
        # Logic: (start1 < end2) AND (start2 < end1)
        # Using SQLAlchemy query for efficiency within the transaction.
        result = await self.session.execute(
            select(ProviderBusySlot).where(
                ProviderBusySlot.provider_id == provider_id,
                ProviderBusySlot.start_at < end_at,
                ProviderBusySlot.end_at > start_at,
            )
        )
        return result.scalars().all()

    async def delete_by_service_order(self, order_id: UUID) -> None:
        """Removes busy slots associated with a service order."""
        result = await self.session.execute(
            select(ProviderBusySlot).where(
                ProviderBusySlot.service_order_id == order_id
            )
        )
        slots = result.scalars().all()
        for slot in slots:
            await self.session.delete(slot)
        await self.session.flush()
