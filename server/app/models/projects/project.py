"""Project persistence model."""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
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
    # Keep the existing physical column names so development databases upgrade
    # without a destructive reset. The application-facing names describe the
    # flexible contract now stored in them.
    request_body_template = Column(
        "request_field_name", Text, nullable=False, default='{\n  "message": "{{message}}"\n}'
    )
    response_path = Column("response_field_name", String, nullable=False, default="answer")
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
