from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    email: str
    nome: str | None = None
    phone: str | None = None


class UserCreate(UserBase):
    senha: str


class UserUpdate(UserBase):
    email: str | None = None
    hashed_password: str | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
