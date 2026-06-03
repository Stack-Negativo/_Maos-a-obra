from collections.abc import Sequence
from typing import Any
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from models.address import Address


class AddressRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, address_id: UUID) -> Address | None:
        result = await self.session.execute(
            select(Address).filter(Address.id == address_id)
        )
        return result.scalars().first()

    async def get_all_by_user_id(self, user_id: UUID) -> Sequence[Address]:
        result = await self.session.execute(
            select(Address)
            .filter(Address.user_id == user_id)
            .order_by(Address.created_at.desc())
        )
        return result.scalars().all()

    async def create(self, user_id: UUID, address_data: dict[str, Any]) -> Address:
        address = Address(user_id=user_id, **address_data)
        self.session.add(address)
        return address

    async def update(self, address: Address, address_data: dict[str, Any]) -> Address:
        for key, value in address_data.items():
            if value is not None:
                setattr(address, key, value)
        return address

    async def delete(self, address: Address) -> None:
        await self.session.delete(address)

    async def unset_default_for_user(self, user_id: UUID) -> None:
        await self.session.execute(
            update(Address)
            .where(Address.user_id == user_id, Address.is_default.is_(True))
            .values(is_default=False)
        )

    async def get_default_by_user_id(self, user_id: UUID) -> Address | None:
        result = await self.session.execute(
            select(Address).filter(
                Address.user_id == user_id, Address.is_default.is_(True)
            )
        )
        return result.scalars().first()
