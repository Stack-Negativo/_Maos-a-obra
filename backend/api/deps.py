from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import AuthenticationException
from core.security import verify_token
from models.user import User
from repositories.address_repository import AddressRepository
from repositories.payment_repository import PaymentRepository
from repositories.provider_repository import ProviderRepository
from repositories.review_repository import ReviewRepository
from repositories.scheduling_repository import SchedulingRepository
from repositories.service_order_application_repository import (
    ServiceOrderApplicationRepository,
)
from repositories.service_order_history_repository import ServiceOrderHistoryRepository
from repositories.service_order_repository import ServiceOrderRepository
from repositories.specialty_repository import SpecialtyRepository
from repositories.user_repository import UserRepository
from schemas.auth import TokenData
from services.payment_service import PaymentService
from services.review_service import ReviewService
from services.scheduling_service import SchedulingService
from services.service_order_application_service import ServiceOrderApplicationService
from services.service_order_service import ServiceOrderService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")


async def get_address_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AddressRepository:
    return AddressRepository(session)


async def get_specialty_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SpecialtyRepository:
    return SpecialtyRepository(session)


async def get_service_order_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ServiceOrderRepository:
    return ServiceOrderRepository(session)


async def get_provider_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProviderRepository:
    return ProviderRepository(session)


async def get_application_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ServiceOrderApplicationRepository:
    return ServiceOrderApplicationRepository(session)


async def get_scheduling_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SchedulingRepository:
    return SchedulingRepository(session)


async def get_review_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ReviewRepository:
    return ReviewRepository(session)


async def get_history_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ServiceOrderHistoryRepository:
    return ServiceOrderHistoryRepository(session)


async def get_service_order_service(
    order_repo: Annotated[
        ServiceOrderRepository, Depends(get_service_order_repository)
    ],
    address_repo: Annotated[AddressRepository, Depends(get_address_repository)],
    specialty_repo: Annotated[SpecialtyRepository, Depends(get_specialty_repository)],
    history_repo: Annotated[
        ServiceOrderHistoryRepository, Depends(get_history_repository)
    ],
) -> ServiceOrderService:
    return ServiceOrderService(order_repo, address_repo, specialty_repo, history_repo)


async def get_application_service(
    application_repo: Annotated[
        ServiceOrderApplicationRepository, Depends(get_application_repository)
    ],
    order_repo: Annotated[
        ServiceOrderRepository, Depends(get_service_order_repository)
    ],
    provider_repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
    history_repo: Annotated[
        ServiceOrderHistoryRepository, Depends(get_history_repository)
    ],
) -> ServiceOrderApplicationService:
    return ServiceOrderApplicationService(
        application_repo, order_repo, provider_repo, history_repo
    )


async def get_scheduling_service(
    scheduling_repo: Annotated[
        SchedulingRepository, Depends(get_scheduling_repository)
    ],
    order_repo: Annotated[
        ServiceOrderRepository, Depends(get_service_order_repository)
    ],
    provider_repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
    history_repo: Annotated[
        ServiceOrderHistoryRepository, Depends(get_history_repository)
    ],
) -> SchedulingService:
    return SchedulingService(scheduling_repo, order_repo, provider_repo, history_repo)


async def get_payment_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> PaymentService:
    payment_repo = PaymentRepository(session)
    order_repo = ServiceOrderRepository(session)
    return PaymentService(session, payment_repo, order_repo)


async def get_review_service(
    review_repo: Annotated[ReviewRepository, Depends(get_review_repository)],
    order_repo: Annotated[
        ServiceOrderRepository, Depends(get_service_order_repository)
    ],
    provider_repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
) -> ReviewService:
    return ReviewService(review_repo, order_repo, provider_repo)


async def get_current_user(
    session: Annotated[AsyncSession, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
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
    if token_data.email is None:
        raise AuthenticationException("Invalid token payload")
    user_repo = UserRepository(session)
    user = await user_repo.get_by_email(token_data.email)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user
