"""Application health and discovery controller."""

from datetime import datetime

from sqlalchemy import text

from app.core.database import engine
from app.infrastructure.clients.ollama import ollama_client
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
        except Exception as error:
            database = f"unhealthy: {error}"
        ollama = "available" if await ollama_client.check_availability() else "unavailable"
        return HealthResponse(
            status="healthy" if database == "healthy" else "degraded",
            database=database,
            ollama=ollama,
        )


health_controller = HealthController()
