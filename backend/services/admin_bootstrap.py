from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import Settings
from core.security import get_password_hash
from models.provider import Admin
from models.user import User


async def ensure_admin_user(session: AsyncSession, settings: Settings) -> None:
    result = await session.execute(
        select(User).where(User.email == settings.ADMIN_EMAIL),
    )
    user = result.scalars().first()

    if user is None:
        user = User(
            email=settings.ADMIN_EMAIL,
            hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_FULL_NAME,
            phone=settings.ADMIN_PHONE,
            is_active=True,
            is_email_verified=True,
        )
        session.add(user)
        await session.flush()
    else:
        user.hashed_password = get_password_hash(settings.ADMIN_PASSWORD)
        user.full_name = settings.ADMIN_FULL_NAME
        user.phone = settings.ADMIN_PHONE
        user.is_active = True
        user.is_email_verified = True

    admin_result = await session.execute(
        select(Admin).where(Admin.user_id == user.id),
    )
    admin = admin_result.scalars().first()

    if admin is None:
        session.add(Admin(user_id=user.id, access_level=10))

    await session.commit()
