from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from models.user import User
from schemas.service_order import (
    ServiceOrderCreate,
    ServiceOrderListResponse,
    ServiceOrderResponse,
)
from services.service_order_service import ServiceOrderService

from .deps import get_current_user, get_service_order_service

router = APIRouter(prefix="/orders", tags=["Service Orders"])


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


@router.get("/{id}", response_model=ServiceOrderResponse)
async def get_order(
    id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    order = await service.get_order(id)
    # Check if user is owner or admin (future)
    if order.client_id != current_user.id:
        from core.exceptions import AuthorizationException

        raise AuthorizationException("Você não tem permissão para acessar esta ordem.")
    return order


@router.post("/{id}/cancel", response_model=ServiceOrderResponse)
async def cancel_order(
    id: UUID,
    reason: str,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[ServiceOrderService, Depends(get_service_order_service)],
):
    return await service.cancel_order(id, current_user.id, reason)
