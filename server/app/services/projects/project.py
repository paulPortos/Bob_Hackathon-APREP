"""Project use cases and authorization-aware persistence operations."""

import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import ConflictError, NotFoundError
from app.core.security import encrypt_token
from app.models import Project, User
from app.schemas.projects.project import ProjectCreate, ProjectTokenUpdate, ProjectUpdate


class ProjectService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create(self, user_id: str, data: ProjectCreate) -> Project:
        # Lock the account row so concurrent requests cannot create more than two projects.
        user = (
            self.db.query(User).filter(User.id == user_id).with_for_update().first()
        )
        if not user:
            raise NotFoundError("User not found")
        project_count = self.db.query(Project).filter(Project.user_id == user_id).count()
        if project_count >= settings.max_projects_per_user:
            raise ConflictError(
                "Project limit reached. Delete an existing project before creating another."
            )

        project_id = str(uuid.uuid4())
        project = Project(
            id=project_id,
            user_id=user_id,
            name=data.name or f"Project-{project_id[:8]}",
            endpoint_url=data.endpoint_url,
            requires_token=data.requires_token,
            encrypted_token=encrypt_token(data.token)
            if data.requires_token and data.token
            else None,
            request_body_template=data.request_body_template,
            response_path=data.response_path,
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def list_for_user(self, user_id: str) -> list[Project]:
        return self.db.query(Project).filter(Project.user_id == user_id).all()

    def get_owned(self, project_id: str, user_id: str) -> Project:
        project = (
            self.db.query(Project)
            .filter(Project.id == project_id, Project.user_id == user_id)
            .first()
        )
        if not project:
            raise NotFoundError("Project not found")
        return project

    def update(self, project_id: str, user_id: str, data: ProjectUpdate) -> Project:
        project = self.get_owned(project_id, user_id)
        for field, value in data.model_dump(exclude_unset=True).items():
            # Preserve the existing PATCH contract: omitted and null values do not overwrite data.
            if value is not None:
                setattr(project, field, value)
        self.db.commit()
        self.db.refresh(project)
        return project

    def update_token(self, project_id: str, user_id: str, data: ProjectTokenUpdate) -> Project:
        project = self.get_owned(project_id, user_id)
        project.encrypted_token = encrypt_token(data.token)
        project.requires_token = True
        self.db.commit()
        self.db.refresh(project)
        return project

    def delete(self, project_id: str, user_id: str) -> None:
        project = self.get_owned(project_id, user_id)
        self.db.delete(project)
        self.db.commit()
