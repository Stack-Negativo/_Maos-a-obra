from uuid import UUID

from fastapi import APIRouter, Depends, status

from api.deps import get_current_user, get_provider_repository, get_scheduling_service
from core.exceptions import NotFoundException
from models.user import User
from repositories.provider_repository import ProviderRepository
from schemas.scheduling import (
    BusySlotResponse,
    ProviderScheduleResponse,
    ScheduleOrderInput,
)
from services.scheduling_service import SchedulingService

router = APIRouter(prefix="/scheduling", tags=["Scheduling"])


@router.post(
    "/orders/{order_id}",
    response_model=BusySlotResponse,
    status_code=status.HTTP_201_CREATED,
)
async def schedule_order(
    order_id: UUID,
    data: ScheduleOrderInput,
    current_user: User = Depends(get_current_user),
    service: SchedulingService = Depends(get_scheduling_service),
):
    """
    Officializes a service order schedule.
    """
    return await service.schedule_order(
        order_id, current_user.id, data.start_at, data.end_at
    )


@router.get("/providers/{provider_id}", response_model=ProviderScheduleResponse)
async def get_provider_schedule(
    provider_id: UUID,
    _current_user: User = Depends(get_current_user),
    service: SchedulingService = Depends(get_scheduling_service),
):
    """
    Returns the full schedule for a provider.
    """
    slots = await service.get_provider_schedule(provider_id)
    return {"provider_id": provider_id, "busy_slots": slots}


@router.get("/me", response_model=ProviderScheduleResponse)
async def get_my_schedule(
    current_user: User = Depends(get_current_user),
    service: SchedulingService = Depends(get_scheduling_service),
    provider_repo: ProviderRepository = Depends(get_provider_repository),
):
    """
    Returns the schedule of the authenticated provider.
    """
    provider = await provider_repo.get_by_user_id(current_user.id)
    if not provider:
        raise NotFoundException("Perfil de prestador não encontrado.")

    slots = await service.get_provider_schedule(provider.id)
    return {"provider_id": provider.id, "busy_slots": slots}
