from datetime import timedelta

from fastapi import HTTPException, status
from sqlalchemy import select

from core.config import get_settings
from core.security import create_access_token, get_password_hash, verify_password
from models.provider import Admin
from models.user import User
from repositories.user_repository import UserRepository
from schemas.auth import Token
from schemas.user import UserCreate


class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    async def _ensure_admin_before_login(self, email: str) -> None:
        settings = get_settings()

        if email.strip().lower() != settings.ADMIN_EMAIL.strip().lower():
            return

        user = await self.user_repository.get_by_email(settings.ADMIN_EMAIL)

        if user is None:
            user = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name=settings.ADMIN_FULL_NAME,
                phone=settings.ADMIN_PHONE,
                is_active=True,
                is_email_verified=True,
            )
            self.user_repository.session.add(user)
            await self.user_repository.session.flush()
        else:
            user.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
            user.full_name = settings.ADMIN_FULL_NAME
            user.phone = settings.ADMIN_PHONE
            user.is_active = True
            user.is_email_verified = True

        result = await self.user_repository.session.execute(
            select(Admin).where(Admin.user_id == user.id),
        )
        admin = result.scalars().first()

        if admin is None:
            self.user_repository.session.add(Admin(user_id=user.id, access_level=10))

        await self.user_repository.session.commit()

    async def authenticate_user(self, email: str, password: str) -> Token:
        await self._ensure_admin_before_login(email)
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

        hashed_password = get_password_hash(user_data.password)

        user_in_db = await self.user_repository.create(
            user_data.model_dump(exclude={"password"})
            | {"hashed_password": hashed_password}
        )
        await self.user_repository.session.commit()
        await self.user_repository.session.refresh(user_in_db)

        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user_in_db.email}, expires_delta=access_token_expires
        )
        return Token(access_token=access_token, token_type="bearer")
