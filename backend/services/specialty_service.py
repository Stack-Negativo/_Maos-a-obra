from uuid import UUID

from core.exceptions import ConflictException, NotFoundException
from repositories.specialty_repository import SpecialtyRepository
from schemas.specialty import SpecialtyCreate, SpecialtyUpdate


class SpecialtyService:
    def __init__(self, specialty_repository: SpecialtyRepository):
        self.specialty_repository = specialty_repository

    async def list_specialties(self, only_active: bool = False):
        return await self.specialty_repository.get_all(only_active=only_active)

    async def get_specialty(self, specialty_id: UUID):
        specialty = await self.specialty_repository.get_by_id(specialty_id)
        if not specialty:
            raise NotFoundException("Specialty not found")
        return specialty

    async def create_specialty(self, data: SpecialtyCreate):
        existing = await self.specialty_repository.get_by_name(data.name)
        if existing:
            raise ConflictException("Specialty name already exists")

        specialty = await self.specialty_repository.create(data.model_dump())
        await self.specialty_repository.session.commit()
        await self.specialty_repository.session.refresh(specialty)
        return specialty

    async def update_specialty(self, specialty_id: UUID, data: SpecialtyUpdate):
        specialty = await self.get_specialty(specialty_id)
        updated_specialty = await self.specialty_repository.update(
            specialty, data.model_dump(exclude_unset=True)
        )
        await self.specialty_repository.session.commit()
        await self.specialty_repository.session.refresh(updated_specialty)
        return updated_specialty

    async def delete_specialty(self, specialty_id: UUID):
        specialty = await self.get_specialty(specialty_id)
        await self.specialty_repository.delete(specialty)
        await self.specialty_repository.session.commit()
