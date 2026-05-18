from fastapi import APIRouter, Depends, Header, status
from uuid import UUID
from typing import Optional

from backend.api.deps import (
    get_current_active_user,
    get_payment_service,
    get_payment_repository,
)
from backend.models.user import User
from backend.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentProcessRequest,
    PaymentRefundRequest,
)
from backend.services.payment_service import PaymentService
from backend.repositories.payment_repository import PaymentRepository


router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment(
    payload: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    idempotency_key: str = Header(..., alias="X-Idempotency-Key"),
    correlation_id: Optional[UUID] = Header(None, alias="X-Correlation-ID"),
    payment_service: PaymentService = Depends(get_payment_service),
) -> PaymentResponse:
    """
    Create a new payment for a Service Order.
    Requires 'X-Idempotency-Key' header.
    """
    payment = await payment_service.create_payment(
        client_id=current_user.id,
        service_order_id=payload.service_order_id,
        amount=payload.amount,
        idempotency_key_str=idempotency_key,
        actor_id=current_user.id,
        correlation_id=correlation_id,
    )
    return payment


@router.post(
    "/{payment_id}/process",
    response_model=PaymentResponse,
)
async def process_payment_mock(
    payment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    correlation_id: Optional[UUID] = Header(None, alias="X-Correlation-ID"),
    payment_service: PaymentService = Depends(get_payment_service),
) -> PaymentResponse:
    """
    Simulate payment processing (Mock).
    """
    payment = await payment_service.process_payment_mock(
        payment_id=payment_id,
        actor_id=current_user.id,
        correlation_id=correlation_id,
    )
    return payment


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentResponse,
)
async def refund_payment(
    payment_id: UUID,
    current_user: User = Depends(get_current_active_user),
    correlation_id: Optional[UUID] = Header(None, alias="X-Correlation-ID"),
    payment_service: PaymentService = Depends(get_payment_service),
) -> PaymentResponse:
    """
    Refund an approved payment.
    """
    payment = await payment_service.refund_payment(
        payment_id=payment_id,
        actor_id=current_user.id,
        correlation_id=correlation_id,
    )
    return payment


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
async def get_payment(
    payment_id: UUID,
    payment_service: PaymentService = Depends(get_payment_service),
) -> PaymentResponse:
    """
    Get payment details.
    """
    return await payment_service.get_payment(payment_id)
