from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from schemas.specialty import SpecialtyResponse


class ProviderBase(BaseModel):
    bio: str | None = Field(None, description="Provider's professional bio")


class ProviderCreate(ProviderBase):
    specialty_ids: list[UUID] = Field(
        ..., min_length=1, description="List of specialty IDs to link"
    )


class ProviderUpdate(BaseModel):
    bio: str | None = None
    is_suspended: bool | None = None
    specialty_ids: list[UUID] | None = None


class ProviderSpecialtyResponse(BaseModel):
    specialty: SpecialtyResponse
    linked_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProviderResponse(ProviderBase):
    id: UUID
    user_id: UUID
    rating_average: float
    total_reviews: int
    is_suspended: bool
    suspended_at: datetime | None
    created_at: datetime
    updated_at: datetime
    specialties: list[ProviderSpecialtyResponse]

    model_config = ConfigDict(from_attributes=True)


class AdminResponse(BaseModel):
    id: UUID
    user_id: UUID
    access_level: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
