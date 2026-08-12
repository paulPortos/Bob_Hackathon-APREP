"""Project request and response DTOs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.core.agent_payload import (
    DEFAULT_REQUEST_BODY_TEMPLATE,
    DEFAULT_RESPONSE_PATH,
    expand_legacy_request_template,
    validate_request_body_template,
    validate_response_path,
)
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
    request_body_template: str = Field(default=DEFAULT_REQUEST_BODY_TEMPLATE, max_length=10_000)
    response_path: str = Field(default=DEFAULT_RESPONSE_PATH, min_length=1, max_length=512)

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: str) -> str:
        return _validate_endpoint_url(value)  # type: ignore[return-value]

    @field_validator("request_body_template")
    @classmethod
    def validate_request_template(cls, value: str) -> str:
        return validate_request_body_template(value)

    @field_validator("response_path")
    @classmethod
    def validate_answer_path(cls, value: str) -> str:
        return validate_response_path(value)


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=120)
    endpoint_url: Optional[str] = Field(default=None, min_length=8, max_length=2_048)
    requires_token: Optional[bool] = None
    request_body_template: Optional[str] = Field(default=None, max_length=10_000)
    response_path: Optional[str] = Field(default=None, min_length=1, max_length=512)

    @field_validator("endpoint_url")
    @classmethod
    def validate_endpoint_url(cls, value: Optional[str]) -> Optional[str]:
        return _validate_endpoint_url(value)

    @field_validator("request_body_template")
    @classmethod
    def validate_request_template(cls, value: Optional[str]) -> Optional[str]:
        return validate_request_body_template(value) if value is not None else None

    @field_validator("response_path")
    @classmethod
    def validate_answer_path(cls, value: Optional[str]) -> Optional[str]:
        return validate_response_path(value) if value is not None else None


class ProjectTokenUpdate(BaseModel):
    token: str = Field(..., min_length=1, max_length=4_096)


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    endpoint_url: str
    requires_token: bool
    request_body_template: str
    response_path: str
    created_at: datetime
    updated_at: datetime

    @field_validator("request_body_template", mode="before")
    @classmethod
    def expand_legacy_template(cls, value: str) -> str:
        return expand_legacy_request_template(value)

    class Config:
        from_attributes = True
