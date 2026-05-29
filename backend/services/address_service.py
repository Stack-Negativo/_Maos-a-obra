from uuid import UUID

from core.exceptions import (
    AuthorizationException,
    NotFoundException,
    ValidationException,
)
from repositories.address_repository import AddressRepository
from schemas.address import AddressCreate, AddressUpdate


class AddressService:
    def __init__(self, address_repository: AddressRepository):
        self.address_repository = address_repository

    async def list_user_addresses(self, user_id: UUID):
        return await self.address_repository.get_all_by_user_id(user_id)

    async def get_address(self, address_id: UUID, user_id: UUID):
        address = await self.address_repository.get_by_id(address_id)
        if not address:
            raise NotFoundException("Address not found")
        if address.user_id != user_id:
            raise AuthorizationException("Not authorized to access this address")
        return address

    async def create_address(self, user_id: UUID, data: AddressCreate):
        existing = await self.address_repository.get_all_by_user_id(user_id)
        is_first = len(existing) == 0

        payload = data.model_dump()
        if is_first:
            payload["is_default"] = True
        elif data.is_default:
            await self.address_repository.unset_default_for_user(user_id)

        address = await self.address_repository.create(user_id, payload)
        await self.address_repository.session.commit()
        await self.address_repository.session.refresh(address)
        return address

    async def update_address(
        self, address_id: UUID, user_id: UUID, data: AddressUpdate
    ):
        address = await self.get_address(address_id, user_id)

        if data.is_default and not address.is_default:
            await self.address_repository.unset_default_for_user(user_id)

        updated_address = await self.address_repository.update(
            address, data.model_dump(exclude_unset=True)
        )
        await self.address_repository.session.commit()
        await self.address_repository.session.refresh(updated_address)
        return updated_address

    async def delete_address(self, address_id: UUID, user_id: UUID):
        address = await self.get_address(address_id, user_id)
        if address.is_default:
            raise ValidationException("Cannot delete default address")

        await self.address_repository.delete(address)
        await self.address_repository.session.commit()

    async def set_default_address(self, address_id: UUID, user_id: UUID):
        address = await self.get_address(address_id, user_id)
        await self.address_repository.unset_default_for_user(user_id)

        updated_address = await self.address_repository.update(
            address, {"is_default": True}
        )
        await self.address_repository.session.commit()
        await self.address_repository.session.refresh(updated_address)
        return updated_address
