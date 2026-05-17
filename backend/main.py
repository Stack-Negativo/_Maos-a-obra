from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from api import addresses, health, providers, service_orders, specialties, users
from core.config import get_settings
from core.database import check_db_connection
from core.exceptions import (
    AuthenticationException,
    AuthorizationException,
    BaseAppException,
    BusinessRuleViolation,
    ConflictException,
    InfrastructureException,
    NotFoundException,
    ValidationException,
)
from core.logging_config import setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Setup logging
    setup_logging()
    print("Logging configured.")

    # Validate database connection on startup
    if not await check_db_connection():
        raise RuntimeError("Database connection failed on startup!")
    print("Database connection successfully validated.")

    yield
    # Clean up or shut down resources here if needed
    print("Application shutdown.")


app = FastAPI(
    title="Maos a Obra API",
    version="0.1.0",
    description=(
        "API for intermediating residential services between clients and providers."
    ),
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)


# Global Exception Handlers
@app.exception_handler(BaseAppException)
async def app_exception_handler(_request: Request, exc: BaseAppException):
    status_code = 500
    if isinstance(exc, ValidationException):
        status_code = 400
    elif isinstance(exc, AuthenticationException):
        status_code = 401
    elif isinstance(exc, AuthorizationException):
        status_code = 403
    elif isinstance(exc, NotFoundException):
        status_code = 404
    elif isinstance(exc, ConflictException):
        status_code = 409
    elif isinstance(exc, BusinessRuleViolation):
        status_code = 422
    elif isinstance(exc, InfrastructureException):
        status_code = 500

    return JSONResponse(
        status_code=status_code,
        content={
            "detail": exc.message,
            "error_code": exc.error_code,
            "timestamp": exc.timestamp.isoformat(),
        },
    )


# Include API routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
app.include_router(service_orders.router, prefix="/api/v1")
app.include_router(specialties.router, prefix="/api/v1")

app.include_router(addresses.router, prefix="/api/v1")
app.include_router(providers.router, prefix="/api/v1")
