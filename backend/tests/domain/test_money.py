from decimal import Decimal

import pytest

from domain.value_objects.money import Money


def test_money_creation_and_normalization():
    m = Money(Decimal("100.555"))
    assert m.amount == Decimal("100.56")  # ROUND_HALF_UP


def test_money_from_str():
    m = Money.from_str("50.00")
    assert m.amount == Decimal("50.00")


def test_money_zero():
    m = Money.zero()
    assert m.amount == Decimal("0.00")


def test_money_addition():
    m1 = Money(Decimal("10.00"))
    m2 = Money(Decimal("20.50"))
    result = m1 + m2
    assert result.amount == Decimal("30.50")


def test_money_subtraction():
    m1 = Money(Decimal("50.00"))
    m2 = Money(Decimal("20.00"))
    result = m1 - m2
    assert result.amount == Decimal("30.00")


def test_money_multiplication():
    m = Money(Decimal("10.00"))
    result = m * 3
    assert result.amount == Decimal("30.00")

    result2 = m * Decimal("2.5")
    assert result2.amount == Decimal("25.00")


def test_money_comparison():
    m1 = Money(Decimal("10.00"))
    m2 = Money(Decimal("20.00"))
    assert m1 < m2
    assert m2 > m1
    assert m1 <= m1
    assert m2 >= m1


def test_money_immutability():
    m = Money(Decimal("10.00"))
    attr_name = "amount"
    with pytest.raises(AttributeError):
        setattr(m, attr_name, Decimal("20.00"))


def test_money_equality():
    m1 = Money(Decimal("10.00"))
    m2 = Money(Decimal("10.000"))
    assert m1 == m2
