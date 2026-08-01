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

    # Optional Gemini key. Without it the simplifier falls back to its
    # rule-based path, which is what runs today.
    gemini_api_key: str | None = None

    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
