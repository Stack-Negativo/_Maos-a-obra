from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import (
    BusinessRuleViolation,
    ValidationException,
)
from domain.enums import OrderStatus
from models.address import Address
from models.provider import Provider
from models.service_order import ServiceOrder
from models.specialty import Specialty
from models.user import (
    User as _User,  # noqa: F401 # pyright: ignore[reportUnusedImport]
)
from schemas.service_order import ServiceOrderCreate
from services.service_order_service import ServiceOrderService


class AsyncContextManagerMock:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass


@pytest.fixture
def service_order_service():
    order_repo = MagicMock()
    address_repo = MagicMock()
    specialty_repo = MagicMock()

    # Mock session for begin() context manager
    session_mock = MagicMock()
    session_mock.begin.return_value = AsyncContextManagerMock()
    order_repo.session = session_mock

    return (
        ServiceOrderService(order_repo, address_repo, specialty_repo),
        order_repo,
        address_repo,
        specialty_repo,
    )


@pytest.mark.asyncio
async def test_create_order_success(service_order_service):
    service, order_repo, address_repo, specialty_repo = service_order_service
    client_id = uuid4()
    address_id = uuid4()
    specialty_id = uuid4()

    # Mocks
    address_repo.get_by_id = AsyncMock(
        return_value=Address(id=address_id, user_id=client_id)
    )
    specialty_repo.get_by_id = AsyncMock(
        return_value=Specialty(id=specialty_id, is_active=True)
    )

    async def mock_create(order: ServiceOrder) -> ServiceOrder:
        return order

    order_repo.create = AsyncMock(side_effect=mock_create)

    data = ServiceOrderCreate(
        title="Reparo Elétrico",
        description="Troca de fiação do chuveiro",
        address_id=address_id,
        specialty_id=specialty_id,
        preferred_date_start=datetime.now(UTC) + timedelta(days=1),
        preferred_date_end=datetime.now(UTC) + timedelta(days=1, hours=2),
    )

    order = await service.create_order(client_id, data)

    assert order.status == OrderStatus.AWAITING_CANDIDATES
    assert order.client_id == client_id
    assert order.title == data.title
    order_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_create_order_invalid_address(service_order_service):
    service, _, address_repo, _ = service_order_service
    client_id = uuid4()
    other_user_id = uuid4()
    address_id = uuid4()

    address_repo.get_by_id = AsyncMock(
        return_value=Address(id=address_id, user_id=other_user_id)
    )

    data = ServiceOrderCreate(
        title="Reparo Elétrico",
        description="Troca de fiação do chuveiro",
        address_id=address_id,
        specialty_id=uuid4(),
        preferred_date_start=datetime.now(UTC) + timedelta(days=1),
        preferred_date_end=datetime.now(UTC) + timedelta(days=1, hours=2),
    )

    with pytest.raises(ValidationException, match="Endereço inválido"):
        await service.create_order(client_id, data)


@pytest.mark.asyncio
async def test_cancel_order_success(service_order_service):
    service, order_repo, _, _ = service_order_service
    client_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id, client_id=client_id, status=OrderStatus.AWAITING_CANDIDATES
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    def update_mock(obj: ServiceOrder, data: dict[str, Any]) -> ServiceOrder:
        for key, value in data.items():
            setattr(obj, key, value)
        return obj

    order_repo.update = AsyncMock(side_effect=update_mock)

    cancelled_order = await service.cancel_order(
        order_id, client_id, "Mudança de planos"
    )

    assert cancelled_order.status == OrderStatus.CANCELLED
    order_repo.update.assert_called_once()


@pytest.mark.asyncio
async def test_start_execution_success(service_order_service):
    service, order_repo, _, _ = service_order_service
    provider_user_id = uuid4()
    order_id = uuid4()
    provider_id = uuid4()

    provider = Provider(id=provider_id, user_id=provider_user_id)
    order = ServiceOrder(
        id=order_id,
        provider_id=provider_id,
        provider=provider,
        status=OrderStatus.SCHEDULED,
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    started_order = await service.start_execution(order_id, provider_user_id)

    assert started_order.status == OrderStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_start_execution_unauthorized(service_order_service):
    service, order_repo, _, _ = service_order_service
    other_user_id = uuid4()
    order_id = uuid4()
    provider_id = uuid4()

    provider = Provider(id=provider_id, user_id=uuid4())  # Different user
    order = ServiceOrder(
        id=order_id,
        provider_id=provider_id,
        provider=provider,
        status=OrderStatus.SCHEDULED,
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="Apenas o prestador selecionado"):
        await service.start_execution(order_id, other_user_id)


@pytest.mark.asyncio
async def test_complete_execution_success(service_order_service):
    service, order_repo, _, _ = service_order_service
    provider_user_id = uuid4()
    order_id = uuid4()
    provider_id = uuid4()

    provider = Provider(id=provider_id, user_id=provider_user_id)
    order = ServiceOrder(
        id=order_id,
        provider_id=provider_id,
        provider=provider,
        status=OrderStatus.IN_PROGRESS,
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    completed_order = await service.complete_execution(order_id, provider_user_id)

    assert completed_order.provider_finished_at is not None
    assert completed_order.status == OrderStatus.IN_PROGRESS  # Status doesn't change


@pytest.mark.asyncio
async def test_confirm_execution_success(service_order_service):
    service, order_repo, _, _ = service_order_service
    client_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        status=OrderStatus.IN_PROGRESS,
        provider_finished_at=datetime.now(UTC),
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    confirmed_order = await service.confirm_execution(order_id, client_id)

    assert confirmed_order.status == OrderStatus.FINISHED


@pytest.mark.asyncio
async def test_confirm_execution_missing_provider_finish(service_order_service):
    service, order_repo, _, _ = service_order_service
    client_id = uuid4()
    order_id = uuid4()

    # Provider hasn't finished yet
    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        status=OrderStatus.IN_PROGRESS,
        provider_finished_at=None,
    )

    order_repo.get_by_id_for_update = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="sinalizada pelo prestador"):
        await service.confirm_execution(order_id, client_id)
