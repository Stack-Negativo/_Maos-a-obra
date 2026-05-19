from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.idempotency_key import IdempotencyKey
from models.payment import Payment
from models.payment_transaction import PaymentTransaction


class PaymentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_payment(self, payment: Payment) -> Payment:
        self.session.add(payment)
        return payment

    async def get_payment_by_id(self, payment_id: UUID) -> Payment | None:
        result = await self.session.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalars().first()

    async def get_payment_by_id_for_update(self, payment_id: UUID) -> Payment | None:
        result = await self.session.execute(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        return result.scalars().first()

    async def get_payment_by_service_order_id(
        self, service_order_id: UUID
    ) -> Payment | None:
        result = await self.session.execute(
            select(Payment).where(Payment.service_order_id == service_order_id)
        )
        return result.scalars().first()

    async def update_payment(self, payment: Payment, data: dict[str, Any]) -> Payment:
        for key, value in data.items():
            setattr(payment, key, value)
        return payment

    async def create_transaction(
        self, transaction: PaymentTransaction
    ) -> PaymentTransaction:
        self.session.add(transaction)
        return transaction

    async def get_idempotency_key(self, key: str) -> IdempotencyKey | None:
        result = await self.session.execute(
            select(IdempotencyKey).where(IdempotencyKey.key == key)
        )
        return result.scalars().first()

    async def create_idempotency_key(
        self, idempotency_key: IdempotencyKey
    ) -> IdempotencyKey:
        self.session.add(idempotency_key)
        return idempotency_key
