from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from models.user import User
from repositories.provider_repository import ProviderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.base import APIResponse
from schemas.provider import ProviderResponse
from schemas.service_order import ServiceOrderListResponse, ServiceOrderResponse
from schemas.user import UserResponse
from services.provider_service import ProviderService
from services.service_order_service import ServiceOrderService

from .deps import (
    get_current_admin_user,
    get_provider_repository,
    get_service_order_service,
    get_specialty_repository,
)

router = APIRouter(tags=["admin"])


async def get_provider_service(
    provider_repository: Annotated[
        ProviderRepository,
        Depends(get_provider_repository),
    ],
    specialty_repository: Annotated[
        SpecialtyRepository,
        Depends(get_specialty_repository),
    ],
) -> ProviderService:
    return ProviderService(provider_repository, specialty_repository)


@router.get("/orders", response_model=APIResponse[ServiceOrderListResponse])
async def list_all_orders(
    _admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
) -> APIResponse[ServiceOrderListResponse]:
    orders = await service.list_all_orders()
    return APIResponse(
        data=ServiceOrderListResponse(
            orders=[ServiceOrderResponse.model_validate(o) for o in orders]
        )
    )


@router.get("/providers", response_model=APIResponse[list[ProviderResponse]])
async def list_all_providers(
    _admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[list[ProviderResponse]]:
    providers = await service.list_all_providers()
    return APIResponse(data=[ProviderResponse.model_validate(p) for p in providers])


@router.get(
    "/providers/suspended",
    response_model=APIResponse[list[ProviderResponse]],
)
async def list_suspended_providers(
    _admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[list[ProviderResponse]]:
    providers = await service.list_suspended_providers()
    return APIResponse(data=[ProviderResponse.model_validate(p) for p in providers])


@router.post(
    "/providers/{provider_id}/suspend",
    response_model=APIResponse[ProviderResponse],
)
async def suspend_provider(
    provider_id: UUID,
    _admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[ProviderResponse]:
    provider = await service.suspend_provider(provider_id)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.post(
    "/providers/{provider_id}/unsuspend",
    response_model=APIResponse[ProviderResponse],
)
async def unsuspend_provider(
    provider_id: UUID,
    _admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ProviderService, Depends(get_provider_service)],
) -> APIResponse[ProviderResponse]:
    provider = await service.unsuspend_provider(provider_id)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.post(
    "/orders/{order_id}/cancel",
    response_model=APIResponse[ServiceOrderResponse],
)
async def cancel_order_as_admin(
    order_id: UUID,
    reason: str,
    admin_user: Annotated[User, Depends(get_current_admin_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
) -> APIResponse[ServiceOrderResponse]:
    order = await service.cancel_order_as_admin(order_id, admin_user.id, reason)
    return APIResponse(data=ServiceOrderResponse.model_validate(order))


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_admin_me(
    admin_user: Annotated[User, Depends(get_current_admin_user)],
) -> APIResponse[UserResponse]:
    return APIResponse(data=UserResponse.model_validate(admin_user))
