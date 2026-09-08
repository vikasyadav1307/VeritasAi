"""Application configuration loaded from environment variables."""

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings, loaded from .env file and environment variables.

    All settings are typed and validated at startup. Missing required
    settings will cause the application to fail fast with a clear error.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──
    app_env: str = Field(default="development", description="Environment: development | staging | production")
    app_debug: bool = Field(default=True, description="Enable debug mode")
    app_secret_key: str = Field(default="change-me-in-production", description="Secret key for general cryptographic operations")
    app_version: str = Field(default="0.1.0", description="Application version")
    app_name: str = Field(default="VeritasAI", description="Application name")

    # ── Backend Server ──
    backend_host: str = Field(default="0.0.0.0", description="Server bind host")
    backend_port: int = Field(default=8000, description="Server bind port")
    backend_workers: int = Field(default=1, description="Number of Uvicorn workers")

    # ── Database ──
    database_url: str = Field(
        default="postgresql+asyncpg://veritas:veritas@localhost:5432/veritasai",
        description="Async PostgreSQL connection string",
    )
    database_echo: bool = Field(default=False, description="Echo SQL queries to logs")

    # ── Redis ──
    redis_url: str = Field(default="redis://localhost:6379/0", description="Redis connection string")

    # ── JWT ──
    jwt_secret_key: str = Field(default="change-me-jwt-secret", description="JWT signing secret")
    jwt_algorithm: str = Field(default="HS256", description="JWT signing algorithm")
    jwt_access_token_expire_minutes: int = Field(default=15, description="Access token TTL in minutes")
    jwt_refresh_token_expire_days: int = Field(default=7, description="Refresh token TTL in days")

    # ── CORS ──
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173",
        description="Comma-separated allowed origins",
    )

    # ── AI Models ──
    model_dir: str = Field(default="./models", description="Directory containing model weights")
    model_device: str = Field(default="cpu", description="Inference device: cpu | cuda")
    model_lazy_load: bool = Field(default=True, description="Lazy-load models on first request")

    # ── OCR ──
    tesseract_cmd: str = Field(default="/usr/bin/tesseract", description="Path to Tesseract binary")

    # ── Rate Limiting ──
    rate_limit_enabled: bool = Field(default=False, description="Enable rate limiting")

    # ── Logging ──
    log_level: str = Field(default="DEBUG", description="Log level: DEBUG | INFO | WARNING | ERROR")
    log_format: str = Field(default="console", description="Log format: console | json")

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse comma-separated CORS origins into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == "production"


# Singleton settings instance
settings = Settings()
