"""Project request and response DTOs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator


def _validate_endpoint_url(value: Optional[str]) -> Optional[str]:
    if value and not value.startswith(("http://", "https://", "ws://", "wss://")):
        raise ValueError("Endpoint URL must start with http://, https://, ws://, or wss://")
    return value


class ProjectCreate(BaseModel):
    endpoint_url: str
    name: Optional[str] = None
    requires_token: bool = False
    token: Optional[str] = None
    request_field_name: str = "message"
    response_field_name: str = "answer"

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: str) -> str:
        return _validate_endpoint_url(value)  # type: ignore[return-value]


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    requires_token: Optional[bool] = None
    request_field_name: Optional[str] = None
    response_field_name: Optional[str] = None

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_endpoint_url(value)


class ProjectTokenUpdate(BaseModel):
    token: str


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    endpoint_url: str
    requires_token: bool
    request_field_name: str
    response_field_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
