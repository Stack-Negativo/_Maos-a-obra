from typing import Any
from uuid import UUID

from models.user import User
from repositories.user_repository import UserRepository
from schemas.user import UserProfileUpdate


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        return await self.user_repository.get_by_id(user_id)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.user_repository.get_by_email(email)

    async def create_user(self, user_data: dict[str, Any]) -> User:
        # In a real scenario, password hashing would happen here
        return await self.user_repository.create(user_data)

    async def update_profile(self, user: User, data: UserProfileUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)
        if update_data:
            await self.user_repository.update(user, update_data)
            await self.user_repository.session.commit()
        return user
