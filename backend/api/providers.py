from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.exceptions import BusinessRuleViolation
from models.user import User
from repositories.provider_repository import ProviderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.base import APIResponse
from schemas.provider import ProviderCreate, ProviderResponse, ProviderUpdate
from schemas.service_order import ServiceOrderListResponse, ServiceOrderResponse
from services.provider_service import ProviderService
from services.service_order_service import ServiceOrderService

from .deps import get_current_active_user, get_service_order_service

router = APIRouter(tags=["providers"])


async def get_provider_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> ProviderService:
    provider_repo = ProviderRepository(session)
    specialty_repo = SpecialtyRepository(session)
    return ProviderService(provider_repo, specialty_repo)


@router.post(
    "/",
    response_model=APIResponse[ProviderResponse],
    status_code=status.HTTP_201_CREATED,
    summary="Register as a provider",
)
async def register_provider(
    data: ProviderCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[ProviderResponse]:
    provider = await service.register_provider(current_user.id, data)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.get(
    "/feed",
    response_model=APIResponse[ServiceOrderListResponse],
    summary="List service orders eligible for the current provider",
)
async def list_provider_feed(
    current_user: Annotated[User, Depends(get_current_active_user)],
    provider_service: Annotated[ProviderService, Depends(get_provider_service)],
    order_service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
) -> APIResponse[ServiceOrderListResponse]:
    provider = await provider_service.get_provider_by_user_id(current_user.id)
    if provider.is_suspended:
        raise BusinessRuleViolation("Prestadores suspensos nao possuem feed ativo.")

    provider_specialty_ids = {
        provider_specialty.specialty_id for provider_specialty in provider.specialties
    }
    orders = await order_service.list_provider_orders()
    eligible_orders = [
        order
        for order in orders
        if order.provider_id is None
        and order.status.name
        in {"CREATED", "AWAITING_CANDIDATES", "AWAITING_SELECTION"}
        and order.specialty_id in provider_specialty_ids
    ]

    return APIResponse(
        data=ServiceOrderListResponse(
            orders=[
                ServiceOrderResponse.model_validate(order)
                for order in eligible_orders
            ]
        )
    )


@router.get(
    "/me",
    response_model=APIResponse[ProviderResponse],
    summary="Get current user's provider profile",
)
async def get_my_provider_profile(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[ProviderResponse]:
    provider = await service.get_provider_by_user_id(current_user.id)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.patch(
    "/me",
    response_model=APIResponse[ProviderResponse],
    summary="Update current user's provider profile",
)
async def update_my_provider_profile(
    data: ProviderUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[ProviderResponse]:
    provider = await service.update_provider(current_user.id, data)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.get(
    "/",
    response_model=APIResponse[list[ProviderResponse]],
    summary="List active providers",
)
async def list_active_providers(
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[list[ProviderResponse]]:
    providers = await service.list_active_providers()
    return APIResponse(data=[ProviderResponse.model_validate(p) for p in providers])
