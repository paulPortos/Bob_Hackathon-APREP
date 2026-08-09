"""Project request and response DTOs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.core.endpoint_security import UnsafeAgentEndpoint, validate_agent_endpoint_url


def _validate_endpoint_url(value: Optional[str]) -> Optional[str]:
    if value:
        try:
            return validate_agent_endpoint_url(value)
        except UnsafeAgentEndpoint as error:
            raise ValueError(str(error)) from error
    return value


class ProjectCreate(BaseModel):
    endpoint_url: str = Field(..., min_length=8, max_length=2_048)
    name: Optional[str] = Field(default=None, max_length=120)
    requires_token: bool = False
    token: Optional[str] = Field(default=None, max_length=4_096)
    request_field_name: str = Field(default="message", pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")
    response_field_name: str = Field(default="answer", pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: str) -> str:
        return _validate_endpoint_url(value)  # type: ignore[return-value]


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    endpoint_url: Optional[str] = Field(default=None, min_length=8, max_length=2_048)
    requires_token: Optional[bool] = None
    request_field_name: Optional[str] = Field(
        default=None, pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,63}$"
    )
    response_field_name: Optional[str] = Field(
        default=None, pattern=r"^[A-Za-z_][A-Za-z0-9_]{0,63}$"
    )

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_endpoint_url(value)


class ProjectTokenUpdate(BaseModel):
    token: str = Field(..., min_length=1, max_length=4_096)


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
