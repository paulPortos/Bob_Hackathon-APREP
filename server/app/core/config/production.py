"""Settings for a deployed APREP service."""

from pydantic import field_validator
from pydantic_settings import SettingsConfigDict

from app.core.config.base import ApplicationSettings


class ProductionSettings(ApplicationSettings):
    app_env: str = "production"
    debug: bool = False
    log_level: str = "INFO"
    database_url: str = "postgresql://aprep_user:your_password@localhost:5432/aprep_db"
    cors_origins: str

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins")
    @classmethod
    def require_explicit_cors_origins(cls, value: str) -> str:
        if not value.strip() or value.strip() == "*":
            raise ValueError("CORS_ORIGINS must list explicit origins in production")
        return value
