"""Authentication request and response DTOs."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


def _validate_password_bytes(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password must not exceed bcrypt's 72-byte limit")
    return value


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=12, max_length=72)

    _password_bytes = field_validator("password")(_validate_password_bytes)


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)

    _password_bytes = field_validator("password")(_validate_password_bytes)


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
