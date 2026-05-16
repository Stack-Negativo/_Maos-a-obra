from collections.abc import Sequence
from uuid import UUID

from core.exceptions import AuthorizationException, NotFoundException
from models.address import Address
from repositories.address_repository import AddressRepository
from schemas.address import AddressCreate, AddressUpdate


class AddressService:
    def __init__(self, address_repository: AddressRepository):
        self.address_repository = address_repository

    async def list_user_addresses(self, user_id: UUID) -> Sequence[Address]:
        return await self.address_repository.get_all_by_user_id(user_id)

    async def get_address(self, address_id: UUID, user_id: UUID) -> Address:
        address = await self.address_repository.get_by_id(address_id)
        if not address:
            raise NotFoundException("Address not found")
        if address.user_id != user_id:
            raise AuthorizationException("Not authorized to access this address")
        return address

    async def create_address(self, user_id: UUID, address_in: AddressCreate) -> Address:
        if address_in.is_default:
            await self.address_repository.unset_default_for_user(user_id)

        # If it's the first address, make it default regardless
        existing_addresses = await self.address_repository.get_all_by_user_id(user_id)
        address_data = address_in.model_dump()
        if not existing_addresses:
            address_data["is_default"] = True

        return await self.address_repository.create(user_id, address_data)

    async def update_address(
        self, address_id: UUID, user_id: UUID, address_in: AddressUpdate
    ) -> Address:
        address = await self.get_address(address_id, user_id)

        address_data = address_in.model_dump(exclude_unset=True)

        if address_data.get("is_default") is True:
            await self.address_repository.unset_default_for_user(user_id)

        return await self.address_repository.update(address, address_data)

    async def delete_address(self, address_id: UUID, user_id: UUID) -> None:
        address = await self.get_address(address_id, user_id)
        await self.address_repository.delete(address)

        # If deleted address was default, set another one as default if exists
        if address.is_default:
            remaining = await self.address_repository.get_all_by_user_id(user_id)
            if remaining:
                await self.address_repository.update(remaining[0], {"is_default": True})

    async def set_default_address(self, address_id: UUID, user_id: UUID) -> Address:
        address = await self.get_address(address_id, user_id)
        if not address.is_default:
            await self.address_repository.unset_default_for_user(user_id)
            return await self.address_repository.update(address, {"is_default": True})
        return address
