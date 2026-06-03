import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import Connection, engine_from_config, pool
from sqlalchemy.ext.asyncio import AsyncEngine

# set the path to the root of the project
sys.path.append(os.getcwd())  # This should now add /app/backend

from core.config import get_settings
from core.database import Base
from models.address import Address as Address  # noqa: F401
from models.idempotency_key import IdempotencyKey as IdempotencyKey  # noqa: F401
from models.payment import Payment as Payment  # noqa: F401
from models.payment_transaction import (
    PaymentTransaction as PaymentTransaction,  # noqa: F401
)
from models.provider import Provider as Provider  # noqa: F401
from models.review import Review as Review  # noqa: F401
from models.scheduling import ProviderBusySlot as ProviderBusySlot  # noqa: F401
from models.service_order import ServiceOrder as ServiceOrder  # noqa: F401
from models.service_order_application import (
    ServiceOrderApplication as ServiceOrderApplication,
)  # noqa: F401
from models.service_order_history import (
    ServiceOrderHistory as ServiceOrderHistory,
)  # noqa: F401
from models.specialty import Specialty as Specialty  # noqa: F401

# Import all models here for autogenerate support
from models.user import User as User  # noqa: F401

# this is the Alembic Config object, which provides
# access to values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    settings = get_settings()
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = config.attributes.get("connection", None)
    if connectable is None:
        settings = get_settings()
        connectable = AsyncEngine(
            engine_from_config(
                config.get_section(config.config_ini_section, {}),
                prefix="sqlalchemy.",
                poolclass=pool.NullPool,
                url=settings.DATABASE_URL,
            )
        )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
