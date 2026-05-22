from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_all(self) -> list[User]:
        result = await self.session.execute(select(User))
        return list(result.scalars().all())

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(select(User).filter(User.id == user_id))
        return result.scalars().first()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).filter(User.email == email))
        return result.scalars().first()

    async def create(self, user_data: dict[str, Any]) -> User:
        user = User(**user_data)
        self.session.add(user)
        # No commit here
        return user

    async def update(self, user: User, user_data: dict[str, Any]) -> User:
        for key, value in user_data.items():
            setattr(user, key, value)
        # No commit here
        return user

    async def delete(self, user: User) -> None:
        await self.session.delete(user)
        # No commit here
