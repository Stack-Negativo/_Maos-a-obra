from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Body, Depends, status

from models.user import User
from repositories.provider_repository import ProviderRepository
from schemas.review import (
    ReviewCreate,
    ReviewListResponse,
    ReviewResponse,
)
from schemas.service_order import (
    ServiceOrderCreate,
    ServiceOrderListResponse,
    ServiceOrderResponse,
)
from schemas.service_order_history import ServiceOrderHistoryListResponse
from services.review_service import ReviewService
from services.service_order_service import ServiceOrderService

from .deps import (
    get_current_user,
    get_provider_repository,
    get_review_service,
    get_service_order_service,
)

router = APIRouter(tags=["Service Orders"])


@router.post(
    "", response_model=ServiceOrderResponse, status_code=status.HTTP_201_CREATED
)
async def create_order(
    data: ServiceOrderCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    return await service.create_order(current_user.id, data)


@router.get("/me", response_model=ServiceOrderListResponse)
async def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    orders = await service.list_client_orders(current_user.id)
    return {"orders": orders}


@router.get(
    "/providers/me",
    response_model=ServiceOrderListResponse,
    summary="List orders available to providers",
)
async def list_provider_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    orders = await service.list_provider_orders()
    return {"orders": orders}


@router.get("/{id}", response_model=ServiceOrderResponse)
async def get_order(
    id: UUID,
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    return await service.get_order(id)


@router.post("/{id}/cancel", response_model=ServiceOrderResponse)
async def cancel_order(
    id: UUID,
    reason: Annotated[str, Body(embed=True)],
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    return await service.cancel_order(id, current_user.id, reason)


@router.post("/{id}/start", response_model=ServiceOrderResponse)
async def start_execution(
    id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    """
    Start service order execution.
    Only allowed for the selected provider.
    """
    return await service.start_execution(id, current_user.id)


@router.post("/{id}/finish", response_model=ServiceOrderResponse)
async def complete_execution(
    id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    """
    Mark service order as completed (Provider side).
    """
    return await service.complete_execution(id, current_user.id)


@router.post("/{id}/confirm", response_model=ServiceOrderResponse)
async def confirm_execution(
    id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    """
    Confirm service order finalization (Client side).
    This will transition the order to FINISHED.
    """
    return await service.confirm_execution(id, current_user.id)


@router.post(
    "/{id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_review(
    id: UUID,
    payload: ReviewCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ReviewService, Depends(get_review_service)],
):
    """
    Create a review for a finished Service Order.
    """
    return await service.create_review(current_user.id, id, payload)


@router.get("/{id}/reviews", response_model=ReviewListResponse)
async def list_order_reviews(
    id: UUID,
    service: Annotated[ReviewService, Depends(get_review_service)],
):
    """
    List all reviews for a specific Service Order.
    """
    reviews = await service.list_order_reviews(id)
    return {"reviews": reviews}


@router.get("/{id}/history", response_model=ServiceOrderHistoryListResponse)
async def list_order_history(
    id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
    provider_repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
):
    """
    List all status transitions and events for an OS.
    """
    # Validation: only owner, provider or admin can see history
    order = await service.get_order(id)
    is_client = order.client_id == current_user.id
    is_provider = order.provider and order.provider.user_id == current_user.id
    is_admin = bool(await provider_repo.get_admin_by_user_id(current_user.id))

    if not (is_client or is_provider or is_admin):
        from core.exceptions import AuthorizationException

        raise AuthorizationException(
            "Você não tem permissão para acessar o histórico desta ordem."
        )

    history = await service.list_order_history(id)
    return {"history": history}
