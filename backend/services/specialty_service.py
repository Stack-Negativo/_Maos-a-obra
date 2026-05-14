from collections.abc import Sequence
from uuid import UUID

from fastapi import HTTPException, status

from models.specialty import Specialty
from repositories.specialty_repository import SpecialtyRepository
from schemas.specialty import SpecialtyCreate, SpecialtyUpdate


class SpecialtyService:
    def __init__(self, specialty_repository: SpecialtyRepository):
        self.specialty_repository = specialty_repository

    async def list_specialties(self, only_active: bool = False) -> Sequence[Specialty]:
        return await self.specialty_repository.get_all(only_active=only_active)

    async def get_specialty(self, specialty_id: UUID) -> Specialty:
        specialty = await self.specialty_repository.get_by_id(specialty_id)
        if not specialty:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specialty not found",
            )
        return specialty

    async def create_specialty(self, specialty_in: SpecialtyCreate) -> Specialty:
        existing = await self.specialty_repository.get_by_name(specialty_in.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Specialty with this name already exists",
            )
        return await self.specialty_repository.create(specialty_in.model_dump())

    async def update_specialty(
        self, specialty_id: UUID, specialty_in: SpecialtyUpdate
    ) -> Specialty:
        specialty = await self.get_specialty(specialty_id)

        if specialty_in.name:
            existing = await self.specialty_repository.get_by_name(specialty_in.name)
            if existing and existing.id != specialty_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Specialty with this name already exists",
                )

        return await self.specialty_repository.update(
            specialty, specialty_in.model_dump(exclude_unset=True)
        )

    async def delete_specialty(self, specialty_id: UUID) -> None:
        specialty = await self.get_specialty(specialty_id)
        await self.specialty_repository.delete(specialty)
