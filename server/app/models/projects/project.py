"""Project persistence model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Project(Base):
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

    user = relationship("User", back_populates="projects")
    prompts = relationship("Prompt", back_populates="project", cascade="all, delete-orphan")
    question_slots = relationship(
        "QuestionSlot", back_populates="project", cascade="all, delete-orphan"
    )
    evaluations = relationship(
        "Evaluation", back_populates="project", cascade="all, delete-orphan"
    )
