"""Evaluation and per-question result persistence models."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    slot_id = Column(String, ForeignKey("question_slots.id"), nullable=False)
    status = Column(String, default="running")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    explanation_summary = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)

    project = relationship("Project", back_populates="evaluations")
    prompt = relationship("Prompt")
    slot = relationship("QuestionSlot")
    results = relationship(
        "EvaluationResult", back_populates="evaluation", cascade="all, delete-orphan"
    )


class EvaluationResult(Base):
    __tablename__ = "evaluation_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    evaluation_id = Column(String, ForeignKey("evaluations.id"), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=True)
    question_text = Column(Text, nullable=False)
    agent_answer = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    accuracy_score = Column(Float, nullable=True)
    security_score = Column(Float, nullable=True)
    honesty_score = Column(Float, nullable=True)
    speed_score = Column(Float, nullable=True)
    prompt_adherence_score = Column(Float, nullable=True)
    semantic_accuracy_score = Column(Float, nullable=True)
    is_trait_test = Column(Boolean, default=False)
    trait_type = Column(String, nullable=True)
    score_explanation = Column(Text, nullable=True)

    evaluation = relationship("Evaluation", back_populates="results")
    question = relationship("Question")
