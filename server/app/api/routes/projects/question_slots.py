"""Question-slot endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.controllers.projects.question_slot import question_slot_controller
from app.core.database import get_db
from app.models import User
from app.schemas.projects.question_slot import (
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
    QuestionSlotCreate,
    QuestionSlotResponse,
    QuestionSlotUpdate,
)

router = APIRouter(tags=["Question Slots"])


@router.post(
    "/projects/{project_id}/question-slots",
    response_model=QuestionSlotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_question_slot(
    project_id: str,
    data: QuestionSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return question_slot_controller.create(db, current_user, project_id, data)


@router.get("/projects/{project_id}/question-slots", response_model=list[QuestionSlotResponse])
def list_question_slots(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return question_slot_controller.list(db, current_user, project_id)


@router.get("/question-slots/{slot_id}", response_model=QuestionSlotResponse)
def get_question_slot(
    slot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return question_slot_controller.get(db, current_user, slot_id)


@router.patch("/question-slots/{slot_id}", response_model=QuestionSlotResponse)
def update_question_slot(
    slot_id: str,
    data: QuestionSlotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return question_slot_controller.update(db, current_user, slot_id, data)


@router.delete("/question-slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question_slot(
    slot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question_slot_controller.delete(db, current_user, slot_id)


@router.post("/projects/{project_id}/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    project_id: str,
    data: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return await question_slot_controller.generate(db, current_user, project_id, data)
