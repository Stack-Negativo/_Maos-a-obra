from typing import Any
from uuid import UUID

from sqlalchemy import JSON, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from domain.base import BaseEntity


class IdempotencyKey(BaseEntity, Base):
    __tablename__ = "idempotency_keys"

    key: Mapped[str] = mapped_column(
        String(255), nullable=False, unique=True, index=True
    )
    response_body: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status_code: Mapped[int | None] = mapped_column(nullable=True)
    actor_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
