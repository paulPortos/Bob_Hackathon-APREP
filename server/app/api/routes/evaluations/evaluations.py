"""Evaluation and report-export endpoints."""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session

from app.api.client_ip import get_client_ip
from app.api.dependencies import get_current_user
from app.controllers.evaluations.evaluation import evaluation_controller
from app.core.database import get_db
from app.models import User
from app.schemas.evaluations.evaluation import EvaluationDetailResponse, EvaluationRequest, EvaluationResponse

router = APIRouter(tags=["Evaluations"])


@router.post("/projects/{project_id}/evaluate", response_model=EvaluationResponse)
async def run_evaluation(
    project_id: str,
    data: EvaluationRequest,
    current_user: User = Depends(get_current_user),
    client_ip: str = Depends(get_client_ip),
    db: Session = Depends(get_db),
):
    return await evaluation_controller.run(db, current_user, project_id, client_ip, data)


@router.get("/projects/{project_id}/evaluations", response_model=list[EvaluationResponse])
def list_evaluations(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return evaluation_controller.list(db, current_user, project_id)


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationDetailResponse)
def get_evaluation(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return evaluation_controller.get_detail(db, current_user, evaluation_id)


@router.get("/evaluations/{evaluation_id}/export/json")
def export_evaluation_json(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return JSONResponse(content=evaluation_controller.export_json(db, current_user, evaluation_id))


@router.get("/evaluations/{evaluation_id}/export/csv")
def export_evaluation_csv(
    evaluation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return Response(
        content=evaluation_controller.export_csv(db, current_user, evaluation_id),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=evaluation_{evaluation_id}.csv"},
    )
