from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    full_name: str | None = None
    phone: str | None = None


class UserCreate(UserBase):
    email: EmailStr
    password: str


class UserUpdate(UserBase):
    email: EmailStr | None = None
    hashed_password: str | None = None
    is_active: bool | None = None


class UserResponse(UserBase):
    id: UUID
    email: EmailStr
    is_active: bool
    is_provider: bool = False
    is_admin: bool = False
    role: str = "CLIENT"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
