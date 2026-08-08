"""Pydantic DTOs grouped by API feature."""

from app.schemas.evaluations.evaluation import (
    EvaluationDetailResponse,
    EvaluationRequest,
    EvaluationResponse,
    EvaluationResultResponse,
    EvaluationStatus,
    TraitType,
)
from app.schemas.identity.auth import Token, UserLogin, UserRegister, UserResponse
from app.schemas.integrations.ollama import (
    OllamaModel,
    OllamaModelsResponse,
    OllamaTestRequest,
    OllamaTestResponse,
)
from app.schemas.projects.project import ProjectCreate, ProjectResponse, ProjectTokenUpdate, ProjectUpdate
from app.schemas.projects.prompt import PromptCreate, PromptResponse
from app.schemas.projects.question_slot import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionCreate,
    QuestionResponse,
    QuestionSlotCreate,
    QuestionSlotResponse,
    QuestionSlotUpdate,
)
from app.schemas.system.health import HealthResponse

__all__ = [name for name in globals() if not name.startswith("_")]
