"""Question-slot use cases, including generated test sets."""

from sqlalchemy.orm import Session

from app.core.exceptions import ExternalServiceError, NotFoundError
from app.infrastructure.clients.ollama import ollama_client
from app.models import Project, Prompt, Question, QuestionSlot
from app.schemas.projects.question_slot import (
    GenerateQuestionsRequest,
    QuestionSlotCreate,
    QuestionSlotUpdate,
)
from app.services.projects.project import ProjectService


class QuestionSlotService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.projects = ProjectService(db)

    def get_owned(self, slot_id: str, user_id: str) -> QuestionSlot:
        slot = (
            self.db.query(QuestionSlot)
            .join(Project)
            .filter(QuestionSlot.id == slot_id, Project.user_id == user_id)
            .first()
        )
        if not slot:
            raise NotFoundError("Question slot not found")
        return slot

    def create(self, project_id: str, user_id: str, data: QuestionSlotCreate) -> QuestionSlot:
        self.projects.get_owned(project_id, user_id)
        slot = QuestionSlot(
            project_id=project_id,
            name=data.name,
            description=data.description,
            is_auto_generated=False,
        )
        self.db.add(slot)
        self.db.flush()
        self._add_questions(slot.id, data.questions)
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def list_for_project(self, project_id: str, user_id: str) -> list[QuestionSlot]:
        self.projects.get_owned(project_id, user_id)
        return self.db.query(QuestionSlot).filter(QuestionSlot.project_id == project_id).all()

    def update(self, slot_id: str, user_id: str, data: QuestionSlotUpdate) -> QuestionSlot:
        slot = self.get_owned(slot_id, user_id)
        if data.name is not None:
            slot.name = data.name
        if data.description is not None:
            slot.description = data.description
        if data.questions is not None:
            self.db.query(Question).filter(Question.slot_id == slot_id).delete(
                synchronize_session=False
            )
            self._add_questions(slot_id, data.questions)
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def delete(self, slot_id: str, user_id: str) -> None:
        slot = self.get_owned(slot_id, user_id)
        self.db.delete(slot)
        self.db.commit()

    async def generate(
        self, project_id: str, user_id: str, data: GenerateQuestionsRequest
    ) -> QuestionSlot:
        self.projects.get_owned(project_id, user_id)
        prompt = None
        if data.use_prompt:
            prompt = self.db.query(Prompt).filter(Prompt.project_id == project_id).first()
        try:
            questions = await ollama_client.generate_questions(
                count=data.count,
                purpose=data.purpose,
                agent_prompt=prompt.content if prompt else None,
            )
        except Exception as error:
            raise ExternalServiceError(f"Failed to generate questions: {error}") from error

        slot = QuestionSlot(
            project_id=project_id,
            name=f"Auto-generated: {data.purpose[:50]}",
            description=f"Auto-generated {data.count} questions for: {data.purpose}",
            is_auto_generated=True,
        )
        self.db.add(slot)
        self.db.flush()
        self._add_questions(slot.id, questions, expected_answers=False)
        self.db.commit()
        self.db.refresh(slot)
        return slot

    def _add_questions(self, slot_id: str, questions, expected_answers: bool = True) -> None:
        for index, question in enumerate(questions, start=1):
            self.db.add(
                Question(
                    slot_id=slot_id,
                    question_text=question.question_text if expected_answers else question,
                    expected_answer=question.expected_answer if expected_answers else None,
                    order=question.order if expected_answers else index,
                )
            )
