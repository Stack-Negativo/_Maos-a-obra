from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from domain.enums import ReviewDirection


class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = Field(None, max_length=1000)
    direction: ReviewDirection


class ReviewCreate(ReviewBase):
    pass


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    service_order_id: UUID
    reviewer_id: UUID
    reviewed_id: UUID
    created_at: datetime


class ReviewListResponse(BaseModel):
    reviews: list[ReviewResponse]
