from typing import Any

from core.exceptions import (
    BusinessRuleViolation,
    InvalidStatusTransitionException,
)
from domain.enums import OrderStatus


class OrderStateMachine:
    """
    Centralizes and validates all status transitions for the Service Order domain.
    Decoupled from FastAPI, DB, and Repositories.
    """

    # Terminal states: Once an order reaches these states, it cannot transition further.
    TERMINAL_STATES: set[OrderStatus] = {
        OrderStatus.FINISHED,
        OrderStatus.CANCELLED,
        OrderStatus.EXPIRED,
    }

    # Map of allowed transitions: current_status -> {next_status1, next_status2, ...}
    # Note: Transition to CANCELLED is handled globally for all non-terminal states.
    _TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
        OrderStatus.CREATED: {OrderStatus.AWAITING_CANDIDATES, OrderStatus.EXPIRED},
        OrderStatus.AWAITING_CANDIDATES: {
            OrderStatus.AWAITING_SELECTION,
            OrderStatus.EXPIRED,
        },
        OrderStatus.AWAITING_SELECTION: {
            OrderStatus.AWAITING_CANDIDATES,
            OrderStatus.PROVIDER_SELECTED,
            OrderStatus.EXPIRED,
        },
        OrderStatus.PROVIDER_SELECTED: {OrderStatus.SCHEDULED},
        OrderStatus.SCHEDULED: {OrderStatus.IN_PROGRESS},
        OrderStatus.IN_PROGRESS: {OrderStatus.FINISHED},
    }

    @classmethod
    def can_transition(cls, current: OrderStatus, next_status: OrderStatus) -> bool:
        """
        Checks if a transition from current to next_status is allowed.

        - Terminal states cannot transition.
        - Any non-terminal state can transition to CANCELLED.
        - Other transitions must be explicitly defined in _TRANSITIONS.
        """
        if current in cls.TERMINAL_STATES:
            return False

        if next_status == OrderStatus.CANCELLED:
            return True

        allowed = cls._TRANSITIONS.get(current, set())
        return next_status in allowed

    @classmethod
    def validate_transition(
        cls,
        current: OrderStatus,
        next_status: OrderStatus,
        **kwargs: Any,
    ) -> None:
        """
        Validates a transition and checks for specific guards.

        Args:
            current: The current status of the Order.
            next_status: The target status for the transition.
            **kwargs: Additional data for guards (e.g., operational_confirmation).

        Raises:
            InvalidStatusTransitionException: If the transition is invalid.
            BusinessRuleViolation: If a guard condition is not met.
        """
        if not cls.can_transition(current, next_status):
            raise InvalidStatusTransitionException(
                current_status=str(current), next_status=str(next_status)
            )

        # Guard: FINISHED requires operational confirmation
        if next_status == OrderStatus.FINISHED and not kwargs.get(
            "operational_confirmation", False
        ):
            raise BusinessRuleViolation(
                message="Finalização exige confirmação operacional completa.",
                error_code="MISSING_OPERATIONAL_CONFIRMATION",
            )

        # Guard: IN_PROGRESS only after SCHEDULED (already in _TRANSITIONS)
        if next_status == OrderStatus.IN_PROGRESS and current != OrderStatus.SCHEDULED:
            raise InvalidStatusTransitionException(
                current_status=str(current),
                next_status=str(next_status),
                message="IN_PROGRESS só pode ocorrer após SCHEDULED",
            )

    @classmethod
    def get_next_status(cls, current: OrderStatus) -> OrderStatus | None:
        """
        Determines if there is an automatic next status for the given status.

        Rule: CREATED must go automatically to AWAITING_CANDIDATES.
        """
        if current == OrderStatus.CREATED:
            return OrderStatus.AWAITING_CANDIDATES
        return None
