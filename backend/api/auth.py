from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.user import User
from repositories.user_repository import UserRepository
from schemas.auth import Token
from schemas.base import APIResponse
from schemas.user import UserCreate, UserResponse
from services.auth_service import AuthService

from .deps import get_current_active_user

router = APIRouter(prefix="/auth", tags=["auth"])


async def get_auth_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AuthService:
    user_repository = UserRepository(session)
    return AuthService(user_repository)


@router.post("/token", response_model=APIResponse[Token])
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    token = await auth_service.authenticate_user(form_data.username, form_data.password)
    return APIResponse(data=token)


@router.post("/register", response_model=APIResponse[Token])
async def register_user(
    user_create: UserCreate,
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
):
    token = await auth_service.register_user(user_create)
    return APIResponse(data=token)


# Example of a protected route
@router.get("/me", response_model=APIResponse[UserResponse])
async def get_auth_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return APIResponse(data=UserResponse.model_validate(current_user))
