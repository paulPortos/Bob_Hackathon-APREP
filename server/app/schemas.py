from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================================
# Enums
# ============================================================================

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


# ============================================================================
# User Schemas
# ============================================================================

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ============================================================================
# Project Schemas
# ============================================================================

class ProjectCreate(BaseModel):
    endpoint_url: str
    name: Optional[str] = None
    requires_token: bool = False
    token: Optional[str] = None
    request_field_name: str = "message"
    response_field_name: str = "answer"
    
    @validator('endpoint_url')
    def validate_endpoint_url(cls, v):
        if not v.startswith(('http://', 'https://', 'ws://', 'wss://')):
            raise ValueError('Endpoint URL must start with http://, https://, ws://, or wss://')
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    endpoint_url: Optional[str] = None
    requires_token: Optional[bool] = None
    request_field_name: Optional[str] = None
    response_field_name: Optional[str] = None
    
    @validator('endpoint_url')
    def validate_endpoint_url(cls, v):
        if v and not v.startswith(('http://', 'https://', 'ws://', 'wss://')):
            raise ValueError('Endpoint URL must start with http://, https://, ws://, or wss://')
        return v


class ProjectTokenUpdate(BaseModel):
    token: str


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    endpoint_url: str
    requires_token: bool
    request_field_name: str
    response_field_name: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Prompt Schemas
# ============================================================================

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


# ============================================================================
# Question Schemas
# ============================================================================

class QuestionCreate(BaseModel):
    question_text: str
    expected_answer: Optional[str] = None
    order: int


class QuestionResponse(BaseModel):
    id: str
    slot_id: str
    question_text: str
    expected_answer: Optional[str]
    order: int
    
    class Config:
        from_attributes = True


class QuestionSlotCreate(BaseModel):
    name: str
    description: Optional[str] = None
    questions: List[QuestionCreate] = Field(..., max_length=10)
    
    @validator('questions')
    def validate_questions_count(cls, v):
        if len(v) > 10:
            raise ValueError('Maximum 10 questions per slot')
        return v


class QuestionSlotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None
    
    @validator('questions')
    def validate_questions_count(cls, v):
        if v and len(v) > 10:
            raise ValueError('Maximum 10 questions per slot')
        return v


class QuestionSlotResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str]
    is_auto_generated: bool
    created_at: datetime
    questions: List[QuestionResponse] = []
    
    class Config:
        from_attributes = True


# ============================================================================
# Auto Question Generation Schemas
# ============================================================================

class GenerateQuestionsRequest(BaseModel):
    count: int = Field(..., ge=1, le=10)
    purpose: str = Field(..., min_length=10)
    use_prompt: bool = True


class GenerateQuestionsResponse(BaseModel):
    slot_id: str
    questions: List[QuestionResponse]


# ============================================================================
# Evaluation Schemas
# ============================================================================

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
    results: List[EvaluationResultResponse] = []
    project_name: Optional[str] = None
    endpoint_url: Optional[str] = None
    prompt_content: Optional[str] = None
    slot_name: Optional[str] = None


# ============================================================================
# Ollama Schemas
# ============================================================================

class OllamaModel(BaseModel):
    name: str
    size: Optional[int] = None
    modified_at: Optional[str] = None


class OllamaModelsResponse(BaseModel):
    models: List[OllamaModel]


class OllamaTestRequest(BaseModel):
    prompt: str
    model: Optional[str] = None


class OllamaTestResponse(BaseModel):
    response: str
    model: str


# ============================================================================
# Health Check Schema
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    database: str
    ollama: str

# Made with Bob
