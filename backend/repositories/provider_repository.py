from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.exceptions import InfrastructureException
from models.provider import Admin, Provider, ProviderSpecialty


class ProviderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, provider_id: UUID) -> Provider | None:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.id == provider_id)
            .options(
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
        await self.session.commit()
        await self.session.refresh(provider)
        # Re-fetch with specialties loaded
        updated_provider = await self.get_by_id(provider.id)
        if updated_provider is None:
            raise InfrastructureException("Provider disappeared after persistence")
        return updated_provider

    async def update(self, provider: Provider, data: dict[str, Any]) -> Provider:
        for key, value in data.items():
            setattr(provider, key, value)
        await self.session.commit()
        await self.session.refresh(provider)
        return provider

    async def link_specialties(
        self, provider_id: UUID, specialty_ids: list[UUID]
    ) -> None:
        for s_id in specialty_ids:
            link = ProviderSpecialty(provider_id=provider_id, specialty_id=s_id)
            self.session.add(link)
        await self.session.commit()

    async def get_all_active(self) -> Sequence[Provider]:
        result = await self.session.execute(
            select(Provider)
            .where(Provider.is_suspended.is_(False))
            .options(
                selectinload(Provider.specialties).selectinload(
                    ProviderSpecialty.specialty
                )
            )
        )
        return result.scalars().all()
