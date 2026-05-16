from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID

from core.exceptions import BusinessRuleViolation


@dataclass(frozen=True)
class AuditMetadata:
    """
    Value Object representing audit metadata for events and entities.
    """

    actor_id: UUID
    timestamp: datetime
    source: str
    correlation_id: UUID | None = None

    def __post_init__(self) -> None:
        if self.timestamp.tzinfo is None or self.timestamp.tzinfo != UTC:
            raise BusinessRuleViolation("Audit timestamp deve ser UTC-aware")
