import json
from typing import Annotated, List, Literal, Optional

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict

# Value shipped in examples. It is accepted only in development so a
# forgotten .env can never reach production with a guessable signing key.
INSECURE_DEV_SECRET = "dev-secret-key-change-in-production-123456789"


class Settings(BaseSettings):
    PROJECT_NAME: str = "G-AI Backend"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["development", "test", "production"] = "development"

    # CORS origins, comma-separated in the environment
    # (e.g. BACKEND_CORS_ORIGINS=https://app.example.com,https://admin.example.com)
    BACKEND_CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./g_ai.db"
    # Create tables on startup instead of running Alembic migrations.
    # Convenient for local SQLite; production must use `alembic upgrade head`.
    AUTO_CREATE_SCHEMA: bool = True
    # Connection pool, sized for free tiers (Supabase free allows ~60 direct / 200 pooled clients).
    DB_POOL_SIZE: int = 3
    DB_MAX_OVERFLOW: int = 2
    DB_POOL_RECYCLE_SECONDS: int = 300
    # Disable server-side prepared statements for a transaction-mode pooler (PgBouncer/Supavisor).
    # Unset = auto-detect from the URL's port (6543 is Supabase's transaction pooler).
    DB_TRANSACTION_POOLER: Optional[bool] = None

    # Security
    SECRET_KEY: str = INSECURE_DEV_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    AUTH_COOKIE_NAME: str = "g_ai_session"
    AUTH_COOKIE_SECURE: bool = False

    # Login throttling: failed attempts allowed per window before answering 429.
    LOGIN_WINDOW_SECONDS: int = 15 * 60
    LOGIN_MAX_FAILURES_PER_EMAIL_IP: int = 5
    LOGIN_MAX_FAILURES_PER_EMAIL: int = 20
    LOGIN_MAX_FAILURES_PER_IP: int = 50
    # How many reverse proxies in front of the app append to X-Forwarded-For
    # (e.g. Vercel rewrite + Render = 2). 0 trusts no header and uses the socket peer address.
    TRUSTED_PROXY_HOPS: int = 0

    # Calendar day boundaries for daily metrics
    DEFAULT_TIMEZONE: str = "Asia/Ho_Chi_Minh"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def _split_origins(cls, value):
        if isinstance(value, str):
            if value.strip().startswith("["):
                return json.loads(value)
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @model_validator(mode="after")
    def _enforce_production_safety(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if self.SECRET_KEY == INSECURE_DEV_SECRET or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY must be set to a random value of at least 32 characters in production "
                    "(e.g. `python -c \"import secrets; print(secrets.token_urlsafe(48))\"`)."
                )
            if self.AUTO_CREATE_SCHEMA:
                raise ValueError("AUTO_CREATE_SCHEMA must be false in production; run `alembic upgrade head`.")
            if not self.AUTH_COOKIE_SECURE:
                raise ValueError("AUTH_COOKIE_SECURE must be true in production.")
        return self


settings = Settings()
