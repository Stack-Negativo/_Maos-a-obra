from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from domain.enums import OrderStatus


class ServiceOrderHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_order_id: UUID
    old_status: OrderStatus | None = None
    new_status: OrderStatus
    actor_id: UUID | None = None
    reason: str | None = None
    created_at: datetime


class ServiceOrderHistoryListResponse(BaseModel):
    history: list[ServiceOrderHistoryResponse]
