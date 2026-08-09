"""Question-slot and generated-question DTOs."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=1, max_length=5_000)
    expected_answer: Optional[str] = Field(default=None, max_length=10_000)
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
    name: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2_000)
    questions: list[QuestionCreate] = Field(..., max_length=10)

    @field_validator("questions")
    @classmethod
    def validate_questions_count(cls, value: list[QuestionCreate]) -> list[QuestionCreate]:
        if len(value) > 10:
            raise ValueError("Maximum 10 questions per slot")
        return value


class QuestionSlotUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2_000)
    questions: Optional[list[QuestionCreate]] = None

    @field_validator("questions")
    @classmethod
    def validate_questions_count(
        cls, value: Optional[list[QuestionCreate]]
    ) -> Optional[list[QuestionCreate]]:
        if value and len(value) > 10:
            raise ValueError("Maximum 10 questions per slot")
        return value


class QuestionSlotResponse(BaseModel):
    id: str
    project_id: str
    name: str
    description: Optional[str]
    is_auto_generated: bool
    created_at: datetime
    questions: list[QuestionResponse] = []

    class Config:
        from_attributes = True


class GenerateQuestionsRequest(BaseModel):
    count: int = Field(..., ge=1, le=10)
    purpose: str = Field(..., min_length=10, max_length=2_000)
    use_prompt: bool = True


class GenerateQuestionsResponse(BaseModel):
    slot_id: str
    questions: list[QuestionResponse]
