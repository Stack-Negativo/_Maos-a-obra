from datetime import datetime
from uuid import UUID, uuid4

from core.database import get_db
from fastapi import APIRouter, Depends, HTTPException
from repositories.user_repository import UserRepository
from schemas.user import UserResponse
from services.user_service import UserService
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


async def get_user_service(session: AsyncSession = Depends(get_db)) -> UserService:
    user_repository = UserRepository(session)
    return UserService(user_repository)


@router.get(
    "/users/me",
    response_model=UserResponse,
    summary="Get current user details (mocked)",
)
async def read_users_me(user_service: UserService = Depends(get_user_service)):
    # For now, return a mocked user as authentication is not implemented
    # In a real scenario, the authenticated user's ID would be retrieved
    # and then fetched from the database using user_service.get_user_by_id(user_id)
    mock_user_data = {
        "id": uuid4(),
        "email": "mockuser@example.com",
        "full_name": "Mock User",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    return UserResponse(**mock_user_data)
