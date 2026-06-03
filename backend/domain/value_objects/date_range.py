from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Self

from core.exceptions import BusinessRuleViolation


@dataclass(frozen=True)
class DateRange:
    """
    Value Object representing a time interval.
    Enforces UTC-aware datetimes and start < end.
    """

    start_at: datetime
    end_at: datetime

    def __post_init__(self) -> None:
        # Enforce timezone-aware UTC
        if self.start_at.tzinfo is None or self.start_at.tzinfo != UTC:
            raise BusinessRuleViolation("start_at deve ser UTC-aware")

        if self.end_at.tzinfo is None or self.end_at.tzinfo != UTC:
            raise BusinessRuleViolation("end_at deve ser UTC-aware")

        if self.start_at >= self.end_at:
            raise BusinessRuleViolation("start_at deve ser anterior a end_at")

    def duration(self) -> timedelta:
        return self.end_at - self.start_at

    def contains(self, dt: datetime) -> bool:
        """Checks if a datetime is within the range [start, end)."""
        if dt.tzinfo is None or dt.tzinfo != UTC:
            raise BusinessRuleViolation("Datetime para comparação deve ser UTC-aware")
        return self.start_at <= dt < self.end_at

    def overlaps(self, other: Self) -> bool:
        """Checks if this range overlaps with another range."""
        return self.start_at < other.end_at and other.start_at < self.end_at

    def intersects(self, other: Self) -> Self | None:
        """Returns the intersection of two ranges or None."""
        if not self.overlaps(other):
            return None

        start = max(self.start_at, other.start_at)
        end = min(self.end_at, other.end_at)
        return self.__class__(start_at=start, end_at=end)
