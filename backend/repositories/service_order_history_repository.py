from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.service_order_history import ServiceOrderHistory


class ServiceOrderHistoryRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, history: ServiceOrderHistory) -> ServiceOrderHistory:
        self.session.add(history)
        return history

    async def list_by_order(self, order_id: UUID) -> Sequence[ServiceOrderHistory]:
        result = await self.session.execute(
            select(ServiceOrderHistory)
            .where(ServiceOrderHistory.service_order_id == order_id)
            .order_by(ServiceOrderHistory.created_at.desc())
            .options(selectinload(ServiceOrderHistory.actor))
        )
        return result.scalars().all()
