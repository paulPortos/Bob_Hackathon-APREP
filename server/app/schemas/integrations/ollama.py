"""Ollama API DTOs."""

from typing import Optional

from pydantic import BaseModel


class OllamaModel(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None


class OllamaModelsResponse(BaseModel):
    models: list[OllamaModel]


class OllamaTestRequest(BaseModel):
    prompt: str
    model: Optional[str] = None


class OllamaTestResponse(BaseModel):
    response: str
    model: str
