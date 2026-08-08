"""Settings for a developer workstation or local test environment."""

from pydantic_settings import SettingsConfigDict

from app.core.config.base import ApplicationSettings, SERVER_DIRECTORY


class DevelopmentSettings(ApplicationSettings):
    app_env: str = "development"
    debug: bool = True
    log_level: str = "DEBUG"
    database_url: str = "postgresql+psycopg2://aprep_user:change-me@localhost:5432/aprep_db"
    cors_origins: str = "*"

    model_config = SettingsConfigDict(
        env_file=SERVER_DIRECTORY / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )
