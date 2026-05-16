from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Database
    database_url: str = "postgresql://aprep_user:your_password@localhost:5432/aprep_db"
    
    # Ollama Configuration
    # If ollama_base_url is empty/None, will use Ollama Cloud (https://api.ollama.com)
    # If set, will use local Ollama instance
    ollama_base_url: Optional[str] = None
    ollama_default_model: str = "llama3.1"
    ollama_api_key: Optional[str] = None
    
    # Security
    encryption_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_days: int = 7
    
    # Application Settings
    max_questions_per_slot: int = 10
    max_trait_tests: int = 10
    default_timeout_seconds: int = 30
    
    # CORS Settings
    cors_origins: str = "*"  # Comma-separated list of allowed origins, or "*" for all
    
    # Keep-Alive Settings (for Render deployment)
    base_url: Optional[str] = None  # Base URL of the deployed app (e.g., https://your-app.onrender.com)
    keep_alive_enabled: bool = False  # Enable/disable keep-alive pings
    keep_alive_interval_minutes: int = 14  # Interval between pings (default: 14 minutes)
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()

# Made with Bob
