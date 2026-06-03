from collections.abc import Sequence
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models.user import User
from repositories.address_repository import AddressRepository
from schemas.address import AddressCreate, AddressResponse, AddressUpdate
from schemas.base import APIResponse
from services.address_service import AddressService

from .deps import get_current_active_user

router = APIRouter(tags=["addresses"])


async def get_address_service(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AddressService:
    repository = AddressRepository(session)
    return AddressService(repository)


@router.get("/", response_model=APIResponse[Sequence[AddressResponse]])
async def list_addresses(
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> APIResponse[Sequence[AddressResponse]]:
    addresses = await service.list_user_addresses(current_user.id)
    return APIResponse(data=[AddressResponse.model_validate(a) for a in addresses])


@router.get("/{address_id}", response_model=APIResponse[AddressResponse])
async def get_address(
    address_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> APIResponse[AddressResponse]:
    address = await service.get_address(address_id, current_user.id)
    return APIResponse(data=AddressResponse.model_validate(address))


@router.post(
    "/",
    response_model=APIResponse[AddressResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_address(
    data: AddressCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> APIResponse[AddressResponse]:
    address = await service.create_address(current_user.id, data)
    return APIResponse(data=AddressResponse.model_validate(address))


@router.patch("/{address_id}", response_model=APIResponse[AddressResponse])
async def update_address(
    address_id: UUID,
    data: AddressUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> APIResponse[AddressResponse]:
    address = await service.update_address(address_id, current_user.id, data)
    return APIResponse(data=AddressResponse.model_validate(address))


@router.delete("/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_address(
    address_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> None:
    await service.delete_address(address_id, current_user.id)


@router.post("/{address_id}/default", response_model=APIResponse[AddressResponse])
async def set_default_address(
    address_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    service: Annotated[AddressService, Depends(get_address_service)],
) -> APIResponse[AddressResponse]:
    address = await service.set_default_address(address_id, current_user.id)
    return APIResponse(data=AddressResponse.model_validate(address))
