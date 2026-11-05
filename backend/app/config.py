from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ROOT_DIR = Path(__file__).resolve().parents[2]
_ROOT_ENV = _ROOT_DIR / ".env"
_LOCAL_ENV = _ROOT_DIR / "backend" / ".env"


class Settings(BaseSettings):
    app_env: str = "local"
    database_url: str = "postgresql://guardian:guardian@localhost:5432/guardian"
    secret_key: str = "change-me-long-random-key-for-local-dev"
    session_secret: str = ""
    cors_origins: str = "http://localhost:3000"
    demo_mode: bool = True
    auth_base_url: str = "http://localhost:3000"

    # AI Configuration (supports both AI_PROVIDER and LLM_PROVIDER)
    ai_provider: str = "mock"
    ai_model: str = "mock-model"
    ai_api_key: str = ""
    ai_timeout_s: int = 20
    max_upload_mb: int = 10

    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""

    model_config = SettingsConfigDict(
        env_file=(_ROOT_ENV, _LOCAL_ENV, ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
