from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import uuid4

from domain.enums import OrderStatus
from domain.value_objects.date_range import DateRange
from models.service_order import ServiceOrder
from models.user import (
    User as _User,  # noqa: F401 # pyright: ignore[reportUnusedImport]
)


def test_service_order_date_range_integration():
    start = datetime.now(UTC) + timedelta(days=1)
    end = start + timedelta(hours=2)
    dr = DateRange(start_at=start, end_at=end)

    order = ServiceOrder(
        client_id=uuid4(),
        address_id=uuid4(),
        specialty_id=uuid4(),
        title="Test Order",
        description="Testing VO integration",
        preferred_date_start=start,
        preferred_date_end=end,
        status=OrderStatus.CREATED,
    )

    assert order.preferred_range == dr

    new_start = start + timedelta(days=1)
    new_end = new_start + timedelta(hours=1)
    new_dr = DateRange(start_at=new_start, end_at=new_end)

    order.preferred_range = new_dr
    assert order.preferred_date_start == new_start
    assert order.preferred_date_end == new_end
    assert order.preferred_range == new_dr


def test_service_order_money_integration():
    from domain.value_objects.money import Money

    order = ServiceOrder(
        client_id=uuid4(),
        address_id=uuid4(),
        specialty_id=uuid4(),
        title="Test Order",
        description="Testing Money integration",
        preferred_date_start=datetime.now(UTC),
        preferred_date_end=datetime.now(UTC) + timedelta(hours=1),
        status=OrderStatus.CREATED,
        estimated_price=Decimal("150.50"),
    )

    expected_money = Money.from_str("150.50")
    assert order.estimated_money == expected_money

    new_money = Money.from_str("200.00")
    order.estimated_money = new_money
    assert order.estimated_price == Decimal("200.00")
    assert order.estimated_money == new_money
