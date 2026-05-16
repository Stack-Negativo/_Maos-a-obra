from datetime import UTC, datetime
from uuid import uuid4

import pytest

from core.exceptions import BusinessRuleViolation
from domain.value_objects.audit_metadata import AuditMetadata


def test_audit_valid():
    actor_id = uuid4()
    now = datetime.now(UTC)
    audit = AuditMetadata(actor_id=actor_id, timestamp=now, source="api")
    assert audit.actor_id == actor_id
    assert audit.timestamp == now
    assert audit.source == "api"
    assert audit.correlation_id is None


def test_audit_invalid_timestamp():
    with pytest.raises(
        BusinessRuleViolation, match="Audit timestamp deve ser UTC-aware"
    ):
        AuditMetadata(actor_id=uuid4(), timestamp=datetime.now(), source="api")


def test_audit_equality():
    actor_id = uuid4()
    now = datetime(2026, 1, 1, tzinfo=UTC)
    a1 = AuditMetadata(actor_id, now, "api")
    a2 = AuditMetadata(actor_id, now, "api")
    assert a1 == a2
