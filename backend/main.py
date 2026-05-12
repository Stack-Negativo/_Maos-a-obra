from contextlib import asynccontextmanager

from fastapi import FastAPI

from api import auth, health, users
from core.config import get_settings
from core.database import check_db_connection
from core.logging_config import setup_logging

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
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

# Include API routers
app.include_router(health.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
