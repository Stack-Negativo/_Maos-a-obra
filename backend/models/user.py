from core.database import Base
from domain.base import BaseEntity
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column


class User(BaseEntity, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
