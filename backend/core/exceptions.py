from datetime import UTC, datetime
from typing import Any


class BaseAppException(Exception):
    """Base exception for the application."""

    def __init__(
        self,
        message: str,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: Any = None,
    ):
        self.message = message
        self.error_code = error_code
        self.details = details
        self.timestamp = datetime.now(UTC)
        super().__init__(self.message)


class DomainException(BaseAppException):
    """Exception raised for domain-related errors."""

    def __init__(
        self, message: str, error_code: str = "DOMAIN_ERROR", details: Any = None
    ):
        super().__init__(message, error_code, details)


class ValidationException(BaseAppException):
    """Exception raised for validation errors."""

    def __init__(
        self, message: str, error_code: str = "VALIDATION_ERROR", details: Any = None
    ):
        super().__init__(message, error_code, details)


class NotFoundException(BaseAppException):
    """Exception raised when a resource is not found."""

    def __init__(
        self, message: str, error_code: str = "NOT_FOUND", details: Any = None
    ):
        super().__init__(message, error_code, details)


class ConflictException(BaseAppException):
    """Exception raised for operational conflicts."""

    def __init__(self, message: str, error_code: str = "CONFLICT", details: Any = None):
        super().__init__(message, error_code, details)


class AuthenticationException(BaseAppException):
    """Exception raised for authentication failures."""

    def __init__(
        self, message: str, error_code: str = "UNAUTHENTICATED", details: Any = None
    ):
        super().__init__(message, error_code, details)


class AuthorizationException(BaseAppException):
    """Exception raised for authorization failures."""

    def __init__(
        self, message: str, error_code: str = "UNAUTHORIZED", details: Any = None
    ):
        super().__init__(message, error_code, details)


class BusinessRuleViolation(BaseAppException):
    """Exception raised for explicit business rule violations."""

    def __init__(
        self,
        message: str,
        error_code: str = "BUSINESS_RULE_VIOLATION",
        details: Any = None,
    ):
        super().__init__(message, error_code, details)


class InfrastructureException(BaseAppException):
    """Exception raised for technical/infrastructure failures."""

    def __init__(
        self,
        message: str,
        error_code: str = "INFRASTRUCTURE_ERROR",
        details: Any = None,
    ):
        super().__init__(message, error_code, details)
