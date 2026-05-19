from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, status

from models.user import User
from schemas.payment import (
    PaymentCreate,
    PaymentResponse,
)
from services.payment_service import PaymentService

from .deps import (
    get_current_active_user,
    get_payment_service,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post(
    "",
    response_model=PaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment(
    payload: PaymentCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
    idempotency_key: Annotated[str, Header(alias="X-Idempotency-Key")],
    correlation_id: Annotated[UUID | None, Header(alias="X-Correlation-ID")] = None,
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
    return PaymentResponse.model_validate(payment)


@router.post(
    "/{payment_id}/process",
    response_model=PaymentResponse,
)
async def process_payment_mock(
    payment_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
    correlation_id: Annotated[UUID | None, Header(alias="X-Correlation-ID")] = None,
) -> PaymentResponse:
    """
    Simulate payment processing (Mock).
    """
    payment = await payment_service.process_payment_mock(
        payment_id=payment_id,
        actor_id=current_user.id,
        correlation_id=correlation_id,
    )
    return PaymentResponse.model_validate(payment)


@router.post(
    "/{payment_id}/refund",
    response_model=PaymentResponse,
)
async def refund_payment(
    payment_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
    correlation_id: Annotated[UUID | None, Header(alias="X-Correlation-ID")] = None,
) -> PaymentResponse:
    """
    Refund an approved payment.
    """
    payment = await payment_service.refund_payment(
        payment_id=payment_id,
        actor_id=current_user.id,
        correlation_id=correlation_id,
    )
    return PaymentResponse.model_validate(payment)


@router.get(
    "/{payment_id}",
    response_model=PaymentResponse,
)
async def get_payment(
    payment_id: UUID,
    payment_service: Annotated[PaymentService, Depends(get_payment_service)],
) -> PaymentResponse:
    """
    Get payment details.
    """
    payment = await payment_service.get_payment(payment_id)
    return PaymentResponse.model_validate(payment)
