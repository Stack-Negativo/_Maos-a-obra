import asyncio
from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from core.exceptions import ConflictException
from domain.enums import PaymentStatus
from models.idempotency_key import IdempotencyKey
from models.payment import Payment
from models.payment_transaction import PaymentTransaction
from repositories.payment_repository import PaymentRepository
from repositories.service_order_repository import ServiceOrderRepository
from services.payment_service import PaymentService


@pytest.mark.asyncio
async def test_create_payment_real_idempotency_concurrency(
    engine,
    db_session,
    create_user,
    create_specialty,
    create_address,
    create_service_order,
):
    """
    Scenario: Concurrent requests with same idempotency_key.
    Expectation: Only one payment created, only one success, no 500 errors.
    """
    client = await create_user()
    specialty = await create_specialty()
    address = await create_address(client.id)
    so = await create_service_order(client.id, specialty.id, address.id)

    idempotency_key = f"concurrent-key-{uuid4()}"

    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def make_request():
        async with session_maker() as session:
            p_repo = PaymentRepository(session)
            so_repo = ServiceOrderRepository(session)
            svc = PaymentService(session, p_repo, so_repo)
            try:
                return await svc.create_payment(
                    client_id=client.id,
                    service_order_id=so.id,
                    amount=Decimal("100.00"),
                    idempotency_key_str=idempotency_key,
                    actor_id=client.id,
                )
            except Exception as e:
                return e

    # Run concurrent requests
    results = await asyncio.gather(*[make_request() for _ in range(5)])

    payments = [r for r in results if isinstance(r, Payment)]
    conflicts = [r for r in results if isinstance(r, ConflictException)]

    assert len(payments) == 1
    assert len(conflicts) == 4

    # Verify DB state
    res = await db_session.execute(
        select(Payment).where(Payment.service_order_id == so.id)
    )
    all_payments = res.scalars().all()
    assert len(all_payments) == 1


@pytest.mark.asyncio
async def test_process_payment_double_submit_concurrency(
    engine,
    db_session,
    create_user,
    create_specialty,
    create_address,
    create_service_order,
):
    """
    Scenario: Multiple concurrent requests to process the same payment.
    Expectation: Only one processing success, exactly one APPROVED ledger entry.
    """
    client = await create_user()
    specialty = await create_specialty()
    address = await create_address(client.id)
    so = await create_service_order(client.id, specialty.id, address.id)

    p_repo = PaymentRepository(db_session)
    so_repo = ServiceOrderRepository(db_session)
    svc = PaymentService(db_session, p_repo, so_repo)
    payment = await svc.create_payment(
        client_id=client.id,
        service_order_id=so.id,
        amount=Decimal("100.00"),
        idempotency_key_str=f"key-{uuid4()}",
        actor_id=client.id,
    )

    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def process_request():
        async with session_maker() as session:
            p_repo = PaymentRepository(session)
            so_repo = ServiceOrderRepository(session)
            svc = PaymentService(session, p_repo, so_repo)
            try:
                return await svc.process_payment_mock(
                    payment_id=payment.id, actor_id=client.id
                )
            except Exception as e:
                return e

    results = await asyncio.gather(*[process_request() for _ in range(5)])

    successes = [r for r in results if isinstance(r, Payment)]
    assert len(successes) == 1

    # Verify Transactions
    res = await db_session.execute(
        select(PaymentTransaction).where(PaymentTransaction.payment_id == payment.id)
    )
    txs = res.scalars().all()
    approved = [t for t in txs if t.new_status == PaymentStatus.APPROVED]
    assert len(approved) == 1


@pytest.mark.asyncio
async def test_payment_rollback_on_failure(
    db_session, create_user, create_specialty, create_address, create_service_order
):
    """
    Scenario: Failure during single-commit payment creation.
    Expectation: Full rollback, no partial data.
    """
    client = await create_user()
    specialty = await create_specialty()
    address = await create_address(client.id)
    so = await create_service_order(client.id, specialty.id, address.id)

    idempotency_key = f"rollback-key-{uuid4()}"

    p_repo = PaymentRepository(db_session)
    so_repo = ServiceOrderRepository(db_session)
    svc = PaymentService(db_session, p_repo, so_repo)

    # Force failure on commit by monkeypatching
    original_commit = db_session.commit

    async def failing_commit():
        raise Exception("Atomic Failure")

    db_session.commit = failing_commit

    so_id = so.id

    with pytest.raises(Exception, match="Atomic Failure"):
        await svc.create_payment(
            client_id=client.id,
            service_order_id=so.id,
            amount=Decimal("100.00"),
            idempotency_key_str=idempotency_key,
            actor_id=client.id,
        )

    db_session.commit = original_commit
    await db_session.rollback()
    # Verify NO data persisted
    res = await db_session.execute(
        select(Payment).where(Payment.service_order_id == so_id)
    )
    assert res.scalars().first() is None

    res = await db_session.execute(
        select(IdempotencyKey).where(IdempotencyKey.key == idempotency_key)
    )

    assert res.scalars().first() is None


@pytest.mark.asyncio
async def test_double_refund_concurrency(
    engine,
    db_session,
    create_user,
    create_specialty,
    create_address,
    create_service_order,
):
    """
    Scenario: Concurrent refund requests.
    Expectation: Only one refund success, exactly one REFUNDED transaction.
    """
    client = await create_user()
    specialty = await create_specialty()
    address = await create_address(client.id)
    so = await create_service_order(client.id, specialty.id, address.id)

    p_repo = PaymentRepository(db_session)
    so_repo = ServiceOrderRepository(db_session)
    svc = PaymentService(db_session, p_repo, so_repo)

    payment = await svc.create_payment(
        client_id=client.id,
        service_order_id=so.id,
        amount=Decimal("100.00"),
        idempotency_key_str=f"key-{uuid4()}",
        actor_id=client.id,
    )
    await svc.process_payment_mock(payment.id, client.id)

    session_maker = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    async def refund_request():
        async with session_maker() as session:
            p_repo = PaymentRepository(session)
            so_repo = ServiceOrderRepository(session)
            svc = PaymentService(session, p_repo, so_repo)
            try:
                return await svc.refund_payment(payment.id, client.id)
            except Exception as e:
                return e

    results = await asyncio.gather(*[refund_request() for _ in range(5)])

    successes = [r for r in results if isinstance(r, Payment)]
    assert len(successes) == 1

    # Verify Ledger
    res = await db_session.execute(
        select(PaymentTransaction).where(
            PaymentTransaction.payment_id == payment.id,
            PaymentTransaction.new_status == PaymentStatus.REFUNDED,
        )
    )
    refund_txs = res.scalars().all()
    assert len(refund_txs) == 1
