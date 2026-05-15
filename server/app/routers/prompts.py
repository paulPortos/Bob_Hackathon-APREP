from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Project, Prompt
from app.schemas import PromptCreate, PromptResponse
from app.utils.auth import get_current_user

router = APIRouter(prefix="/projects/{project_id}/prompt", tags=["Prompts"])


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


@router.post("", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_prompt(
    project_id: str,
    prompt_data: PromptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a prompt for a project."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    # Check if prompt already exists
    existing_prompt = db.query(Prompt).filter(Prompt.project_id == project_id).first()
    
    if existing_prompt:
        # Update existing prompt
        existing_prompt.content = prompt_data.content
        existing_prompt.file_type = prompt_data.file_type
        db.commit()
        db.refresh(existing_prompt)
        return existing_prompt
    else:
        # Create new prompt
        new_prompt = Prompt(
            project_id=project_id,
            content=prompt_data.content,
            file_type=prompt_data.file_type
        )
        db.add(new_prompt)
        db.commit()
        db.refresh(new_prompt)
        return new_prompt


@router.get("", response_model=PromptResponse)
async def get_prompt(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current prompt for a project."""
    # Verify project ownership
    project = await verify_project_ownership(project_id, current_user, db)
    
    # Get the latest prompt
    prompt = db.query(Prompt).filter(Prompt.project_id == project_id).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prompt found for this project"
        )
    
    return prompt

# Made with Bob
