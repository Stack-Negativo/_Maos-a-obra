from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal
from typing import Self


@dataclass(frozen=True)
class Money:
    """
    Value Object representing monetary values.
    Uses Decimal for precision and ensures immutability.
    """

    amount: Decimal

    def __post_init__(self) -> None:
        # Normalize to 2 decimal places
        normalized = self.amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        object.__setattr__(self, "amount", normalized)

    @classmethod
    def from_str(cls, value: str) -> Self:
        return cls(Decimal(value))

    @classmethod
    def zero(cls) -> Self:
        return cls(Decimal("0.00"))

    def to_decimal(self) -> Decimal:
        return self.amount

    def __add__(self, other: Self) -> Self:
        return self.__class__(self.amount + other.amount)

    def __sub__(self, other: Self) -> Self:
        return self.__class__(self.amount - other.amount)

    def __mul__(self, factor: int | Decimal) -> Self:
        return self.__class__(self.amount * Decimal(str(factor)))

    def __lt__(self, other: Self) -> bool:
        return self.amount < other.amount

    def __le__(self, other: Self) -> bool:
        return self.amount <= other.amount

    def __gt__(self, other: Self) -> bool:
        return self.amount > other.amount

    def __ge__(self, other: Self) -> bool:
        return self.amount >= other.amount
