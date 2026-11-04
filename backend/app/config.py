from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    secret_key: str = "change-me-long-random-key-for-local-dev"
    cors_origins: str = "http://localhost:3000"
    llm_provider: str = "mock"
    llm_model: str = "mock-model"
    llm_timeout_s: int = 20
    llm_max_retries: int = 1

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
