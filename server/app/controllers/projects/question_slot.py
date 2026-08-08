"""Question-slot controller."""

from sqlalchemy.orm import Session

from app.models import QuestionSlot, User
from app.schemas.projects.question_slot import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionSlotCreate,
    QuestionSlotUpdate,
)
from app.services.projects.question_slot import QuestionSlotService


class QuestionSlotController:
    def create(
        self, db: Session, user: User, project_id: str, data: QuestionSlotCreate
    ) -> QuestionSlot:
        return QuestionSlotService(db).create(project_id, user.id, data)

    def list(self, db: Session, user: User, project_id: str) -> list[QuestionSlot]:
        return QuestionSlotService(db).list_for_project(project_id, user.id)

    def get(self, db: Session, user: User, slot_id: str) -> QuestionSlot:
        return QuestionSlotService(db).get_owned(slot_id, user.id)

    def update(
        self, db: Session, user: User, slot_id: str, data: QuestionSlotUpdate
    ) -> QuestionSlot:
        return QuestionSlotService(db).update(slot_id, user.id, data)

    def delete(self, db: Session, user: User, slot_id: str) -> None:
        QuestionSlotService(db).delete(slot_id, user.id)

    async def generate(
        self, db: Session, user: User, project_id: str, data: GenerateQuestionsRequest
    ) -> GenerateQuestionsResponse:
        slot = await QuestionSlotService(db).generate(project_id, user.id, data)
        return GenerateQuestionsResponse(slot_id=slot.id, questions=slot.questions)


question_slot_controller = QuestionSlotController()
