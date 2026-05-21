from datetime import datetime
from decimal import Decimal
from typing import Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from core.exceptions import ValidationException
from domain.enums import OrderStatus
from domain.value_objects.date_range import DateRange


class ServiceOrderBase(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10)
    address_id: UUID
    specialty_id: UUID
    preferred_date_start: datetime
    preferred_date_end: datetime

    @model_validator(mode="after")
    def validate_dates(self) -> Self:
        try:
            DateRange(
                start_at=self.preferred_date_start, end_at=self.preferred_date_end
            )
        except Exception as e:
            raise ValidationException(str(e)) from e
        return self


class ServiceOrderCreate(ServiceOrderBase):
    pass


class ServiceOrderUpdate(BaseModel):
    title: str | None = Field(None, min_length=5, max_length=255)
    description: str | None = Field(None, min_length=10)
    preferred_date_start: datetime | None = None
    preferred_date_end: datetime | None = None

    @model_validator(mode="after")
    def validate_dates_if_present(self) -> Self:
        if self.preferred_date_start and self.preferred_date_end:
            try:
                DateRange(
                    start_at=self.preferred_date_start, end_at=self.preferred_date_end
                )
            except Exception as e:
                raise ValidationException(str(e)) from e
        return self


class ServiceOrderResponse(ServiceOrderBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    client_id: UUID
    status: OrderStatus
    scheduled_at: datetime | None = None
    provider_finished_at: datetime | None = None
    estimated_price: Decimal | None = None
    final_price: Decimal | None = None
    cancellation_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class ServiceOrderListResponse(BaseModel):
    orders: list[ServiceOrderResponse]
