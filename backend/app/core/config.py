import json
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings from environment."""

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/finance_manager"
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Aceita JSON (array) ou URLs separadas por vírgula — útil em Docker e painéis de deploy."""
        if v is None:
            return ["http://localhost:5173", "http://127.0.0.1:5173"]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return ["http://localhost:5173", "http://127.0.0.1:5173"]
            if s.startswith("["):
                parsed = json.loads(s)
                return [str(x).strip() for x in parsed if str(x).strip()]
            return [x.strip() for x in s.split(",") if x.strip()]
        return v


settings = Settings()
