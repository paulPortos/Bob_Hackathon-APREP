"""Health-check response DTO."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str
    ollama: str
