"""Prompt endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.controllers.projects.prompt import prompt_controller
from app.core.database import get_db
from app.models import User
from app.schemas.projects.prompt import PromptCreate, PromptResponse

router = APIRouter(prefix="/projects/{project_id}/prompt", tags=["Prompts"])


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
def save_prompt(
    project_id: str,
    data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return prompt_controller.save(db, current_user, project_id, data)


@router.get("", response_model=PromptResponse)
def get_prompt(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return prompt_controller.get(db, current_user, project_id)
