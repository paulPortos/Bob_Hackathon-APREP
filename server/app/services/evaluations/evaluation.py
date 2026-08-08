"""Evaluation use cases and report retrieval."""

from sqlalchemy.orm import Session

from app.core.exceptions import EvaluationError, NotFoundError
from app.models import Evaluation, EvaluationResult, Project, Prompt, QuestionSlot
from app.schemas.evaluations.evaluation import EvaluationDetailResponse, EvaluationRequest
from app.services.evaluations.evaluator import evaluator_service
from app.services.evaluations.report import report_generator
from app.services.projects.project import ProjectService


class EvaluationService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.projects = ProjectService(db)

    async def run(self, project_id: str, user_id: str, data: EvaluationRequest) -> Evaluation:
        project = self.projects.get_owned(project_id, user_id)
        slot = (
            self.db.query(QuestionSlot)
            .filter(QuestionSlot.id == data.slot_id, QuestionSlot.project_id == project_id)
            .first()
        )
        if not slot:
            raise NotFoundError("Question slot not found")
        prompt = (
            self.db.query(Prompt)
            .filter(Prompt.id == data.prompt_id, Prompt.project_id == project_id)
            .first()
        )
        if not prompt or not prompt.content.strip():
            raise NotFoundError("Prompt is required before running an evaluation")
        try:
            return await evaluator_service.run_evaluation(
                db=self.db,
                project=project,
                slot=slot,
                prompt=prompt,
                include_trait_tests=data.include_trait_tests,
                trait_test_count=data.trait_test_count,
            )
        except Exception as error:
            raise EvaluationError("Evaluation failed") from error

    def list_for_project(self, project_id: str, user_id: str) -> list[Evaluation]:
        self.projects.get_owned(project_id, user_id)
        return (
            self.db.query(Evaluation)
            .filter(Evaluation.project_id == project_id)
            .order_by(Evaluation.started_at.desc())
            .all()
        )

    def get_owned(self, evaluation_id: str, user_id: str) -> Evaluation:
        evaluation = (
            self.db.query(Evaluation)
            .join(Project)
            .filter(Evaluation.id == evaluation_id, Project.user_id == user_id)
            .first()
        )
        if not evaluation:
            raise NotFoundError("Evaluation not found")
        return evaluation

    def get_detail(self, evaluation_id: str, user_id: str) -> EvaluationDetailResponse:
        evaluation = self.get_owned(evaluation_id, user_id)
        project = evaluation.project
        prompt = self.db.query(Prompt).filter(Prompt.id == evaluation.prompt_id).first()
        slot = self.db.query(QuestionSlot).filter(QuestionSlot.id == evaluation.slot_id).first()
        results = (
            self.db.query(EvaluationResult)
            .filter(EvaluationResult.evaluation_id == evaluation_id)
            .all()
        )
        return EvaluationDetailResponse(
            id=evaluation.id,
            project_id=evaluation.project_id,
            prompt_id=evaluation.prompt_id,
            slot_id=evaluation.slot_id,
            status=evaluation.status,
            started_at=evaluation.started_at,
            completed_at=evaluation.completed_at,
            overall_score=evaluation.overall_score,
            explanation_summary=evaluation.explanation_summary,
            recommendation=evaluation.recommendation,
            results=results,
            project_name=project.name if project else None,
            endpoint_url=project.endpoint_url if project else None,
            prompt_content=prompt.content if prompt else None,
            slot_name=slot.name if slot else None,
        )

    def json_report(self, evaluation_id: str, user_id: str) -> dict:
        evaluation, results, project, prompt, slot = self._report_data(evaluation_id, user_id)
        return report_generator.generate_json_report(evaluation, results, project, prompt, slot)

    def csv_report(self, evaluation_id: str, user_id: str) -> str:
        evaluation, results, project, prompt, slot = self._report_data(evaluation_id, user_id)
        return report_generator.generate_csv_report(evaluation, results, project, prompt, slot)

    def _report_data(self, evaluation_id: str, user_id: str):
        evaluation = self.get_owned(evaluation_id, user_id)
        results = (
            self.db.query(EvaluationResult)
            .filter(EvaluationResult.evaluation_id == evaluation_id)
            .all()
        )
        prompt = self.db.query(Prompt).filter(Prompt.id == evaluation.prompt_id).first()
        slot = self.db.query(QuestionSlot).filter(QuestionSlot.id == evaluation.slot_id).first()
        return evaluation, results, evaluation.project, prompt, slot
