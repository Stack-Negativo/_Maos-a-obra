from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.exceptions import NotFoundException
from models.user import User
from repositories.provider_repository import ProviderRepository
from schemas.scheduling import (
    BusySlotResponse,
    ProviderScheduleResponse,
    ScheduleOrderInput,
)
from services.scheduling_service import SchedulingService

from .deps import get_current_user, get_provider_repository, get_scheduling_service

router = APIRouter(tags=["Scheduling"])


@router.post(
    "/orders/{order_id}",
    response_model=BusySlotResponse,
    status_code=status.HTTP_201_CREATED,
)
async def schedule_order(
    order_id: UUID,
    payload: ScheduleOrderInput,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SchedulingService, Depends(get_scheduling_service)],
):
    """
    Schedule a service order.
    """
    return await service.schedule_order(
        order_id, current_user.id, payload.start_at, payload.end_at
    )


@router.get("/providers/{provider_id}", response_model=ProviderScheduleResponse)
async def get_provider_schedule(
    provider_id: UUID,
    service: Annotated[SchedulingService, Depends(get_scheduling_service)],
):
    slots = await service.get_provider_schedule(provider_id)
    return {"provider_id": provider_id, "busy_slots": slots}


@router.get("/me", response_model=ProviderScheduleResponse)
async def get_my_schedule(
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[SchedulingService, Depends(get_scheduling_service)],
    provider_repo: Annotated[ProviderRepository, Depends(get_provider_repository)],
):
    provider = await provider_repo.get_by_user_id(current_user.id)
    if not provider:
        raise NotFoundException("Perfil de prestador não encontrado.")

    slots = await service.get_provider_schedule(provider.id)
    return {"provider_id": provider.id, "busy_slots": slots}
