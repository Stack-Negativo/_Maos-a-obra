from collections.abc import AsyncGenerator
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from core.config import get_settings
from domain.enums import OrderStatus
from models.address import Address as Address  # noqa: F401
from models.idempotency_key import IdempotencyKey as IdempotencyKey  # noqa: F401
from models.payment import Payment as Payment  # noqa: F401
from models.payment_transaction import (
    PaymentTransaction as PaymentTransaction,  # noqa: F401
)
from models.provider import Provider as Provider  # noqa: F401
from models.scheduling import ProviderBusySlot as ProviderBusySlot  # noqa: F401
from models.service_order import ServiceOrder as ServiceOrder  # noqa: F401
from models.service_order_application import (
    ServiceOrderApplication as ServiceOrderApplication,
)  # noqa: F401
from models.specialty import Specialty as Specialty  # noqa: F401

# Import all models to ensure registry is complete
from models.user import User as User  # noqa: F401

settings = get_settings()


def get_test_url():
    url = settings.DATABASE_URL
    if "@db:5432" in url:
        return url.replace("@db:5432", "@localhost:5432")
    return url


@pytest_asyncio.fixture
async def engine():
    _engine = create_async_engine(get_test_url(), echo=False)
    yield _engine
    await _engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    session_maker = async_sessionmaker(
        engine, expire_on_commit=False, class_=AsyncSession
    )
    async with session_maker() as session:
        yield session
        if session.is_active:
            await session.rollback()


@pytest_asyncio.fixture
async def create_user(db_session: AsyncSession):
    async def _create(email: str | None = None):
        user = User(
            id=uuid4(),
            full_name="Test User",
            email=email or f"test_{uuid4()}@example.com",
            hashed_password="hashed_password",
            phone="123456789",
            is_active=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)
        return user

    return _create


@pytest_asyncio.fixture
async def create_specialty(db_session: AsyncSession):
    async def _create():
        specialty = Specialty(
            id=uuid4(),
            name=f"Specialty_{uuid4()}",
            description="Test Specialty",
            is_active=True,
        )
        db_session.add(specialty)
        await db_session.commit()
        await db_session.refresh(specialty)
        return specialty

    return _create


@pytest_asyncio.fixture
async def create_address(db_session: AsyncSession):
    async def _create(user_id: UUID):
        addr = Address(
            id=uuid4(),
            user_id=user_id,
            zip_code="12345-678",
            street="Test Street",
            number="123",
            neighborhood="Test Neighborhood",
            city="Test City",
            state="TS",
            is_default=True,
        )
        db_session.add(addr)
        await db_session.commit()
        await db_session.refresh(addr)
        return addr

    return _create


@pytest_asyncio.fixture
async def create_service_order(db_session: AsyncSession):
    async def _create(client_id: UUID, specialty_id: UUID, address_id: UUID):
        so = ServiceOrder(
            id=uuid4(),
            client_id=client_id,
            specialty_id=specialty_id,
            address_id=address_id,
            title="Test SO",
            description="Test Description",
            preferred_date_start=datetime.now(UTC) + timedelta(days=1),
            preferred_date_end=datetime.now(UTC) + timedelta(days=1, hours=2),
            status=OrderStatus.AWAITING_SELECTION,
            estimated_price=100.00,
        )
        db_session.add(so)
        await db_session.commit()
        await db_session.refresh(so)
        return so

    return _create
