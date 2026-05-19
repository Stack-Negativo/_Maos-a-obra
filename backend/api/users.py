from datetime import UTC, datetime
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories.user_repository import UserRepository
from schemas.base import APIResponse
from schemas.user import UserResponse
from services.user_service import UserService

router = APIRouter()


async def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserService:
    user_repository = UserRepository(session)
    return UserService(user_repository)


@router.get(
    "/users/me",
    response_model=APIResponse[UserResponse],
    summary="Get current user details (mocked)",
)
async def read_users_me(
    _user_service: Annotated[UserService, Depends(get_user_service)],
):
    # For now, return a mocked user as authentication is not implemented
    # In a real scenario, the authenticated user's ID would be retrieved
    # and then fetched from the database using user_service.get_user_by_id(user_id)
    mock_user_data = UserResponse(
        id=uuid4(),
        email="mockuser@email.com",
        nome="Mock User",
        phone="79999999999",
        is_active=True,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    return APIResponse(data=mock_user_data)
