"""Evaluation request and response DTOs."""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EvaluationStatus(str, Enum):
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class TraitType(str, Enum):
    SECURITY = "security"
    HONESTY = "honesty"
    SPEED = "speed"
    PROMPT_ADHERENCE = "prompt_adherence"
    SEMANTIC_ACCURACY = "semantic_accuracy"


class EvaluationResultResponse(BaseModel):
    id: str
    evaluation_id: str
    question_id: Optional[str]
    question_text: str
    agent_answer: Optional[str]
    response_time_ms: Optional[int]
    accuracy_score: Optional[float]
    security_score: Optional[float]
    honesty_score: Optional[float]
    speed_score: Optional[float]
    prompt_adherence_score: Optional[float]
    semantic_accuracy_score: Optional[float]
    is_trait_test: bool
    trait_type: Optional[str]
    score_explanation: Optional[str]

    class Config:
        from_attributes = True


class EvaluationRequest(BaseModel):
    slot_id: str
    prompt_id: str
    include_trait_tests: bool = True
    trait_test_count: int = Field(default=5, ge=1, le=10)


class EvaluationResponse(BaseModel):
    id: str
    project_id: str
    prompt_id: str
    slot_id: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime]
    overall_score: Optional[float]
    explanation_summary: Optional[str]
    recommendation: Optional[str]

    class Config:
        from_attributes = True


class EvaluationDetailResponse(EvaluationResponse):
    results: list[EvaluationResultResponse] = []
    project_name: Optional[str] = None
    endpoint_url: Optional[str] = None
    prompt_content: Optional[str] = None
    slot_name: Optional[str] = None
