"""Ollama controller."""

from app.schemas.integrations.ollama import OllamaModel, OllamaModelsResponse, OllamaTestRequest, OllamaTestResponse
from app.services.integrations.ollama import OllamaService


class OllamaController:
    async def list_models(self) -> OllamaModelsResponse:
        models = await OllamaService().list_models()
        return OllamaModelsResponse(
            models=[
                OllamaModel(
                    name=model.get("name", ""),
                    size=model.get("size"),
                    modified_at=model.get("modified_at"),
                )
                for model in models
            ]
        )

    async def test_generate(self, data: OllamaTestRequest) -> OllamaTestResponse:
        response, model = await OllamaService().generate(data.prompt, data.model)
        return OllamaTestResponse(response=response, model=model)


ollama_controller = OllamaController()
