from datetime import timedelta

from fastapi import HTTPException, status

from core.security import create_access_token, get_password_hash, verify_password
from repositories.user_repository import UserRepository
from schemas.auth import Token
from schemas.user import UserCreate


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def authenticate_user(self, email: str, password: str) -> Token:
        user = await self.user_repository.get_by_email(email)
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=30)  # Using default from config
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")

    async def register_user(self, user_data: UserCreate) -> Token:
        existing_user = await self.user_repository.get_by_email(user_data.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

        hashed_password = get_password_hash(user_data.senha)
        user_in_db = await self.user_repository.create(
            user_data.model_dump(exclude={"senha"})
            | {"hashed_password": hashed_password}
        )

        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user_in_db.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")
