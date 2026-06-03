from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import BusinessRuleViolation, ConflictException
from models.provider import Admin, Provider
from models.specialty import Specialty

# Importing models here ensures they are registered in the SQLAlchemy registry
from models.user import User  # pyright: ignore[reportUnusedImport] # noqa: F401
from schemas.provider import ProviderCreate
from services.provider_service import ProviderService


@pytest.fixture
def provider_repo() -> Any:
    repo = MagicMock()
    repo.session = MagicMock()
    repo.session.commit = AsyncMock()
    repo.session.refresh = AsyncMock()
    repo.session.flush = AsyncMock()
    return repo


@pytest.fixture
def specialty_repo() -> Any:
    return MagicMock()


@pytest.fixture
def service(provider_repo: Any, specialty_repo: Any) -> ProviderService:
    return ProviderService(provider_repo, specialty_repo)


@pytest.mark.asyncio
async def test_register_provider_success(
    service: ProviderService, provider_repo: Any, specialty_repo: Any
) -> None:
    user_id = uuid4()
    specialty_id = uuid4()
    data = ProviderCreate(bio="Expert electrician", specialty_ids=[specialty_id])

    provider_repo.get_by_user_id = AsyncMock(return_value=None)
    provider_repo.get_admin_by_user_id = AsyncMock(return_value=None)

    mock_specialty = MagicMock(spec=Specialty)
    mock_specialty.is_active = True
    mock_specialty.name = "Electrician"
    specialty_repo.get_by_id = AsyncMock(return_value=mock_specialty)

    provider_repo.create = AsyncMock(return_value=MagicMock(spec=Provider))
    provider_repo.get_by_id = AsyncMock(return_value=MagicMock(spec=Provider))

    await service.register_provider(user_id, data)

    provider_repo.create.assert_called_once()
    args: Any = provider_repo.create.call_args[0][0]
    assert args.user_id == user_id
    assert args.bio == "Expert electrician"
    assert len(args.specialties) == 1


@pytest.mark.asyncio
async def test_register_provider_already_exists(
    service: ProviderService, provider_repo: Any
) -> None:
    user_id = uuid4()
    data = ProviderCreate(bio=None, specialty_ids=[uuid4()])
    provider_repo.get_by_user_id = AsyncMock(return_value=MagicMock(spec=Provider))

    with pytest.raises(ConflictException):
        await service.register_provider(user_id, data)


@pytest.mark.asyncio
async def test_register_provider_as_admin_fails(
    service: ProviderService, provider_repo: Any
) -> None:
    user_id = uuid4()
    data = ProviderCreate(bio=None, specialty_ids=[uuid4()])
    provider_repo.get_by_user_id = AsyncMock(return_value=None)
    provider_repo.get_admin_by_user_id = AsyncMock(return_value=MagicMock(spec=Admin))

    with pytest.raises(BusinessRuleViolation):
        await service.register_provider(user_id, data)


@pytest.mark.asyncio
async def test_register_provider_inactive_specialty_fails(
    service: ProviderService, provider_repo: Any, specialty_repo: Any
) -> None:
    user_id = uuid4()
    specialty_id = uuid4()
    data = ProviderCreate(bio=None, specialty_ids=[specialty_id])

    provider_repo.get_by_user_id = AsyncMock(return_value=None)
    provider_repo.get_admin_by_user_id = AsyncMock(return_value=None)

    mock_specialty = MagicMock(spec=Specialty)
    mock_specialty.is_active = False
    mock_specialty.name = "Inactive Specialty"
    specialty_repo.get_by_id = AsyncMock(return_value=mock_specialty)

    with pytest.raises(BusinessRuleViolation):
        await service.register_provider(user_id, data)
