"""Prompt request and response DTOs."""

from datetime import datetime

from pydantic import BaseModel, Field


class PromptCreate(BaseModel):
    content: str
    file_type: str = Field(..., pattern="^(md|txt)$")


class PromptResponse(BaseModel):
    id: str
    project_id: str
    content: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True
