from fastapi import APIRouter, HTTPException, status
from app.schemas import OllamaModelsResponse, OllamaModel, OllamaTestRequest, OllamaTestResponse
from app.services.ollama_client import ollama_client

router = APIRouter(prefix="/ollama", tags=["Ollama"])


@router.get("/models", response_model=OllamaModelsResponse)
async def list_ollama_models():
    """List available Ollama models."""
    try:
        models_data = await ollama_client.list_models()
        
        models = [
            OllamaModel(
                name=model.get("name", ""),
                size=model.get("size"),
                modified_at=model.get("modified_at")
            )
            for model in models_data
        ]
        
        return OllamaModelsResponse(models=models)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to connect to Ollama: {str(e)}"
        )


@router.post("/test-generate", response_model=OllamaTestResponse)
async def test_generate(request: OllamaTestRequest):
    """Test Ollama text generation."""
    try:
        response = await ollama_client.generate(
            prompt=request.prompt,
            model=request.model
        )
        
        return OllamaTestResponse(
            response=response,
            model=request.model or ollama_client.default_model
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to generate with Ollama: {str(e)}"
        )

# Made with Bob
