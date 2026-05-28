from datetime import UTC, datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    BusinessRuleViolation,
    ConflictException,
    NotFoundException,
    ValidationException,
)
from domain.enums import PaymentStatus
from domain.value_objects.audit_metadata import AuditMetadata
from models.idempotency_key import IdempotencyKey
from models.payment import Payment
from models.payment_transaction import PaymentTransaction
from repositories.payment_repository import PaymentRepository
from repositories.service_order_repository import ServiceOrderRepository


class PaymentService:
    def __init__(
        self,
        session: AsyncSession,
        payment_repository: PaymentRepository,
        service_order_repository: ServiceOrderRepository,
    ):
        self.session = session
        self.payment_repository = payment_repository
        self.service_order_repository = service_order_repository

    async def create_payment(
        self,
        client_id: UUID,
        service_order_id: UUID,
        amount: Decimal,
        idempotency_key_str: str,
        actor_id: UUID,
        correlation_id: UUID | None = None,
        source: str = "api",
    ) -> Payment:
        # 1. Check Idempotency (Pre-check)
        existing_idempotency = await self.payment_repository.get_idempotency_key(
            idempotency_key_str
        )
        if existing_idempotency:
            if (
                existing_idempotency.status_code
                and existing_idempotency.status_code < 400
            ):
                raise ConflictException(
                    f"Idempotency key {idempotency_key_str} already used."
                )
            raise ConflictException(
                f"Idempotency key {idempotency_key_str} failed previously."
            )

        # 2. Validate Service Order
        service_order = await self.service_order_repository.get_by_id(service_order_id)
        if not service_order:
            raise NotFoundException("Service Order not found.")

        if service_order.client_id != client_id:
            raise BusinessRuleViolation("Client does not own this Service Order.")

        # 3. Check if payment exists (prevent double payment)
        existing_payment = (
            await self.payment_repository.get_payment_by_service_order_id(
                service_order_id
            )
        )
        if existing_payment:
            raise BusinessRuleViolation(
                "A payment already exists for this Service Order."
            )

        # 4. Validate Amount
        if amount <= Decimal("0.00"):
            raise ValidationException("Amount must be positive.")

        # 5. Prepare Entities
        audit_metadata = AuditMetadata(
            actor_id=actor_id,
            timestamp=datetime.now(UTC),
            source=source,
            correlation_id=correlation_id,
        )

        payment = Payment(
            service_order_id=service_order_id,
            client_id=client_id,
            amount=amount,
            status=PaymentStatus.PENDING,
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
            updated_at=audit_metadata.timestamp,
        )

        transaction = PaymentTransaction(
            payment=payment,
            previous_status=None,
            new_status=PaymentStatus.PENDING,
            amount=amount,
            reason="Initial payment request",
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
        )

        idempotency_key = IdempotencyKey(
            key=idempotency_key_str,
            actor_id=actor_id,
            created_at=audit_metadata.timestamp,
            status_code=201,
            response_body={"payment_id": str(payment.id)},
        )

        # 6. Atomic Persistence
        try:
            self.session.add(payment)
            self.session.add(transaction)
            self.session.add(idempotency_key)
            await self.session.commit()
            await self.session.refresh(payment)
            return payment
        except IntegrityError as err:
            await self.session.rollback()
            raise ConflictException(
                f"Idempotency key {idempotency_key_str} race condition detected."
            ) from err

    async def process_payment_mock(
        self,
        payment_id: UUID,
        actor_id: UUID,
        correlation_id: UUID | None = None,
        source: str = "api",
    ) -> Payment:
        payment = await self.payment_repository.get_payment_by_id_for_update(payment_id)
        if not payment:
            raise NotFoundException("Payment not found.")

        if payment.status != PaymentStatus.PENDING:
            raise BusinessRuleViolation(
                f"Payment cannot be processed in status {payment.status}."
            )

        audit_metadata = AuditMetadata(
            actor_id=actor_id,
            timestamp=datetime.now(UTC),
            source=source,
            correlation_id=correlation_id,
        )

        is_approved = True
        new_status = PaymentStatus.APPROVED if is_approved else PaymentStatus.DECLINED

        previous_status = payment.status
        payment.status = new_status
        payment.updated_at = audit_metadata.timestamp

        transaction = PaymentTransaction(
            payment=payment,
            previous_status=previous_status,
            new_status=new_status,
            amount=payment.amount,
            reason=(
                f"Mock processing completed: "
                f"{'approved' if is_approved else 'declined'}"
            ),
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
        )
        self.session.add(transaction)

        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def auto_create_and_process_payment(
        self,
        client_id: UUID,
        service_order_id: UUID,
        amount: Decimal,
        actor_id: UUID,
        correlation_id: UUID | None = None,
        source: str = "internal",
    ) -> Payment:
        """
        Automated flow: Create PENDING payment and immediately process it (mock).
        Does not commit (delegates to caller).
        """
        audit_metadata = AuditMetadata(
            actor_id=actor_id,
            timestamp=datetime.now(UTC),
            source=source,
            correlation_id=correlation_id,
        )

        payment = Payment(
            service_order_id=service_order_id,
            client_id=client_id,
            amount=amount,
            status=PaymentStatus.PENDING,
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
            updated_at=audit_metadata.timestamp,
        )

        transaction_pending = PaymentTransaction(
            payment=payment,
            previous_status=None,
            new_status=PaymentStatus.PENDING,
            amount=amount,
            reason="Automated payment trigger (OS Finalized)",
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
        )

        payment.status = PaymentStatus.APPROVED
        payment.updated_at = audit_metadata.timestamp

        transaction_approved = PaymentTransaction(
            payment=payment,
            previous_status=PaymentStatus.PENDING,
            new_status=PaymentStatus.APPROVED,
            amount=amount,
            reason="Automated mock approval",
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
        )

        self.session.add(payment)
        self.session.add(transaction_pending)
        self.session.add(transaction_approved)
        return payment

    async def refund_payment(
        self,
        payment_id: UUID,
        actor_id: UUID,
        correlation_id: UUID | None = None,
        source: str = "api",
    ) -> Payment:
        payment = await self.payment_repository.get_payment_by_id_for_update(payment_id)
        if not payment:
            raise NotFoundException("Payment not found.")

        if payment.status != PaymentStatus.APPROVED:
            raise BusinessRuleViolation("Only approved payments can be refunded.")

        audit_metadata = AuditMetadata(
            actor_id=actor_id,
            timestamp=datetime.now(UTC),
            source=source,
            correlation_id=correlation_id,
        )

        previous_status = payment.status
        payment.status = PaymentStatus.REFUNDED
        payment.updated_at = audit_metadata.timestamp

        transaction = PaymentTransaction(
            payment=payment,
            previous_status=previous_status,
            new_status=PaymentStatus.REFUNDED,
            amount=payment.amount,
            reason="Refund requested",
            actor_id=audit_metadata.actor_id,
            correlation_id=audit_metadata.correlation_id,
            source=audit_metadata.source,
            created_at=audit_metadata.timestamp,
        )
        self.session.add(transaction)

        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def get_payment(self, payment_id: UUID) -> Payment:
        payment = await self.payment_repository.get_payment_by_id(payment_id)
        if not payment:
            raise NotFoundException("Payment not found.")
        return payment
