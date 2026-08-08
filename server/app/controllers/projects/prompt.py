"""Prompt controller."""

from sqlalchemy.orm import Session

from app.models import Prompt, User
from app.schemas.projects.prompt import PromptCreate
from app.services.projects.prompt import PromptService


class PromptController:
    def save(self, db: Session, user: User, project_id: str, data: PromptCreate) -> Prompt:
        return PromptService(db).save(project_id, user.id, data)

    def get(self, db: Session, user: User, project_id: str) -> Prompt:
        return PromptService(db).get(project_id, user.id)


prompt_controller = PromptController()
