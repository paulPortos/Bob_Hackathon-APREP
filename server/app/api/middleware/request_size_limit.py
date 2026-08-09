"""Cheap early rejection for oversized requests with a Content-Length header."""

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.config import settings


class RequestSizeLimitMiddleware(BaseHTTPMiddleware):
    """Reject known oversized requests before Pydantic or route code processes them."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > settings.max_request_body_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body is too large."},
                    )
            except ValueError:
                return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header."})
        return await call_next(request)
