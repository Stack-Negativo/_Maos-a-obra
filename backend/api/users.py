from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories.user_repository import UserRepository
from schemas.base import APIResponse
from schemas.user import UserProfileUpdate, UserResponse
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


@router.patch(
    "/me",
    response_model=APIResponse[UserResponse],
    summary="Update current user profile",
)
async def update_users_me(
    data: UserProfileUpdate,
    user_service: Annotated[UserService, Depends(get_user_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    user = await user_service.update_profile(current_user, data)
    return APIResponse(data=UserResponse.model_validate(user))
