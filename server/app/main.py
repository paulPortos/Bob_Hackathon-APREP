"""FastAPI application composition and lifecycle management.

Routes live in ``app.api``, use-case coordination lives in ``app.controllers``,
and database/external-system work lives in ``app.services`` and ``app.infrastructure``.
"""

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from app.api.exception_handlers import app_error_handler
from app.api.middleware.ip_rate_limit import IPRateLimitMiddleware
from app.api.middleware.request_size_limit import RequestSizeLimitMiddleware
from app.api.middleware.security_headers import SecurityHeadersMiddleware
from app.api.router import api_router
from app.core.config import settings
from app.core.database import init_db
from app.core.exceptions import AppError
from app.infrastructure.clients.ollama import ollama_client
from app.infrastructure.http_client import http_client_pool
from app.infrastructure.scheduling.keep_alive import keep_alive_service

logger = logging.getLogger(__name__)


def parse_cors_origins(cors_origins: str) -> list[str]:
    """Turn a comma-separated environment variable into valid CORS origins."""
    if cors_origins.strip() == "*":
        return ["*"]
    return [origin.strip().rstrip("/") for origin in cors_origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize and shut down application-owned infrastructure."""
    await http_client_pool.start()
    try:
        init_db()
        ollama_available = await ollama_client.check_availability()
        logger.info("Database initialized")
        logger.info(
            "Ollama is available"
            if ollama_available
            else "Ollama is unavailable; evaluations will use heuristic scoring"
        )
        keep_alive_service.start()
        yield
    finally:
        keep_alive_service.stop()
        await http_client_pool.stop()


def create_app() -> FastAPI:
    """Build the HTTP application without embedding feature-specific behavior."""
    logging.basicConfig(level=getattr(logging, settings.log_level.upper(), logging.INFO))
    app = FastAPI(
        title=settings.app_name,
        description="Backend API for evaluating AI agents against expected behaviors and traits",
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
    )
    cors_origins = parse_cors_origins(settings.cors_origins)
    allowed_hosts = [host.strip() for host in settings.allowed_hosts.split(",") if host.strip()]
    app.add_middleware(IPRateLimitMiddleware)
    app.add_middleware(RequestSizeLimitMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        # Wildcard origins cannot be used with credentialed browser requests.
        allow_credentials=cors_origins != ["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_exception_handler(AppError, app_error_handler)
    app.include_router(api_router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
