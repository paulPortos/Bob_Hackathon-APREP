"""Application discovery and health endpoints."""

from fastapi import APIRouter

from app.controllers.system.health import health_controller
from app.schemas.system.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/", tags=["Root"])
def root():
    return health_controller.root()


@router.get("/ping")
def ping():
    return health_controller.ping()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    return await health_controller.health()
