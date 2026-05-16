from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from api.deps import get_current_active_user
from core.database import get_db
from models.user import User
from repositories.provider_repository import ProviderRepository
from repositories.specialty_repository import SpecialtyRepository
from schemas.base import APIResponse
from schemas.provider import ProviderCreate, ProviderResponse, ProviderUpdate
from services.provider_service import ProviderService

router = APIRouter(prefix="/providers", tags=["providers"])


async def get_provider_service(
    session: AsyncSession = Depends(get_db),
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
    current_user: User = Depends(get_current_active_user),
    service: ProviderService = Depends(get_provider_service),
) -> APIResponse[ProviderResponse]:
    provider = await service.register_provider(current_user.id, data)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.get(
    "/me",
    response_model=APIResponse[ProviderResponse],
    summary="Get current user's provider profile",
)
async def get_my_provider_profile(
    current_user: User = Depends(get_current_active_user),
    service: ProviderService = Depends(get_provider_service),
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
    current_user: User = Depends(get_current_active_user),
    service: ProviderService = Depends(get_provider_service),
) -> APIResponse[ProviderResponse]:
    provider = await service.update_provider(current_user.id, data)
    return APIResponse(data=ProviderResponse.model_validate(provider))


@router.get(
    "/",
    response_model=APIResponse[list[ProviderResponse]],
    summary="List active providers",
)
async def list_active_providers(
    service: ProviderService = Depends(get_provider_service),
) -> APIResponse[list[ProviderResponse]]:
    providers = await service.list_active_providers()
    return APIResponse(data=[ProviderResponse.model_validate(p) for p in providers])
