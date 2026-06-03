from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.specialty import Specialty


class SpecialtyRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self, only_active: bool = False) -> Sequence[Specialty]:
        query = select(Specialty)
        if only_active:
            query = query.where(Specialty.is_active.is_(True))
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id(self, specialty_id: UUID) -> Specialty | None:
        result = await self.session.execute(
            select(Specialty).filter(Specialty.id == specialty_id)
        )
        return result.scalars().first()

    async def get_by_name(self, name: str) -> Specialty | None:
        result = await self.session.execute(
            select(Specialty).filter(Specialty.name == name)
        )
        return result.scalars().first()

    async def create(self, specialty_data: dict[str, Any]) -> Specialty:
        specialty = Specialty(**specialty_data)
        self.session.add(specialty)
        return specialty

    async def update(
        self, specialty: Specialty, specialty_data: dict[str, Any]
    ) -> Specialty:
        for key, value in specialty_data.items():
            if value is not None:
                setattr(specialty, key, value)
        return specialty

    async def delete(self, specialty: Specialty) -> None:
        await self.session.delete(specialty)
