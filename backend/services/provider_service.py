from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
)
from models.provider import Provider, ProviderSpecialty
from repositories.provider_repository import ProviderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.provider import ProviderCreate, ProviderUpdate


class ProviderService:
    def __init__(
        self,
        provider_repository: ProviderRepository,
        specialty_repository: SpecialtyRepository,
    ):
        self.provider_repository = provider_repository
        self.specialty_repository = specialty_repository

    async def get_provider_by_user_id(self, user_id: UUID) -> Provider:
        provider = await self.provider_repository.get_by_user_id(user_id)
        if not provider:
            raise NotFoundException("Provider profile not found")
        return provider

    async def register_provider(self, user_id: UUID, data: ProviderCreate) -> Provider:
        # Check if user is already a provider
        existing = await self.provider_repository.get_by_user_id(user_id)
        if existing:
            raise ConflictException("User is already a provider")

        # Check if user is an admin (Admin cannot be provider)
        admin = await self.provider_repository.get_admin_by_user_id(user_id)
        if admin:
            raise BusinessRuleViolation("Admins cannot become providers")

        # Validate specialties exist and are active
        for specialty_id in data.specialty_ids:
            specialty = await self.specialty_repository.get_by_id(specialty_id)
            if not specialty:
                raise NotFoundException(f"Specialty {specialty_id} not found")
            if not specialty.is_active:
                raise BusinessRuleViolation(f"Specialty {specialty.name} is not active")

        # Create provider
        provider = Provider(
            user_id=user_id,
            bio=data.bio,
            rating_average=0.0,
            total_reviews=0,
            is_suspended=False,
        )

        # Link specialties
        provider.specialties = [
            ProviderSpecialty(specialty_id=s_id) for s_id in set(data.specialty_ids)
        ]

        return await self.provider_repository.create(provider)

    async def update_provider(self, user_id: UUID, data: ProviderUpdate) -> Provider:
        provider = await self.get_provider_by_user_id(user_id)

        update_data = data.model_dump(exclude_unset=True)

        if "is_suspended" in update_data:
            # Only allow suspension update if business rule allows or by admin (future)
            # For now, allowing self-update or just handling timestamp
            if update_data["is_suspended"]:
                update_data["suspended_at"] = datetime.now(UTC)
            else:
                update_data["suspended_at"] = None

        return await self.provider_repository.update(provider, update_data)

    async def list_active_providers(self) -> list[Provider]:
        providers = await self.provider_repository.get_all_active()
        return list(providers)

    async def get_provider_eligibility(self, provider_id: UUID) -> bool:
        provider = await self.provider_repository.get_by_id(provider_id)
        if not provider:
            return False

        # Rule: Must have at least one specialty and not be suspended
        if provider.is_suspended:
            return False

        return bool(provider.specialties)
