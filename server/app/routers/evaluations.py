from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response, JSONResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Project, Prompt, QuestionSlot, Evaluation, EvaluationResult
from app.schemas import (
    EvaluationRequest,
    EvaluationResponse,
    EvaluationDetailResponse,
    EvaluationResultResponse
)
from app.utils.auth import get_current_user
from app.services.evaluator import evaluator_service
from app.services.report_generator import report_generator

router = APIRouter(tags=["Evaluations"])


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


async def verify_evaluation_ownership(
    evaluation_id: str,
    current_user: User,
    db: Session
) -> Evaluation:
    """Verify that the evaluation exists and belongs to the current user."""
    evaluation = db.query(Evaluation).join(Project).filter(
        Evaluation.id == evaluation_id,
        Project.user_id == current_user.id
    ).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )
    
    return evaluation


@router.post("/projects/{project_id}/evaluate", response_model=EvaluationResponse)
async def run_evaluation(
    project_id: str,
    request: EvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Run an evaluation on a project."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    # Get question slot
    slot = db.query(QuestionSlot).filter(
        QuestionSlot.id == request.slot_id,
        QuestionSlot.project_id == project_id
    ).first()
    
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question slot not found"
        )
    
    # The prompt is the target agent's instruction context for evaluator scoring.
    # It is not sent to the target agent endpoint as part of the question payload.
    prompt = db.query(Prompt).filter(
        Prompt.id == request.prompt_id,
        Prompt.project_id == project_id
    ).first()
    
    if not prompt or not prompt.content.strip():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt is required before running an evaluation"
        )
    
    # Run evaluation
    try:
        evaluation = await evaluator_service.run_evaluation(
            db=db,
            project=project,
            slot=slot,
            prompt=prompt,
            include_trait_tests=request.include_trait_tests,
            trait_test_count=request.trait_test_count
        )
        
        return evaluation
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Evaluation failed: {str(e)}"
        )


@router.get("/projects/{project_id}/evaluations", response_model=List[EvaluationResponse])
async def list_evaluations(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all evaluations for a project."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    evaluations = db.query(Evaluation).filter(
        Evaluation.project_id == project_id
    ).order_by(Evaluation.started_at.desc()).all()
    
    return evaluations


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationDetailResponse)
async def get_evaluation(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed evaluation results."""
    # Verify evaluation ownership
    evaluation = await verify_evaluation_ownership(evaluation_id, current_user, db)
    
    # Get related data
    project = db.query(Project).filter(Project.id == evaluation.project_id).first()
    prompt = db.query(Prompt).filter(Prompt.id == evaluation.prompt_id).first()
    slot = db.query(QuestionSlot).filter(QuestionSlot.id == evaluation.slot_id).first()
    results = db.query(EvaluationResult).filter(
        EvaluationResult.evaluation_id == evaluation_id
    ).all()
    
    # Build response
    response = EvaluationDetailResponse(
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
        slot_name=slot.name if slot else None
    )
    
    return response


@router.get("/evaluations/{evaluation_id}/export/json")
async def export_evaluation_json(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export evaluation as JSON."""
    # Verify evaluation ownership
    evaluation = await verify_evaluation_ownership(evaluation_id, current_user, db)
    
    # Get related data
    project = db.query(Project).filter(Project.id == evaluation.project_id).first()
    prompt = db.query(Prompt).filter(Prompt.id == evaluation.prompt_id).first()
    slot = db.query(QuestionSlot).filter(QuestionSlot.id == evaluation.slot_id).first()
    results = db.query(EvaluationResult).filter(
        EvaluationResult.evaluation_id == evaluation_id
    ).all()
    
    # Generate report
    report = report_generator.generate_json_report(
        evaluation=evaluation,
        results=results,
        project=project,
        prompt=prompt,
        slot=slot
    )
    
    return JSONResponse(content=report)


@router.get("/evaluations/{evaluation_id}/export/csv")
async def export_evaluation_csv(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export evaluation as CSV."""
    # Verify evaluation ownership
    evaluation = await verify_evaluation_ownership(evaluation_id, current_user, db)
    
    # Get related data
    project = db.query(Project).filter(Project.id == evaluation.project_id).first()
    prompt = db.query(Prompt).filter(Prompt.id == evaluation.prompt_id).first()
    slot = db.query(QuestionSlot).filter(QuestionSlot.id == evaluation.slot_id).first()
    results = db.query(EvaluationResult).filter(
        EvaluationResult.evaluation_id == evaluation_id
    ).all()
    
    # Generate report
    csv_content = report_generator.generate_csv_report(
        evaluation=evaluation,
        results=results,
        project=project,
        prompt=prompt,
        slot=slot
    )
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=evaluation_{evaluation_id}.csv"
        }
    )

# Made with Bob
