from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.database import get_db
from app.models import User, Project
from app.schemas import ProjectCreate, ProjectUpdate, ProjectTokenUpdate, ProjectResponse
from app.utils.auth import get_current_user
from app.utils.security import token_encryption

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new project with endpoint registration."""
    # Generate default name if not provided
    project_id = str(uuid.uuid4())
    name = project_data.name or f"Project-{project_id[:8]}"
    
    # Encrypt token if provided
    encrypted_token = None
    if project_data.requires_token and project_data.token:
        encrypted_token = token_encryption.encrypt(project_data.token)
    
    # Create project
    new_project = Project(
        id=project_id,
        user_id=current_user.id,
        name=name,
        endpoint_url=project_data.endpoint_url,
        requires_token=project_data.requires_token,
        encrypted_token=encrypted_token,
        request_field_name=project_data.request_field_name,
        response_field_name=project_data.response_field_name
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    return new_project


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all projects for the current user."""
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific project."""
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


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields if provided
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.endpoint_url is not None:
        project.endpoint_url = project_data.endpoint_url
    if project_data.requires_token is not None:
        project.requires_token = project_data.requires_token
    if project_data.request_field_name is not None:
        project.request_field_name = project_data.request_field_name
    if project_data.response_field_name is not None:
        project.response_field_name = project_data.response_field_name
    
    db.commit()
    db.refresh(project)
    
    return project


@router.patch("/{project_id}/token", response_model=ProjectResponse)
async def update_project_token(
    project_id: str,
    token_data: ProjectTokenUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update project token."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Encrypt and update token
    project.encrypted_token = token_encryption.encrypt(token_data.token)
    project.requires_token = True
    
    db.commit()
    db.refresh(project)
    
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a project."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    
    return None

# Made with Bob
