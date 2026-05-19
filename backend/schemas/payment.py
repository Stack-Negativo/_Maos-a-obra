from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from domain.enums import PaymentStatus


class PaymentBase(BaseModel):
    amount: Decimal = Field(..., gt=0)


class PaymentCreate(PaymentBase):
    service_order_id: UUID


class PaymentResponse(PaymentBase):
    id: UUID
    service_order_id: UUID
    client_id: UUID
    status: PaymentStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentProcessRequest(BaseModel):
    # actor_id and correlation_id are expected to be provided via dependencies/headers
    pass


class PaymentRefundRequest(BaseModel):
    pass


class PaymentTransactionSchema(BaseModel):
    id: UUID
    previous_status: PaymentStatus | None
    new_status: PaymentStatus
    amount: Decimal
    reason: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
