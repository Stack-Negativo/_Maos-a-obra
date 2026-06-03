from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
)
from domain.enums import OrderStatus, ReviewDirection
from models.provider import Provider
from models.review import Review
from models.service_order import ServiceOrder
from schemas.review import ReviewCreate
from services.review_service import ReviewService


class AsyncContextManagerMock:
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass


@pytest.fixture
def review_service():
    review_repo = MagicMock()
    review_repo.create = AsyncMock()
    review_repo.get_by_order_and_direction = AsyncMock()
    review_repo.list_by_order = AsyncMock()
    review_repo.get_provider_stats = AsyncMock()
    review_repo.get_last_n_reviews_average = AsyncMock()

    order_repo = MagicMock()
    order_repo.get_by_id = AsyncMock()

    provider_repo = MagicMock()
    provider_repo.get_by_id = AsyncMock()
    provider_repo.get_by_user_id = AsyncMock()

    # Mock session for begin() context manager
    session_mock = MagicMock()
    session_mock.begin.return_value = AsyncContextManagerMock()
    session_mock.flush = AsyncMock()
    session_mock.commit = AsyncMock()
    session_mock.refresh = AsyncMock()
    review_repo.session = session_mock

    return (
        ReviewService(review_repo, order_repo, provider_repo),
        review_repo,
        order_repo,
        provider_repo,
    )


@pytest.mark.asyncio
async def test_create_review_client_to_provider_success(review_service):
    service, review_repo, order_repo, provider_repo = review_service
    client_id = uuid4()
    provider_user_id = uuid4()
    provider_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        status=OrderStatus.FINISHED,
    )
    provider = Provider(id=provider_id, user_id=provider_user_id)

    order_repo.get_by_id = AsyncMock(return_value=order)
    provider_repo.get_by_id = AsyncMock(return_value=provider)
    review_repo.get_by_order_and_direction = AsyncMock(return_value=None)
    review_repo.get_provider_stats = AsyncMock(return_value=(4.5, 5))
    review_repo.get_last_n_reviews_average = AsyncMock(return_value=4.5)

    data = ReviewCreate(
        rating=5,
        comment="Ótimo serviço",
        direction=ReviewDirection.CLIENT_TO_PROVIDER,
    )

    review = await service.create_review(client_id, order_id, data)

    assert review.rating == 5
    assert review.reviewed_id == provider_user_id
    assert provider.rating_average == 4.5
    assert provider.total_reviews == 5
    review_repo.create.assert_called_once()


@pytest.mark.asyncio
async def test_create_review_order_not_finished(review_service):
    service, _, order_repo, _ = review_service
    client_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id, client_id=client_id, status=OrderStatus.IN_PROGRESS
    )
    order_repo.get_by_id = AsyncMock(return_value=order)

    data = ReviewCreate(
        rating=5,
        direction=ReviewDirection.CLIENT_TO_PROVIDER,
        comment=None,
    )

    with pytest.raises(BusinessRuleViolation, match="após a finalização"):
        await service.create_review(client_id, order_id, data)


@pytest.mark.asyncio
async def test_create_review_self_review_prohibited(review_service):
    service, _, order_repo, provider_repo = review_service
    client_id = uuid4()
    order_id = uuid4()

    # Client tries to evaluate themselves (direction CLIENT_TO_PROVIDER
    # but reviewer user_id is the same as provider's user_id)

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=uuid4(),
        status=OrderStatus.FINISHED,
    )
    order_repo.get_by_id = AsyncMock(return_value=order)

    # Provider mock to return the client_id as provider user_id
    provider = Provider(id=order.provider_id, user_id=client_id)
    provider_repo.get_by_id = AsyncMock(return_value=provider)

    data = ReviewCreate(
        rating=5,
        direction=ReviewDirection.CLIENT_TO_PROVIDER,
        comment=None,
    )

    with pytest.raises(BusinessRuleViolation, match="não pode avaliar a si próprio"):
        await service.create_review(client_id, order_id, data)


@pytest.mark.asyncio
async def test_create_review_already_exists(review_service):
    service, review_repo, order_repo, provider_repo = review_service
    client_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=uuid4(),
        status=OrderStatus.FINISHED,
    )
    provider = Provider(id=order.provider_id, user_id=uuid4())

    order_repo.get_by_id = AsyncMock(return_value=order)
    provider_repo.get_by_id = AsyncMock(return_value=provider)
    review_repo.get_by_order_and_direction = AsyncMock(return_value=Review())

    data = ReviewCreate(
        rating=5,
        direction=ReviewDirection.CLIENT_TO_PROVIDER,
        comment=None,
    )

    with pytest.raises(ConflictException, match="já realizou esta avaliação"):
        await service.create_review(client_id, order_id, data)


@pytest.mark.asyncio
async def test_provider_suspension_on_low_rating(review_service):
    service, review_repo, order_repo, provider_repo = review_service
    client_id = uuid4()
    provider_user_id = uuid4()
    provider_id = uuid4()
    order_id = uuid4()

    order = ServiceOrder(
        id=order_id,
        client_id=client_id,
        provider_id=provider_id,
        status=OrderStatus.FINISHED,
    )
    provider = Provider(id=provider_id, user_id=provider_user_id, total_reviews=9)

    order_repo.get_by_id = AsyncMock(return_value=order)
    provider_repo.get_by_id = AsyncMock(return_value=provider)
    review_repo.get_by_order_and_direction = AsyncMock(return_value=None)

    # After 10th review, average drops below 3
    review_repo.get_provider_stats = AsyncMock(return_value=(2.8, 10))
    review_repo.get_last_n_reviews_average = AsyncMock(return_value=2.8)

    data = ReviewCreate(
        rating=1,
        direction=ReviewDirection.CLIENT_TO_PROVIDER,
        comment=None,
    )

    await service.create_review(client_id, order_id, data)

    assert provider.is_suspended is True
    assert provider.suspended_at is not None
