from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.service_order import ServiceOrder
from models.service_order_application import ServiceOrderApplication
from models.provider import Provider, ProviderSpecialty


class ServiceOrderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, order: ServiceOrder) -> ServiceOrder:
        self.session.add(order)
        return order

    async def get_by_id(self, order_id: UUID) -> ServiceOrder | None:
        result = await self.session.execute(
            select(ServiceOrder)
            .where(ServiceOrder.id == order_id)
            .options(
                selectinload(ServiceOrder.provider),
                selectinload(ServiceOrder.provider).selectinload(Provider.user),
                selectinload(ServiceOrder.provider).selectinload(
                    Provider.specialties,
                ).selectinload(ProviderSpecialty.specialty),
                selectinload(ServiceOrder.address),
                selectinload(ServiceOrder.specialty),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.user),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty,
                ),
            )
        )
        return result.scalars().first()

    async def get_by_id_for_update(self, order_id: UUID) -> ServiceOrder | None:
        result = await self.session.execute(
            select(ServiceOrder)
            .where(ServiceOrder.id == order_id)
            .options(
                selectinload(ServiceOrder.provider),
                selectinload(ServiceOrder.provider).selectinload(Provider.user),
                selectinload(ServiceOrder.provider).selectinload(
                    Provider.specialties,
                ).selectinload(ProviderSpecialty.specialty),
                selectinload(ServiceOrder.address),
                selectinload(ServiceOrder.specialty),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.user),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty,
                ),
            )
            .with_for_update()
        )
        return result.scalars().first()

    async def list_by_client(self, client_id: UUID) -> Sequence[ServiceOrder]:
        result = await self.session.execute(
            select(ServiceOrder)
            .where(ServiceOrder.client_id == client_id)
            .order_by(ServiceOrder.created_at.desc())
            .options(
                selectinload(ServiceOrder.provider),
                selectinload(ServiceOrder.provider).selectinload(Provider.user),
                selectinload(ServiceOrder.provider).selectinload(
                    Provider.specialties,
                ).selectinload(ProviderSpecialty.specialty),
                selectinload(ServiceOrder.address),
                selectinload(ServiceOrder.specialty),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.user),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty,
                ),
            )
        )
        return result.scalars().all()

    async def list_all(self) -> Sequence[ServiceOrder]:
        result = await self.session.execute(
            select(ServiceOrder)
            .order_by(ServiceOrder.created_at.desc())
            .options(
                selectinload(ServiceOrder.provider),
                selectinload(ServiceOrder.provider).selectinload(Provider.user),
                selectinload(ServiceOrder.provider).selectinload(
                    Provider.specialties,
                ).selectinload(ProviderSpecialty.specialty),
                selectinload(ServiceOrder.address),
                selectinload(ServiceOrder.specialty),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.user),
                selectinload(ServiceOrder.applications).selectinload(
                    ServiceOrderApplication.provider,
                ).selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty,
                ),
            )
        )
        return result.scalars().all()

    async def update(self, order: ServiceOrder, data: dict[str, Any]) -> ServiceOrder:
        for key, value in data.items():
            setattr(order, key, value)
        return order

    async def delete(self, order: ServiceOrder) -> None:
        await self.session.delete(order)
