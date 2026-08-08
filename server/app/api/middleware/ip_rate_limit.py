"""Global per-IP request-rate middleware."""

from datetime import datetime

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.api.client_ip import get_client_ip
from app.core.config import settings
from app.services.system.abuse_protection import abuse_protection_service


class IPRateLimitMiddleware(BaseHTTPMiddleware):
    """Allow at most the configured number of non-preflight requests per IP per UTC minute."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        result = abuse_protection_service.consume_request(get_client_ip(request))
        seconds_until_reset = max(0, int((result.reset_at - datetime.utcnow()).total_seconds()))
        reset_timestamp = str(int(datetime.utcnow().timestamp() + seconds_until_reset))
        headers = {
            "X-RateLimit-Limit": str(settings.rate_limit_requests_per_minute),
            "X-RateLimit-Remaining": str(result.remaining),
            "X-RateLimit-Reset": reset_timestamp,
        }
        if not result.allowed:
            headers["Retry-After"] = str(max(1, seconds_until_reset))
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests from this IP address. Try again shortly."},
                headers=headers,
            )

        response = await call_next(request)
        response.headers.update(headers)
        return response
