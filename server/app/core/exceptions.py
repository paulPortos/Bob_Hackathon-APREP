"""Framework-independent errors raised by controllers and services."""


class AppError(Exception):
    """An expected application error that is safe to return to an API client."""

    status_code = 400

    def __init__(self, detail: str):
        self.detail = detail
        super().__init__(detail)


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 400


class UnauthorizedError(AppError):
    status_code = 401


class ExternalServiceError(AppError):
    status_code = 503


class EvaluationError(AppError):
    status_code = 500


class RateLimitExceeded(AppError):
    status_code = 429

    def __init__(self, detail: str, retry_after_seconds: int):
        self.headers = {"Retry-After": str(max(1, retry_after_seconds))}
        super().__init__(detail)
