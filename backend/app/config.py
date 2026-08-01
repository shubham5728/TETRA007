from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime configuration, overridable through a .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "AURA CareLink API"
    api_version: str = "0.1.0"

    # SQLite keeps the prototype self-contained. The URL is the only thing that
    # has to change to move to PostgreSQL — SQLAlchemy handles the rest.
    database_url: str = f"sqlite:///{BASE_DIR / 'aura.db'}"

    # Signing key for access tokens. Override in production.
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 720

    # Where the trained Sentinel model is written.
    model_path: str = str(BASE_DIR / "app" / "ml" / "sentinel_model.joblib")

    # ---------------------------------------------------------------- language model
    #
    # A language model only rewrites the wording of a Care Coordinator reply.
    # It never decides the risk level or which buttons appear — that stays with
    # the triage rules in app/care/triage.py, so an outage, an expired key or a
    # bad completion can never downgrade a medical emergency.
    #
    # "auto" uses Gemini when a Gemini key is present, otherwise OpenAI,
    # otherwise nothing.
    llm_provider: str = "auto"  # auto | gemini | openai | none
    llm_timeout_seconds: float = 15.0

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.0-flash"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta"

    openai_api_key: str | None = None
    openai_model: str = "gpt-4o-mini"
    openai_base_url: str = "https://api.openai.com/v1"

    cors_origins: list[str] = ["*"]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
