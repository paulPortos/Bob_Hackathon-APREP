from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Project, QuestionSlot, Question
from app.schemas import (
    QuestionSlotCreate,
    QuestionSlotUpdate,
    QuestionSlotResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse
)
from app.utils.auth import get_current_user
from app.services.ollama_client import ollama_client

router = APIRouter(tags=["Question Slots"])


async def verify_project_ownership(
    project_id: str,
    current_user: User,
    db: Session
) -> Project:
    """Verify that the project exists and belongs to the current user."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    return project


async def verify_slot_ownership(
    slot_id: str,
    current_user: User,
    db: Session
) -> QuestionSlot:
    """Verify that the question slot exists and belongs to the current user."""
    slot = db.query(QuestionSlot).join(Project).filter(
        QuestionSlot.id == slot_id,
        Project.user_id == current_user.id
    ).first()
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question slot not found"
        )
    
    return slot


@router.post("/projects/{project_id}/question-slots", response_model=QuestionSlotResponse, status_code=status.HTTP_201_CREATED)
async def create_question_slot(
    project_id: str,
    slot_data: QuestionSlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new question slot with questions."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    # Create question slot
    new_slot = QuestionSlot(
        project_id=project_id,
        name=slot_data.name,
        description=slot_data.description,
        is_auto_generated=False
    )
    
    db.add(new_slot)
    db.flush()  # Get the slot ID
    
    # Create questions
    for question_data in slot_data.questions:
        new_question = Question(
            slot_id=new_slot.id,
            question_text=question_data.question_text,
            expected_answer=question_data.expected_answer,
            order=question_data.order
        )
        db.add(new_question)
    
    db.commit()
    db.refresh(new_slot)
    
    return new_slot


@router.get("/projects/{project_id}/question-slots", response_model=List[QuestionSlotResponse])
async def list_question_slots(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all question slots for a project."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    slots = db.query(QuestionSlot).filter(QuestionSlot.project_id == project_id).all()
    return slots


@router.get("/question-slots/{slot_id}", response_model=QuestionSlotResponse)
async def get_question_slot(
    slot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific question slot with its questions."""
    slot = await verify_slot_ownership(slot_id, current_user, db)
    return slot


@router.patch("/question-slots/{slot_id}", response_model=QuestionSlotResponse)
async def update_question_slot(
    slot_id: str,
    slot_data: QuestionSlotUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a question slot."""
    slot = await verify_slot_ownership(slot_id, current_user, db)
    
    # Update slot fields
    if slot_data.name is not None:
        slot.name = slot_data.name
    if slot_data.description is not None:
        slot.description = slot_data.description
    
    # Update questions if provided
    if slot_data.questions is not None:
        # Delete existing questions
        db.query(Question).filter(Question.slot_id == slot_id).delete()
        
        # Create new questions
        for question_data in slot_data.questions:
            new_question = Question(
                slot_id=slot_id,
                question_text=question_data.question_text,
                expected_answer=question_data.expected_answer,
                order=question_data.order
            )
            db.add(new_question)
    
    db.commit()
    db.refresh(slot)
    
    return slot


@router.delete("/question-slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_question_slot(
    slot_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a question slot."""
    slot = await verify_slot_ownership(slot_id, current_user, db)
    
    db.delete(slot)
    db.commit()
    
    return None


@router.post("/projects/{project_id}/generate-questions", response_model=GenerateQuestionsResponse)
async def generate_questions(
    project_id: str,
    request: GenerateQuestionsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Auto-generate questions using Ollama."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    # Get prompt if requested
    prompt_content = None
    if request.use_prompt:
        from app.models import Prompt
        prompt = db.query(Prompt).filter(Prompt.project_id == project_id).first()
        if prompt:
            prompt_content = prompt.content
    
    # Generate questions using Ollama
    try:
        questions = await ollama_client.generate_questions(
            count=request.count,
            purpose=request.purpose,
            agent_prompt=prompt_content
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate questions: {str(e)}"
        )
    
    # Create question slot
    new_slot = QuestionSlot(
        project_id=project_id,
        name=f"Auto-generated: {request.purpose[:50]}",
        description=f"Auto-generated {request.count} questions for: {request.purpose}",
        is_auto_generated=True
    )
    
    db.add(new_slot)
    db.flush()
    
    # Create questions
    question_responses = []
    for i, question_text in enumerate(questions):
        new_question = Question(
            slot_id=new_slot.id,
            question_text=question_text,
            expected_answer=None,
            order=i + 1
        )
        db.add(new_question)
        db.flush()
        question_responses.append(new_question)
    
    db.commit()
    
    return {
        "slot_id": new_slot.id,
        "questions": question_responses
    }

# Made with Bob
