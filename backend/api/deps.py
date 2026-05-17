from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.security import verify_token
from models.user import User
from repositories.address_repository import AddressRepository
from repositories.service_order_repository import ServiceOrderRepository
from repositories.specialty_repository import SpecialtyRepository
from repositories.user_repository import UserRepository
from schemas.auth import TokenData
from services.service_order_service import ServiceOrderService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_address_repository(
    session: AsyncSession = Depends(get_db),
) -> AddressRepository:
    return AddressRepository(session)


async def get_specialty_repository(
    session: AsyncSession = Depends(get_db),
) -> SpecialtyRepository:
    return SpecialtyRepository(session)


async def get_service_order_repository(
    session: AsyncSession = Depends(get_db),
) -> ServiceOrderRepository:
    return ServiceOrderRepository(session)


async def get_service_order_service(
    order_repo: ServiceOrderRepository = Depends(get_service_order_repository),
    address_repo: AddressRepository = Depends(get_address_repository),
    specialty_repo: SpecialtyRepository = Depends(get_specialty_repository),
) -> ServiceOrderService:
    return ServiceOrderService(order_repo, address_repo, specialty_repo)


async def get_current_user(
    session: AsyncSession = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = verify_token(token)
    if email is None:
        raise credentials_exception
    token_data = TokenData(email=email)

    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
