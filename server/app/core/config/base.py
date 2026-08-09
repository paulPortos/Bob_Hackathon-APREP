"""Shared settings contract for every deployment environment."""

from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

SERVER_DIRECTORY = Path(__file__).resolve().parents[3]


class ApplicationSettings(BaseSettings):
    """Settings common to local development and production."""

    app_name: str = "APREP - Agent PRompt Evaluation Platform"
    app_version: str = "1.0.0"
    app_env: str
    debug: bool
    log_level: str

    database_url: str

    ollama_base_url: Optional[str] = None
    ollama_default_model: str = "llama3.1"
    ollama_api_key: Optional[str] = None

    encryption_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = Field(default=7, ge=1, le=30)
    jwt_issuer: str = "aprep-api"
    jwt_audience: str = "aprep-client"

    max_questions_per_slot: int = 10
    max_trait_tests: int = 10
    default_timeout_seconds: int = Field(default=30, ge=1, le=60)
    max_request_body_bytes: int = Field(default=1_048_576, ge=1_024, le=10_485_760)
    max_agent_response_bytes: int = Field(default=524_288, ge=1_024, le=5_242_880)

    cors_origins: str
    allowed_hosts: str = "*"
    agent_endpoint_allowed_hosts: str = ""
    enable_diagnostic_routes: bool = False
    base_url: Optional[str] = None
    keep_alive_enabled: bool = False
    keep_alive_interval_minutes: int = 14

    rate_limit_requests_per_minute: int = Field(default=40, ge=1)
    evaluations_per_ip_per_day: int = Field(default=1, ge=1)
    trusted_proxy_count: int = Field(default=0, ge=0)
    trusted_proxy_ips: str = ""
    ip_hash_salt: Optional[str] = None
    abuse_record_retention_days: int = Field(default=7, ge=1)

    model_config = SettingsConfigDict(
        case_sensitive=False,
        env_file_encoding="utf-8",
        extra="ignore",
    )
