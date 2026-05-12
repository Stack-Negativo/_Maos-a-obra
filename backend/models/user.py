from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from core.database import Base
from domain.base import BaseEntity


class User(BaseEntity, Base):
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    nome: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
