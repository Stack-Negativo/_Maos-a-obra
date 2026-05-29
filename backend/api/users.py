from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories.user_repository import UserRepository
from schemas.base import APIResponse
from schemas.user import UserResponse
from services.user_service import UserService
from .deps import get_current_active_user
from models.user import User

router = APIRouter()


async def get_user_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserService:
    user_repository = UserRepository(session)
    return UserService(user_repository)


@router.get(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Get current user details",
)
async def read_users_me(
    _user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    return APIResponse(data=UserResponse.model_validate(current_user))
