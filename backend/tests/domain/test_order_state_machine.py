import pytest

from core.exceptions import (
    BusinessRuleViolation,
    InvalidStatusTransitionException,
)
from domain.enums import OrderStatus
from domain.order_state_machine import OrderStateMachine


class TestOrderStateMachine:
    def test_terminal_states_cannot_transition(self):
        terminal_states = [
            OrderStatus.FINISHED,
            OrderStatus.CANCELLED,
            OrderStatus.EXPIRED,
        ]
        for state in terminal_states:
            assert OrderStateMachine.can_transition(state, OrderStatus.CREATED) is False
            with pytest.raises(InvalidStatusTransitionException):
                OrderStateMachine.validate_transition(state, OrderStatus.CREATED)

    def test_any_non_terminal_can_transition_to_cancelled(self):
        non_terminal_states = [
            OrderStatus.CREATED,
            OrderStatus.AWAITING_CANDIDATES,
            OrderStatus.AWAITING_SELECTION,
            OrderStatus.PROVIDER_SELECTED,
            OrderStatus.SCHEDULED,
            OrderStatus.IN_PROGRESS,
        ]
        for state in non_terminal_states:
            assert (
                OrderStateMachine.can_transition(state, OrderStatus.CANCELLED) is True
            )
            # No exception should be raised
            OrderStateMachine.validate_transition(state, OrderStatus.CANCELLED)

    def test_created_automatic_transition(self):
        assert (
            OrderStateMachine.get_next_status(OrderStatus.CREATED)
            == OrderStatus.AWAITING_CANDIDATES
        )
        assert (
            OrderStateMachine.get_next_status(OrderStatus.AWAITING_CANDIDATES) is None
        )

    def test_valid_main_flow_transitions(self):
        flow = [
            (OrderStatus.CREATED, OrderStatus.AWAITING_CANDIDATES),
            (OrderStatus.AWAITING_CANDIDATES, OrderStatus.AWAITING_SELECTION),
            (OrderStatus.AWAITING_SELECTION, OrderStatus.PROVIDER_SELECTED),
            (OrderStatus.PROVIDER_SELECTED, OrderStatus.SCHEDULED),
            (OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS),
        ]
        for current, next_status in flow:
            assert OrderStateMachine.can_transition(current, next_status) is True
            OrderStateMachine.validate_transition(current, next_status)

    def test_finished_requires_operational_confirmation(self):
        current = OrderStatus.IN_PROGRESS
        next_status = OrderStatus.FINISHED

        assert OrderStateMachine.can_transition(current, next_status) is True

        # Should fail without confirmation
        with pytest.raises(BusinessRuleViolation) as excinfo:
            OrderStateMachine.validate_transition(current, next_status)
        assert excinfo.value.error_code == "MISSING_OPERATIONAL_CONFIRMATION"

        # Should succeed with confirmation
        OrderStateMachine.validate_transition(
            current, next_status, operational_confirmation=True
        )

    def test_in_progress_only_after_scheduled(self):
        # Valid
        OrderStateMachine.validate_transition(
            OrderStatus.SCHEDULED, OrderStatus.IN_PROGRESS
        )

        # Invalid
        invalid_origins = [
            OrderStatus.CREATED,
            OrderStatus.AWAITING_CANDIDATES,
            OrderStatus.AWAITING_SELECTION,
            OrderStatus.PROVIDER_SELECTED,
        ]
        for origin in invalid_origins:
            assert (
                OrderStateMachine.can_transition(origin, OrderStatus.IN_PROGRESS)
                is False
            )
            with pytest.raises(InvalidStatusTransitionException):
                OrderStateMachine.validate_transition(origin, OrderStatus.IN_PROGRESS)

    def test_invalid_transitions(self):
        invalid_pairs = [
            (OrderStatus.CREATED, OrderStatus.FINISHED),
            (OrderStatus.AWAITING_CANDIDATES, OrderStatus.IN_PROGRESS),
            (OrderStatus.SCHEDULED, OrderStatus.AWAITING_CANDIDATES),
        ]
        for current, next_status in invalid_pairs:
            assert OrderStateMachine.can_transition(current, next_status) is False
            with pytest.raises(InvalidStatusTransitionException):
                OrderStateMachine.validate_transition(current, next_status)

    def test_expired_transition(self):
        assert (
            OrderStateMachine.can_transition(
                OrderStatus.AWAITING_CANDIDATES, OrderStatus.EXPIRED
            )
            is True
        )
        OrderStateMachine.validate_transition(
            OrderStatus.AWAITING_CANDIDATES, OrderStatus.EXPIRED
        )

        assert (
            OrderStateMachine.can_transition(OrderStatus.EXPIRED, OrderStatus.CANCELLED)
            is False
        )
