import json
from typing import Any

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _parse_cors_origins_value(v: Any) -> list[str]:
    """JSON (array), URLs separadas por vírgula ou URL única — compatível com Render/Vercel."""
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
    return ["http://localhost:5173", "http://127.0.0.1:5173"]


class Settings(BaseSettings):
    """App settings from environment."""

    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/finance_manager"
    SECRET_KEY: str = "change-me-in-production"
    # String no env: evita pydantic-settings tratar list[str] como JSON (quebra com URL única no Render).
    cors_origins_env: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        validation_alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return _parse_cors_origins_value(self.cors_origins_env)


settings = Settings()
