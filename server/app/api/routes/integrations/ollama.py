"""Ollama diagnostic endpoints."""

from fastapi import APIRouter

from app.controllers.integrations.ollama import ollama_controller
from app.schemas.integrations.ollama import OllamaModelsResponse, OllamaTestRequest, OllamaTestResponse

router = APIRouter(prefix="/ollama", tags=["Ollama"])


@router.get("/models", response_model=OllamaModelsResponse)
async def list_ollama_models():
    return await ollama_controller.list_models()


@router.post("/test-generate", response_model=OllamaTestResponse)
async def test_generate(data: OllamaTestRequest):
    return await ollama_controller.test_generate(data)
