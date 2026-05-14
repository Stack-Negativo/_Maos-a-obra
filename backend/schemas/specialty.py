from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SpecialtyBase(BaseModel):
    name: str
    description: str | None = None
    is_active: bool = True


class SpecialtyCreate(SpecialtyBase):
    pass


class SpecialtyUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None


class SpecialtyResponse(SpecialtyBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
