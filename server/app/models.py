from sqlalchemy import Column, String, Boolean, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.database import Base


class User(Base):
    """User model for authentication."""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """Project model representing an AI agent endpoint."""
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    endpoint_url = Column(String, nullable=False)
    requires_token = Column(Boolean, default=False)
    encrypted_token = Column(String, nullable=True)
    request_field_name = Column(String, default="message")
    response_field_name = Column(String, default="answer")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="projects")
    prompts = relationship("Prompt", back_populates="project", cascade="all, delete-orphan")
    question_slots = relationship("QuestionSlot", back_populates="project", cascade="all, delete-orphan")
    evaluations = relationship("Evaluation", back_populates="project", cascade="all, delete-orphan")


class Prompt(Base):
    """Prompt model for storing agent prompts."""
    __tablename__ = "prompts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    content = Column(Text, nullable=False)
    file_type = Column(String, nullable=False)  # "md" or "txt"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="prompts")


class QuestionSlot(Base):
    """Question slot model for grouping questions."""
    __tablename__ = "question_slots"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_auto_generated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="question_slots")
    questions = relationship("Question", back_populates="slot", cascade="all, delete-orphan")


class Question(Base):
    """Question model for individual questions in a slot."""
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    slot_id = Column(String, ForeignKey("question_slots.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    expected_answer = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    
    # Relationships
    slot = relationship("QuestionSlot", back_populates="questions")


class Evaluation(Base):
    """Evaluation model for storing evaluation runs."""
    __tablename__ = "evaluations"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    prompt_id = Column(String, ForeignKey("prompts.id"), nullable=False)
    slot_id = Column(String, ForeignKey("question_slots.id"), nullable=False)
    status = Column(String, default="running")  # "running", "completed", "failed"
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    overall_score = Column(Float, nullable=True)
    explanation_summary = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="evaluations")
    prompt = relationship("Prompt")
    slot = relationship("QuestionSlot")
    results = relationship("EvaluationResult", back_populates="evaluation", cascade="all, delete-orphan")


class EvaluationResult(Base):
    """Evaluation result model for individual question results."""
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
    trait_type = Column(String, nullable=True)  # "security", "honesty", "speed", "prompt_adherence", "semantic_accuracy"
    score_explanation = Column(Text, nullable=True)
    
    # Relationships
    evaluation = relationship("Evaluation", back_populates="results")
    question = relationship("Question")

# Made with Bob
