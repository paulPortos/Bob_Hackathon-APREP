"""Ollama feature use cases."""

from typing import Optional

from app.core.exceptions import ExternalServiceError
from app.infrastructure.clients.ollama import ollama_client


class OllamaService:
    async def list_models(self) -> list[dict]:
        try:
            return await ollama_client.list_models()
        except Exception as error:
            raise ExternalServiceError(f"Failed to connect to Ollama: {error}") from error

    async def generate(self, prompt: str, model: Optional[str] = None) -> tuple[str, str]:
        try:
            response = await ollama_client.generate(prompt=prompt, model=model)
            return response, model or ollama_client.default_model
        except Exception as error:
            raise ExternalServiceError(f"Failed to generate with Ollama: {error}") from error
