from datetime import UTC, datetime
from decimal import Decimal
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

import pytest

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
    ValidationException,
)
from domain.enums import PaymentStatus, OrderStatus
from models.idempotency_key import IdempotencyKey
from models.payment import Payment
from models.payment_transaction import PaymentTransaction
from models.service_order import ServiceOrder
from models.user import User
from repositories.payment_repository import PaymentRepository
from repositories.service_order_repository import ServiceOrderRepository
from services.payment_service import PaymentService


@pytest.fixture
def payment_service():
    session = AsyncMock()
    payment_repo = MagicMock(spec=PaymentRepository)
    order_repo = MagicMock(spec=ServiceOrderRepository)
    return (
        PaymentService(session, payment_repo, order_repo),
        session,
        payment_repo,
        order_repo,
    )


@pytest.mark.asyncio
async def test_create_payment_success(payment_service):
    service, session, payment_repo, order_repo = payment_service
    client_id = uuid4()
    service_order_id = uuid4()
    amount = Decimal("100.00")
    idempotency_key = "test-key"
    actor_id = uuid4()

    # Mocks
    payment_repo.get_idempotency_key = AsyncMock(return_value=None)
    order_repo.get_by_id = AsyncMock(
        return_value=ServiceOrder(id=service_order_id, client_id=client_id)
    )
    payment_repo.get_payment_by_service_order_id = AsyncMock(return_value=None)
    payment_repo.create_payment = AsyncMock() # Not actually used in service, service uses session.add
    # Wait, PaymentService uses session.add directly. I need to mock session.add and session.commit.
    # Actually, I'll let the session be an AsyncMock.
    
    # In create_payment:
    # 1. check idempotency
    # 2. check order
    # 3. check existing payment
    # 4. create payment
    # 5. create transaction
    # 6. create idempotency key
    # 7. commit

    # Mocking the session behavior
    payment = await service.create_payment(
        client_id=client_id,
        service_order_id=service_order_id,
        amount=amount,
        idempotency_key_str=idempotency_key,
        actor_id=actor_id,
    )

    assert payment.amount == amount
    assert payment.status == PaymentStatus.PENDING
    assert session.add.call_count >= 3  # payment, transaction, idempotency_key
    assert session.commit.call_count >= 2 # one for primary creation, one for updating idempotency key
    payment_repo.get_idempotency_key.assert_called_once_with(idempotency_key)


@pytest.mark.asyncio
async def test_create_payment_idempotency_hit(payment_service):
    service, session, payment_repo, _ = payment_service
    idempotency_key = "existing-key"
    
    payment_repo.get_idempotency_key = AsyncMock(
        return_value=IdempotencyKey(key=idempotency_key, actor_id=uuid4(), created_at=datetime.now(UTC))
    )

    with pytest.raises(ConflictException, match="already used"):
        await service.create_payment(
            client_id=uuid4(),
            service_order_id=uuid4(),
            amount=Decimal("10.00"),
            idempotency_key_str=idempotency_key,
            actor_id=uuid4(),
        )


@pytest.mark.asyncio
async def test_process_payment_mock_success(payment_service):
    service, session, payment_repo, order_repo = payment_service
    payment_id = uuid4()
    actor_id = uuid4()
    
    payment = Payment(
        id=payment_id,
        amount=Decimal("100.00"),
        status=PaymentStatus.PENDING,
        service_order_id=uuid4(),
        client_id=uuid4(),
        actor_id=actor_id,
        source="test",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    
    payment_repo.get_payment_by_id = AsyncMock(return_value=payment)
    order_repo.get_by_id = AsyncMock(
        return_value=ServiceOrder(id=payment.service_order_id, client_id=payment.client_id)
    )

    processed_payment = await service.process_payment_mock(
        payment_id=payment_id,
        actor_id=actor_id,
    )

    assert processed_payment.status == PaymentStatus.APPROVED
    assert session.commit.call_count >= 2  # once for PROCESSING, once for APPROVED


@pytest.mark.asyncio
async def test_refund_payment_success(payment_service):
    service, session, payment_repo, _ = payment_service
    payment_id = uuid4()
    actor_id = uuid4()
    
    payment = Payment(
        id=payment_id,
        amount=Decimal("100.00"),
        status=PaymentStatus.APPROVED,
        service_order_id=uuid4(),
        client_id=uuid4(),
        actor_id=actor_id,
        source="test",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    
    payment_repo.get_payment_by_id = AsyncMock(return_value=payment)

    refunded_payment = await service.refund_payment(
        payment_id=payment_id,
        actor_id=actor_id,
    )

    assert refunded_payment.status == PaymentStatus.REFUNDED
    assert session.commit.call_count == 1


@pytest.mark.asyncio
async def test_refund_payment_invalid_status(payment_service):
    service, session, payment_repo, _ = payment_service
    payment_id = uuid4()
    
    payment = Payment(
        id=payment_id,
        amount=Decimal("100.00"),
        status=PaymentStatus.PENDING, # Cannot refund pending
        service_order_id=uuid4(),
        client_id=uuid4(),
        actor_id=uuid4(),
        source="test",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    
    payment_repo.get_payment_by_id = AsyncMock(return_value=payment)

    with pytest.raises(BusinessRuleViolation, match="Only approved payments"):
        await service.refund_payment(
            payment_id=payment_id,
            actor_id=uuid4(),
        )
