from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import (
    ValidationException,
)
from domain.enums import OrderStatus
from models.address import Address
from models.service_order import ServiceOrder
from models.specialty import Specialty
from models.user import (
    User as _User,  # noqa: F401 # pyright: ignore[reportUnusedImport]
)
from schemas.service_order import ServiceOrderCreate
from services.service_order_service import ServiceOrderService


@pytest.fixture
def service_order_service():
    order_repo = MagicMock()
    address_repo = MagicMock()
    specialty_repo = MagicMock()
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

    order_repo.get_by_id = AsyncMock(return_value=order)

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
async def test_cancel_order_invalid_transition(service_order_service):
    service, order_repo, _, _ = service_order_service
    client_id = uuid4()
    order_id = uuid4()

    # Terminal state
    order = ServiceOrder(id=order_id, client_id=client_id, status=OrderStatus.FINISHED)

    order_repo.get_by_id = AsyncMock(return_value=order)

    from core.exceptions import InvalidStatusTransitionException

    with pytest.raises(InvalidStatusTransitionException):
        await service.cancel_order(
            order_id, client_id, "Tentar cancelar o que já terminou"
        )
