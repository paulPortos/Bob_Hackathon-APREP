"""Ollama API DTOs."""

from typing import Optional

from pydantic import BaseModel, Field


class OllamaModel(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None


class OllamaModelsResponse(BaseModel):
    models: list[OllamaModel]


class OllamaTestRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4_000)
    model: Optional[str] = Field(default=None, max_length=120)


class OllamaTestResponse(BaseModel):
    response: str
    model: str
