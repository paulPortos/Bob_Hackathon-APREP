"""Single composition point for all public API routes."""

from fastapi import APIRouter

from app.api.routes.evaluations import evaluations
from app.api.routes.identity import auth
from app.api.routes.integrations import ollama
from app.api.routes.projects import projects, prompts, question_slots
from app.api.routes.system import health
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(projects.router)
api_router.include_router(prompts.router)
api_router.include_router(question_slots.router)
api_router.include_router(evaluations.router)
if settings.enable_diagnostic_routes:
    api_router.include_router(ollama.router)
