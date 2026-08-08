"""Project controller."""

from sqlalchemy.orm import Session

from app.models import Project, User
from app.schemas.projects.project import ProjectCreate, ProjectTokenUpdate, ProjectUpdate
from app.services.projects.project import ProjectService


class ProjectController:
    def create(self, db: Session, user: User, data: ProjectCreate) -> Project:
        return ProjectService(db).create(user.id, data)

    def list(self, db: Session, user: User) -> list[Project]:
        return ProjectService(db).list_for_user(user.id)

    def get(self, db: Session, user: User, project_id: str) -> Project:
        return ProjectService(db).get_owned(project_id, user.id)

    def update(self, db: Session, user: User, project_id: str, data: ProjectUpdate) -> Project:
        return ProjectService(db).update(project_id, user.id, data)

    def update_token(
        self, db: Session, user: User, project_id: str, data: ProjectTokenUpdate
    ) -> Project:
        return ProjectService(db).update_token(project_id, user.id, data)

    def delete(self, db: Session, user: User, project_id: str) -> None:
        ProjectService(db).delete(project_id, user.id)


project_controller = ProjectController()
