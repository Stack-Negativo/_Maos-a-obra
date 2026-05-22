from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from models.user import User
from schemas.service_order_application import (
    ApplicationListResponse,
    ApplicationResponse,
)
from services.service_order_application_service import ServiceOrderApplicationService

from .deps import get_application_service, get_current_user

router = APIRouter(tags=["Service Order Applications"])


@router.post(
    "/{order_id}/apply",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def apply_for_order(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        ServiceOrderApplicationService, Depends(get_application_service)
    ],
):
    return await service.apply_for_order(current_user.id, order_id)


@router.get(
    "/{order_id}/list",
    response_model=ApplicationListResponse,
)
async def list_order_applications(
    order_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        ServiceOrderApplicationService, Depends(get_application_service)
    ],
):
    apps = await service.list_order_applications(current_user.id, order_id)
    return {"applications": apps}


@router.post(
    "/{application_id}/accept",
    response_model=ApplicationResponse,
)
async def accept_application(
    application_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    service: Annotated[
        ServiceOrderApplicationService, Depends(get_application_service)
    ],
):
    return await service.accept_application(current_user.id, application_id)
