"""Settings for a deployed APREP service."""

from urllib.parse import urlparse

from cryptography.fernet import Fernet
from pydantic import field_validator, model_validator
from pydantic_settings import SettingsConfigDict

from app.core.config.base import ApplicationSettings


class ProductionSettings(ApplicationSettings):
    app_env: str = "production"
    debug: bool = False
    log_level: str = "INFO"
    database_url: str = "postgresql+psycopg2://aprep_user:change-me@localhost:5432/aprep_db"
    cors_origins: str

    model_config = SettingsConfigDict(
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("cors_origins")
    @classmethod
    def require_explicit_cors_origins(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]
        if not origins or "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit origins in production")
        parsed_origins = [urlparse(origin) for origin in origins]
        if any(
            origin.scheme != "https"
            or not origin.netloc
            or origin.path not in {"", "/"}
            or origin.params
            or origin.query
            or origin.fragment
            for origin in parsed_origins
        ):
            raise ValueError("CORS_ORIGINS must contain exact HTTPS origins in production")
        return value

    @field_validator("allowed_hosts", "agent_endpoint_allowed_hosts")
    @classmethod
    def require_explicit_host_lists(cls, value: str) -> str:
        hosts = [host.strip() for host in value.split(",") if host.strip()]
        if not hosts or "*" in hosts:
            raise ValueError("Production host lists must contain explicit host names")
        if any("/" in host or ":" in host or " " in host for host in hosts):
            raise ValueError("Host lists must contain host names only, without ports or paths")
        return ",".join(hosts)

    @model_validator(mode="after")
    def validate_production_secrets_and_proxy(self) -> "ProductionSettings":
        if "change-me" in self.database_url or not self.database_url.startswith(
            "postgresql+psycopg2://"
        ):
            raise ValueError("DATABASE_URL must be a real PostgreSQL psycopg2 URL in production")
        if len(self.jwt_secret_key.encode("utf-8")) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 bytes in production")
        try:
            Fernet(self.encryption_key.encode("utf-8"))
        except (TypeError, ValueError) as error:
            raise ValueError("ENCRYPTION_KEY must be a valid Fernet key in production") from error
        if self.trusted_proxy_count and not self.trusted_proxy_ips.strip():
            raise ValueError("TRUSTED_PROXY_IPS is required when TRUSTED_PROXY_COUNT is set")
        return self
