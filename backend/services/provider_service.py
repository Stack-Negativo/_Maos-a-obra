from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    InfrastructureException,
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

    async def register_provider(self, user_id: UUID, data: ProviderCreate) -> Provider:
        # Check if already a provider
        existing = await self.provider_repository.get_by_user_id(user_id)
        if existing:
            raise ConflictException("User is already a provider")

        # Check if user is admin (cannot be both in MVP)
        admin = await self.provider_repository.get_admin_by_user_id(user_id)
        if admin:
            raise BusinessRuleViolation("Admins cannot register as providers")

        # Validate specialties
        for s_id in data.specialty_ids:
            spec = await self.specialty_repository.get_by_id(s_id)
            if not spec:
                raise NotFoundException(f"Specialty {s_id} not found")
            if not spec.is_active:
                raise BusinessRuleViolation(f"Specialty {s_id} is inactive")

        provider = Provider(
            user_id=user_id,
            bio=data.bio,
        )

        # Link specialties via relationship
        provider.specialties = [
            ProviderSpecialty(specialty_id=s_id) for s_id in data.specialty_ids
        ]

        await self.provider_repository.create(provider)

        # Explicitly commit and refresh
        await self.provider_repository.session.commit()

        # Re-fetch with all relationships loaded to avoid MissingGreenlet
        updated_provider = await self.provider_repository.get_by_id(provider.id)
        if not updated_provider:
            raise InfrastructureException("Provider disappeared after creation")
        return updated_provider

    async def update_provider(self, user_id: UUID, data: ProviderUpdate) -> Provider:
        provider = await self.provider_repository.get_by_user_id(user_id)
        if not provider:
            raise NotFoundException("Provider profile not found")

        update_data = data.model_dump(exclude={"specialty_ids"}, exclude_unset=True)

        if update_data:
            await self.provider_repository.update(provider, update_data)

        if data.specialty_ids is not None:
            # Simple sync: extend for MVP
            provider.specialties.extend(
                [ProviderSpecialty(specialty_id=s_id) for s_id in data.specialty_ids]
            )

        await self.provider_repository.session.commit()

        # Re-fetch to ensure consistency and loaded relationships
        updated_provider = await self.provider_repository.get_by_id(provider.id)
        if not updated_provider:
            raise NotFoundException("Provider disappeared after update")
        return updated_provider

    async def get_provider_by_user_id(self, user_id: UUID) -> Provider:
        provider = await self.provider_repository.get_by_user_id(user_id)
        if not provider:
            raise NotFoundException("Provider profile not found")
        return provider

    async def list_active_providers(self):
        return await self.provider_repository.get_all_active()

    async def list_all_providers(self):
        return await self.provider_repository.get_all()

    async def list_suspended_providers(self):
        return await self.provider_repository.get_all_suspended()

    async def suspend_provider(self, provider_id: UUID) -> Provider:
        provider = await self.provider_repository.get_by_id(provider_id)
        if not provider:
            raise NotFoundException("Provider profile not found")

        provider.is_suspended = True
        provider.suspended_at = datetime.now(UTC)

        await self.provider_repository.session.commit()

        updated_provider = await self.provider_repository.get_by_id(provider.id)
        if not updated_provider:
            raise NotFoundException("Provider disappeared after suspension")
        return updated_provider

    async def unsuspend_provider(self, provider_id: UUID) -> Provider:
        provider = await self.provider_repository.get_by_id(provider_id)
        if not provider:
            raise NotFoundException("Provider profile not found")

        provider.is_suspended = False
        provider.suspended_at = None

        await self.provider_repository.session.commit()

        updated_provider = await self.provider_repository.get_by_id(provider.id)
        if not updated_provider:
            raise NotFoundException("Provider disappeared after reactivation")
        return updated_provider
