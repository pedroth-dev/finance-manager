import json
from typing import Any

from pydantic import Field, field_validator
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
    # Opcional: regex que casa com Origin (ex.: beta no Vercel com vários subdomínios).
    # Ex.: https://.*\\.vercel\\.app
    cors_origin_regex: str | None = Field(default=None, validation_alias="CORS_ORIGIN_REGEX")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("cors_origin_regex", mode="before")
    @classmethod
    def _cors_regex_empty(cls, v: Any) -> str | None:
        if v is None or (isinstance(v, str) and not v.strip()):
            return None
        return str(v).strip()

    @property
    def CORS_ORIGINS(self) -> list[str]:
        return _parse_cors_origins_value(self.cors_origins_env)


settings = Settings()
