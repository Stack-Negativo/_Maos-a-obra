from datetime import UTC, datetime, timedelta

import pytest

from core.exceptions import BusinessRuleViolation
from domain.value_objects.date_range import DateRange


def test_daterange_valid():
    start = datetime.now(UTC)
    end = start + timedelta(hours=2)
    dr = DateRange(start_at=start, end_at=end)
    assert dr.duration() == timedelta(hours=2)


def test_daterange_invalid_order():
    start = datetime.now(UTC)
    end = start - timedelta(hours=1)
    with pytest.raises(
        BusinessRuleViolation, match="start_at deve ser anterior a end_at"
    ):
        DateRange(start_at=start, end_at=end)


def test_daterange_naive_datetime():
    start = datetime.now()  # Naive
    end = start + timedelta(hours=1)
    with pytest.raises(BusinessRuleViolation, match="start_at deve ser UTC-aware"):
        DateRange(start_at=start, end_at=end)


def test_daterange_contains():
    start = datetime(2026, 1, 1, 10, 0, tzinfo=UTC)
    end = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    dr = DateRange(start_at=start, end_at=end)

    assert dr.contains(datetime(2026, 1, 1, 11, 0, tzinfo=UTC)) is True
    assert dr.contains(datetime(2026, 1, 1, 9, 0, tzinfo=UTC)) is False
    assert (
        dr.contains(datetime(2026, 1, 1, 12, 0, tzinfo=UTC)) is False
    )  # Upper bound is exclusive


def test_daterange_overlaps():
    dr1 = DateRange(
        start_at=datetime(2026, 1, 1, 10, 0, tzinfo=UTC),
        end_at=datetime(2026, 1, 1, 12, 0, tzinfo=UTC),
    )
    dr2 = DateRange(
        start_at=datetime(2026, 1, 1, 11, 0, tzinfo=UTC),
        end_at=datetime(2026, 1, 1, 13, 0, tzinfo=UTC),
    )
    dr3 = DateRange(
        start_at=datetime(2026, 1, 1, 13, 0, tzinfo=UTC),
        end_at=datetime(2026, 1, 1, 14, 0, tzinfo=UTC),
    )

    assert dr1.overlaps(dr2) is True
    assert dr1.overlaps(dr3) is False


def test_daterange_intersects():
    dr1 = DateRange(
        start_at=datetime(2026, 1, 1, 10, 0, tzinfo=UTC),
        end_at=datetime(2026, 1, 1, 12, 0, tzinfo=UTC),
    )
    dr2 = DateRange(
        start_at=datetime(2026, 1, 1, 11, 0, tzinfo=UTC),
        end_at=datetime(2026, 1, 1, 13, 0, tzinfo=UTC),
    )

    intersection = dr1.intersects(dr2)
    assert intersection is not None
    assert intersection.start_at == datetime(2026, 1, 1, 11, 0, tzinfo=UTC)
    assert intersection.end_at == datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
