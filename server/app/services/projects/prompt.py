"""Prompt persistence use cases."""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models import Evaluation, Prompt
from app.schemas.projects.prompt import PromptCreate
from app.services.projects.project import ProjectService


class PromptService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.projects = ProjectService(db)

    def save(self, project_id: str, user_id: str, data: PromptCreate) -> Prompt:
        self.projects.get_owned(project_id, user_id)
        prompt = (
            self.db.query(Prompt)
            .filter(Prompt.project_id == project_id)
            .order_by(Prompt.created_at.desc(), Prompt.id.desc())
            .first()
        )
        if prompt:
            is_used = (
                self.db.query(Evaluation.id)
                .filter(Evaluation.prompt_id == prompt.id)
                .first()
                is not None
            )
            has_changed = prompt.content != data.content or prompt.file_type != data.file_type
            if is_used and has_changed:
                prompt = Prompt(project_id=project_id, content=data.content, file_type=data.file_type)
                self.db.add(prompt)
            else:
                prompt.content = data.content
                prompt.file_type = data.file_type
        else:
            prompt = Prompt(project_id=project_id, content=data.content, file_type=data.file_type)
            self.db.add(prompt)
        self.db.commit()
        self.db.refresh(prompt)
        return prompt

    def get(self, project_id: str, user_id: str) -> Prompt:
        self.projects.get_owned(project_id, user_id)
        prompt = (
            self.db.query(Prompt)
            .filter(Prompt.project_id == project_id)
            .order_by(Prompt.created_at.desc(), Prompt.id.desc())
            .first()
        )
        if not prompt:
            raise NotFoundError("No prompt found for this project")
        return prompt
