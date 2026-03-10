from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """App settings from environment."""

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/finance_manager"
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
