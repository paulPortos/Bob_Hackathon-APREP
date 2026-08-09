"""Select settings based on the explicit ``APP_ENV`` process environment variable."""

import os
from functools import lru_cache

from app.core.config.base import ApplicationSettings
from app.core.config.development import DevelopmentSettings
from app.core.config.production import ProductionSettings


@lru_cache
def get_settings() -> ApplicationSettings:
    environment = os.getenv("APP_ENV", "").strip().lower()
    if environment == "development":
        return DevelopmentSettings()
    if environment == "production":
        return ProductionSettings()
    raise RuntimeError(
        "APP_ENV must be explicitly set to 'development' or 'production' before starting APREP"
    )


settings = get_settings()

__all__ = ["ApplicationSettings", "DevelopmentSettings", "ProductionSettings", "settings"]
