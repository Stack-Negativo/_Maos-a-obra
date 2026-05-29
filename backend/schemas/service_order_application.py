from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from schemas.provider import ProviderResponse
from domain.enums import ApplicationStatus


class ApplicationBase(BaseModel):
    service_order_id: UUID


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(ApplicationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    provider_id: UUID
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    provider: ProviderResponse


class ApplicationListResponse(BaseModel):
    applications: list[ApplicationResponse]
