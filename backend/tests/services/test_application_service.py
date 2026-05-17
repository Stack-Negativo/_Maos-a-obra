from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import (
    BusinessRuleViolation,
)
from domain.enums import ApplicationStatus, OrderStatus
from models.address import Address  # noqa: F401 # pyright: ignore[reportUnusedImport]
from models.provider import Provider, ProviderSpecialty
from models.service_order import ServiceOrder
from models.service_order_application import ServiceOrderApplication
from models.specialty import (
    Specialty,  # noqa: F401 # pyright: ignore[reportUnusedImport]
)
from models.user import (
    User as _User,  # noqa: F401 # pyright: ignore[reportUnusedImport]
)
from services.service_order_application_service import ServiceOrderApplicationService


@pytest.fixture
def application_service():
    app_repo = MagicMock()
    order_repo = MagicMock()
    provider_repo = MagicMock()

    # Mock session for transactional block
    app_repo.session = MagicMock()
    app_repo.session.begin = MagicMock()
    app_repo.session.begin.return_value.__aenter__ = AsyncMock()
    app_repo.session.begin.return_value.__aexit__ = AsyncMock()

    return (
        ServiceOrderApplicationService(app_repo, order_repo, provider_repo),
        app_repo,
        order_repo,
        provider_repo,
    )


@pytest.mark.asyncio
async def test_apply_for_order_success(application_service):
    service, app_repo, order_repo, provider_repo = application_service
    provider_user_id = uuid4()
    order_id = uuid4()
    specialty_id = uuid4()

    provider = Provider(
        id=uuid4(),
        user_id=provider_user_id,
        is_suspended=False,
    )
    provider.specialties = [ProviderSpecialty(specialty_id=specialty_id)]

    order = ServiceOrder(
        id=order_id,
        client_id=uuid4(),
        specialty_id=specialty_id,
        status=OrderStatus.AWAITING_CANDIDATES,
    )

    provider_repo.get_by_user_id = AsyncMock(return_value=provider)
    order_repo.get_by_id = AsyncMock(return_value=order)
    app_repo.get_by_order_and_provider = AsyncMock(return_value=None)

    async def mock_create(obj):
        return obj

    app_repo.create = AsyncMock(side_effect=mock_create)

    application = await service.apply_for_order(provider_user_id, order_id)

    assert application.service_order_id == order_id
    assert application.provider_id == provider.id
    assert order.status == OrderStatus.AWAITING_SELECTION


@pytest.mark.asyncio
async def test_apply_for_order_self_application(application_service):
    service, _, order_repo, provider_repo = application_service
    user_id = uuid4()
    order_id = uuid4()

    provider = Provider(id=uuid4(), user_id=user_id, is_suspended=False)
    order = ServiceOrder(
        id=order_id, client_id=user_id, status=OrderStatus.AWAITING_CANDIDATES
    )

    provider_repo.get_by_user_id = AsyncMock(return_value=provider)
    order_repo.get_by_id = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="própria ordem"):
        await service.apply_for_order(user_id, order_id)


@pytest.mark.asyncio
async def test_accept_application_success(application_service):
    service, app_repo, order_repo, _ = application_service
    client_user_id = uuid4()
    order_id = uuid4()
    provider_id = uuid4()
    application_id = uuid4()

    order = ServiceOrder(
        id=order_id, client_id=client_user_id, status=OrderStatus.AWAITING_SELECTION
    )
    application = ServiceOrderApplication(
        id=application_id,
        service_order_id=order_id,
        provider_id=provider_id,
        status=ApplicationStatus.PENDING,
    )

    app_repo.get_by_id = AsyncMock(return_value=application)
    order_repo.get_by_id = AsyncMock(return_value=order)
    app_repo.reject_others = AsyncMock()

    accepted_app = await service.accept_application(client_user_id, application_id)

    assert accepted_app.status == ApplicationStatus.ACCEPTED
    assert order.status == OrderStatus.PROVIDER_SELECTED
    assert order.provider_id == provider_id
    app_repo.reject_others.assert_called_once_with(order_id, application_id)


@pytest.mark.asyncio
async def test_apply_for_order_incompatible_specialty(application_service):
    service, _, order_repo, provider_repo = application_service
    provider_user_id = uuid4()
    order_id = uuid4()

    provider = Provider(id=uuid4(), user_id=provider_user_id, is_suspended=False)
    provider.specialties = [ProviderSpecialty(specialty_id=uuid4())]

    order = ServiceOrder(
        id=order_id,
        client_id=uuid4(),
        specialty_id=uuid4(),  # Different
        status=OrderStatus.AWAITING_CANDIDATES,
    )

    provider_repo.get_by_user_id = AsyncMock(return_value=provider)
    order_repo.get_by_id = AsyncMock(return_value=order)

    with pytest.raises(BusinessRuleViolation, match="especialidade necessária"):
        await service.apply_for_order(provider_user_id, order_id)
