from typing import Optional
from uuid import UUID

from models.user import User
from repositories.user_repository import UserRepository


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        return await self.user_repository.get_by_id(user_id)

    async def get_user_by_email(self, email: str) -> Optional[User]:
        return await self.user_repository.get_by_email(email)

    async def create_user(self, user_data: dict) -> User:
        # In a real scenario, password hashing would happen here
        return await self.user_repository.create(user_data)
