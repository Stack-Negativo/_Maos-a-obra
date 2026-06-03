from collections.abc import Sequence
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from repositories.specialty_repository import SpecialtyRepository
from schemas.base import APIResponse
from schemas.specialty import SpecialtyCreate, SpecialtyResponse, SpecialtyUpdate
from services.specialty_service import SpecialtyService

router = APIRouter(tags=["specialties"])


async def get_specialty_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> SpecialtyService:
    repository = SpecialtyRepository(session)
    return SpecialtyService(repository)


@router.get("/", response_model=APIResponse[Sequence[SpecialtyResponse]])
async def list_specialties(
    service: Annotated[SpecialtyService, Depends(get_specialty_service)],
    only_active: bool = False,
) -> APIResponse[Sequence[SpecialtyResponse]]:
    specialties = await service.list_specialties(only_active=only_active)
    return APIResponse(data=[SpecialtyResponse.model_validate(s) for s in specialties])


@router.get("/{specialty_id}", response_model=APIResponse[SpecialtyResponse])
async def get_specialty(
    specialty_id: UUID,
    service: Annotated[SpecialtyService, Depends(get_specialty_service)],
) -> APIResponse[SpecialtyResponse]:
    specialty = await service.get_specialty(specialty_id)
    return APIResponse(data=SpecialtyResponse.model_validate(specialty))


@router.post(
    "/",
    response_model=APIResponse[SpecialtyResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_specialty(
    specialty_in: SpecialtyCreate,
    service: Annotated[SpecialtyService, Depends(get_specialty_service)],
) -> APIResponse[SpecialtyResponse]:
    specialty = await service.create_specialty(specialty_in)
    return APIResponse(data=SpecialtyResponse.model_validate(specialty))


@router.patch("/{specialty_id}", response_model=APIResponse[SpecialtyResponse])
async def update_specialty(
    specialty_id: UUID,
    specialty_in: SpecialtyUpdate,
    service: Annotated[SpecialtyService, Depends(get_specialty_service)],
) -> APIResponse[SpecialtyResponse]:
    specialty = await service.update_specialty(specialty_id, specialty_in)
    return APIResponse(data=SpecialtyResponse.model_validate(specialty))


@router.delete("/{specialty_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_specialty(
    specialty_id: UUID,
    service: Annotated[SpecialtyService, Depends(get_specialty_service)],
) -> None:
    await service.delete_specialty(specialty_id)
