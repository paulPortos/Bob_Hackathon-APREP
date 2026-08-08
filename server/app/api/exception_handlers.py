"""Translate framework-independent application errors to HTTP responses."""

from fastapi import Request
from fastapi.responses import JSONResponse

from app.core.exceptions import AppError, UnauthorizedError


async def app_error_handler(_: Request, error: AppError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if isinstance(error, UnauthorizedError) else None
    return JSONResponse(
        status_code=error.status_code,
        content={"detail": error.detail},
        headers=headers,
    )
