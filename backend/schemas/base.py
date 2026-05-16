from datetime import datetime
from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse[T](BaseModel):
    success: bool = True
    data: T


class APIErrorResponse(BaseModel):
    detail: str
    error_code: str
    timestamp: datetime
