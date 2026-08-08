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
