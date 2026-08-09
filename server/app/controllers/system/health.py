"""Application health and discovery controller."""

from datetime import datetime

from sqlalchemy import text

from app.core.database import engine
from app.schemas.system.health import HealthResponse


class HealthController:
    def root(self) -> dict[str, str]:
        return {
            "message": "Welcome to APREP - Agent PRompt Evaluation Platform",
            "docs": "/docs",
            "version": "1.0.0",
        }

    def ping(self) -> dict[str, str]:
        return {"status": "alive", "timestamp": datetime.utcnow().isoformat()}

    async def health(self) -> HealthResponse:
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            database = "healthy"
        except Exception:
            database = "unhealthy"
        return HealthResponse(
            status="healthy" if database == "healthy" else "degraded",
            database=database,
            # Avoid spending an Ollama request on every unauthenticated health probe.
            ollama="not_checked",
        )


health_controller = HealthController()
