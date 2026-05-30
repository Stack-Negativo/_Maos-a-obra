from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.provider import Admin, Provider, ProviderSpecialty
from models.service_order import ServiceOrder
from models.service_order_application import ServiceOrderApplication


class ProviderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, provider_id: UUID) -> Provider | None:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.id == provider_id)
            .options(
                selectinload(Provider.user),
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                )
            )
        )
        return result.scalars().first()

    async def get_by_user_id(self, user_id: UUID) -> Provider | None:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.user_id == user_id)
            .options(
                selectinload(Provider.user),
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                )
            )
        )
        return result.scalars().first()

    async def get_admin_by_user_id(self, user_id: UUID) -> Admin | None:
        result = await self.session.execute(
            select(Admin).where(Admin.user_id == user_id)
        )
        return result.scalars().first()

    async def create(self, provider: Provider) -> Provider:
        self.session.add(provider)
        return provider

    async def update(self, provider: Provider, data: dict[str, Any]) -> Provider:
        for key, value in data.items():
            setattr(provider, key, value)
        return provider

    async def has_assigned_orders(self, provider_id: UUID) -> bool:
        result = await self.session.execute(
            select(ServiceOrder.id)
            .where(ServiceOrder.provider_id == provider_id)
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    async def delete(self, provider: Provider) -> None:
        await self.session.execute(
            delete(ServiceOrderApplication).where(
                ServiceOrderApplication.provider_id == provider.id
            )
        )
        await self.session.delete(provider)

    async def link_specialties(
        self, provider_id: UUID, specialty_ids: list[UUID]
    ) -> None:
        for s_id in specialty_ids:
            link = ProviderSpecialty(provider_id=provider_id, specialty_id=s_id)
            self.session.add(link)

    async def get_all_active(self) -> Sequence[Provider]:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.is_suspended.is_(False))
            .options(
                selectinload(Provider.user),
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                )
            )
        )
        return result.scalars().all()

    async def get_all(self) -> Sequence[Provider]:
        result = await self.session.execute(
            select(Provider).options(
                selectinload(Provider.user),
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                ),
            )
        )
        return result.scalars().all()

    async def get_all_suspended(self) -> Sequence[Provider]:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.is_suspended.is_(True))
            .options(
                selectinload(Provider.user),
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                ),
            )
        )
        return result.scalars().all()
