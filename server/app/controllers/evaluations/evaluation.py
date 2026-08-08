"""Evaluation controller."""

from sqlalchemy.orm import Session

from app.models import Evaluation, User
from app.schemas.evaluations.evaluation import EvaluationDetailResponse, EvaluationRequest
from app.services.evaluations.evaluation import EvaluationService


class EvaluationController:
    async def run(
        self, db: Session, user: User, project_id: str, client_ip: str, data: EvaluationRequest
    ) -> Evaluation:
        return await EvaluationService(db).run(project_id, user.id, client_ip, data)

    def list(self, db: Session, user: User, project_id: str) -> list[Evaluation]:
        return EvaluationService(db).list_for_project(project_id, user.id)

    def get_detail(self, db: Session, user: User, evaluation_id: str) -> EvaluationDetailResponse:
        return EvaluationService(db).get_detail(evaluation_id, user.id)

    def export_json(self, db: Session, user: User, evaluation_id: str) -> dict:
        return EvaluationService(db).json_report(evaluation_id, user.id)

    def export_csv(self, db: Session, user: User, evaluation_id: str) -> str:
        return EvaluationService(db).csv_report(evaluation_id, user.id)


evaluation_controller = EvaluationController()
