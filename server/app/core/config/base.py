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
    jwt_expiration_days: int = 7

    max_questions_per_slot: int = 10
    max_trait_tests: int = 10
    default_timeout_seconds: int = 30

    cors_origins: str
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
