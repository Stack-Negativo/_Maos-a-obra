from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, model_validator

from core.exceptions import ValidationException
from domain.value_objects.date_range import DateRange
from models.scheduling import BusySlotSource, BusySlotStatus


class BusySlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider_id: UUID
    service_order_id: UUID | None = None
    start_at: datetime
    end_at: datetime
    source: BusySlotSource
    status: BusySlotStatus
    description: str | None = None


class ScheduleOrderInput(BaseModel):
    start_at: datetime
    end_at: datetime

    @model_validator(mode="after")
    def validate_dates(self) -> "ScheduleOrderInput":
        try:
            DateRange(start_at=self.start_at, end_at=self.end_at)
        except Exception as e:
            raise ValidationException(str(e)) from e
        return self


class ProviderScheduleResponse(BaseModel):
    provider_id: UUID
    busy_slots: list[BusySlotResponse]
