from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import AuthorizationException
from models.address import Address
from schemas.address import AddressCreate, AddressUpdate
from services.address_service import AddressService


@pytest.fixture
def mock_repo() -> Any:
    repo = MagicMock()
    repo.session = MagicMock()
    repo.session.commit = AsyncMock()
    repo.session.refresh = AsyncMock()
    repo.session.flush = AsyncMock()
    return repo


@pytest.fixture
def service(mock_repo: Any) -> AddressService:
    return AddressService(mock_repo)


@pytest.mark.asyncio
async def test_create_first_address_sets_default(
    service: AddressService, mock_repo: Any
) -> None:
    user_id = uuid4()
    address_in = AddressCreate(
        zip_code="12345",
        street="Main St",
        number="100",
        neighborhood="Downtown",
        city="Springfield",
        state="IL",
        is_default=False,
    )

    mock_repo.get_all_by_user_id = AsyncMock(return_value=[])
    mock_repo.create = AsyncMock(return_value=MagicMock(spec=Address))

    await service.create_address(user_id, address_in)

    # Should call create with is_default=True because it's the first address
    args: Any = mock_repo.create.call_args[0]
    assert args[0] == user_id
    assert args[1]["is_default"] is True


@pytest.mark.asyncio
async def test_get_address_not_owner_raises_error(
    service: AddressService, mock_repo: Any
) -> None:
    user_id = uuid4()
    other_user_id = uuid4()
    address_id = uuid4()

    mock_address = MagicMock(spec=Address)
    mock_address.user_id = other_user_id
    mock_repo.get_by_id = AsyncMock(return_value=mock_address)

    with pytest.raises(AuthorizationException):
        await service.get_address(address_id, user_id)


@pytest.mark.asyncio
async def test_update_set_default_unsets_previous(
    service: AddressService, mock_repo: Any
) -> None:
    user_id = uuid4()
    address_id = uuid4()
    address_in = AddressUpdate(is_default=True)

    mock_address = MagicMock(spec=Address)
    mock_address.user_id = user_id
    mock_address.is_default = False
    mock_repo.get_by_id = AsyncMock(return_value=mock_address)
    mock_repo.unset_default_for_user = AsyncMock()
    mock_repo.update = AsyncMock()

    await service.update_address(address_id, user_id, address_in)

    mock_repo.unset_default_for_user.assert_called_once_with(user_id)
    mock_repo.update.assert_called_once()
