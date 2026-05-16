from typing import TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class APIResponse[T](BaseModel):
    success: bool = True
    data: T


class APIError(BaseModel):
    code: str
    message: str


class APIErrorResponse(BaseModel):
    success: bool = False
    error: APIError
