from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class AddressBase(BaseModel):
    label: str | None = None
    zip_code: str
    street: str
    number: str
    complement: str | None = None
    neighborhood: str
    city: str
    state: str
    latitude: float | None = None
    longitude: float | None = None
    is_default: bool = False


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    label: str | None = None
    zip_code: str | None = None
    street: str | None = None
    number: str | None = None
    complement: str | None = None
    neighborhood: str | None = None
    city: str | None = None
    state: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_default: bool | None = None


class AddressResponse(AddressBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
