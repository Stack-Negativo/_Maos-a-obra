from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
)
from domain.enums import OrderStatus
from models.address import Address as Address  # noqa: F401
from models.provider import Provider
from models.scheduling import ProviderBusySlot
from models.service_order import ServiceOrder
from models.specialty import Specialty as Specialty  # noqa: F401

# Standard SQLAlchemy initialization requires all related models to be loaded
from models.user import User as User  # noqa: F401
from services.scheduling_service import SchedulingService


@pytest.fixture
def scheduling_service():
    scheduling_repo = MagicMock()
    order_repo = MagicMock()
    provider_repo = MagicMock()

    # Mocking the session and transaction context
    session = MagicMock()

    # Simple sync mock for context manager (SQLAlchemy session.begin()
    # returns a sync object)

    transaction_cm = MagicMock()
    transaction_cm.__aenter__ = AsyncMock()
    transaction_cm.__aexit__ = AsyncMock()
    session.begin = MagicMock(return_value=transaction_cm)

    scheduling_repo.session = session

    return (
        SchedulingService(scheduling_repo, order_repo, provider_repo),
        scheduling_repo,
        order_repo,
        provider_repo,
    )


@pytest.mark.asyncio
async def test_schedule_order_success(scheduling_service):
    service, scheduling_repo, order_repo, _ = scheduling_service

    client_id = uuid4()
    provider_id = uuid4()
    provider_user_id = uuid4()
    order_id = uuid4()

    start_at = datetime.now(UTC) + timedelta(days=1)
    end_at = start_at + timedelta(hours=2)

    # Mocks
    provider = MagicMock(spec=Provider)
    provider.id = provider_id
    provider.user_id = provider_user_id

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        status=OrderStatus.PROVIDER_SELECTED,
        title="Test Order",
    )
    # Injecting provider mock directly into the relationship slot
    order.provider = provider

    order_repo.get_by_id = AsyncMock(return_value=order)
    scheduling_repo.find_overlaps = AsyncMock(return_value=[])

    async def mock_create(slot: ProviderBusySlot) -> ProviderBusySlot:
        return slot

    scheduling_repo.create_busy_slot = AsyncMock(side_effect=mock_create)

    # Act
    busy_slot = await service.schedule_order(order_id, client_id, start_at, end_at)

    # Assert
    assert order.status == OrderStatus.SCHEDULED
    assert order.scheduled_at == start_at
    assert busy_slot.provider_id == provider_id
    assert busy_slot.service_order_id == order_id
    scheduling_repo.create_busy_slot.assert_called_once()


@pytest.mark.asyncio
async def test_schedule_order_overlap_conflict(scheduling_service):
    service, scheduling_repo, order_repo, _ = scheduling_service

    client_id = uuid4()
    provider_id = uuid4()
    order_id = uuid4()

    start_at = datetime.now(UTC) + timedelta(days=1)
    end_at = start_at + timedelta(hours=2)

    # Mocks
    provider = MagicMock(spec=Provider)
    provider.id = provider_id
    provider.user_id = uuid4()

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        status=OrderStatus.PROVIDER_SELECTED,
        title="Conflict Order",
    )
    order.provider = provider

    order_repo.get_by_id = AsyncMock(return_value=order)

    # We must ensure find_overlaps returns a list with length > 0
    # Use a real list, not a mock for the list itself
    scheduling_repo.find_overlaps = AsyncMock()
    scheduling_repo.find_overlaps.return_value = [MagicMock()]

    # ACT & ASSERT
    with pytest.raises(ConflictException, match="O prestador já possui um compromisso"):
        await service.schedule_order(order_id, client_id, start_at, end_at)


@pytest.mark.asyncio
async def test_schedule_order_past_date_prohibited(scheduling_service):
    service, _, _, _ = scheduling_service

    client_id = uuid4()
    order_id = uuid4()

    # Past date
    start_at = datetime.now(UTC) - timedelta(hours=1)
    end_at = start_at + timedelta(hours=2)

    with pytest.raises(BusinessRuleViolation, match="agendamento no passado"):
        await service.schedule_order(order_id, client_id, start_at, end_at)


@pytest.mark.asyncio
async def test_schedule_order_invalid_status(scheduling_service):
    service, _, order_repo, _ = scheduling_service

    client_id = uuid4()
    order_id = uuid4()

    start_at = datetime.now(UTC) + timedelta(days=1)
    end_at = start_at + timedelta(hours=2)

    # Status is AWAITING_SELECTION, not PROVIDER_SELECTED
    order = ServiceOrder(
        id=order_id, client_id=client_id, status=OrderStatus.AWAITING_SELECTION
    )

    order_repo.get_by_id = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="PROVIDER_SELECTED"):
        await service.schedule_order(order_id, client_id, start_at, end_at)


@pytest.mark.asyncio
async def test_schedule_order_permission_denied(scheduling_service):
    service, _, order_repo, _ = scheduling_service

    other_user_id = uuid4()
    order_id = uuid4()

    start_at = datetime.now(UTC) + timedelta(days=1)
    end_at = start_at + timedelta(hours=2)

    order = ServiceOrder(
        id=order_id,
        client_id=uuid4(),  # Different client
        provider_id=uuid4(),
        status=OrderStatus.PROVIDER_SELECTED,
    )

    order_repo.get_by_id = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="Apenas o cliente ou o prestador"):
        await service.schedule_order(order_id, other_user_id, start_at, end_at)
