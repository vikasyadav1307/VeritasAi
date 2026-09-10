"""VeritasAI Backend — FastAPI Application Factory.

This is the main entry point for the backend server.
Run with: uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.infrastructure.cache.redis_client import close_redis_client
from app.infrastructure.logging.setup import setup_logging
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.routers.health import router as health_router
from app.modules.analysis.router import router as analysis_router
from app.modules.url_analysis.router import router as url_analysis_router
from app.modules.history.router import router as history_router
from app.modules.auth.router import router as auth_router
from app.modules.dashboard.router import router as dashboard_router
from app.modules.image_analysis.router import router as image_analysis_router
from app.modules.explainability.router import router as explainability_router
from app.modules.translation.router import router as translation_router

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan — startup and shutdown events.

    Startup:
        - Configure structured logging
        - Log application info

    Shutdown:
        - Close Redis connection pool
        - Close database engine
    """
    # ── Startup ──
    setup_logging()
    logger.info(
        "VeritasAI starting",
        version=settings.app_version,
        environment=settings.app_env,
        debug=settings.app_debug,
    )

    yield

    # ── Shutdown ──
    logger.info("VeritasAI shutting down")
    await close_redis_client()

    from app.infrastructure.database.session import engine

    await engine.dispose()
    logger.info("VeritasAI shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        Fully configured FastAPI app instance with all middleware
        and routers mounted.
    """
    app = FastAPI(
        title=settings.app_name,
        description="Multilingual Fake News Detection and Sentiment Analysis API",
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters: outermost first) ──
    # 1. Request ID must run first to inject ID for all downstream middleware
    app.add_middleware(RequestIDMiddleware)
    # 2. Security headers on all responses
    app.add_middleware(SecurityHeadersMiddleware)
    # 3. Error handler wraps everything below
    app.add_middleware(ErrorHandlerMiddleware)
    # 4. CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        max_age=600,
    )

    # ── Routers ──
    app.include_router(health_router)
    app.include_router(auth_router, prefix="/api/v1")
    app.include_router(analysis_router, prefix="/api/v1")
    app.include_router(url_analysis_router, prefix="/api/v1")
    app.include_router(image_analysis_router, prefix="/api/v1")
    app.include_router(explainability_router, prefix="/api/v1")
    app.include_router(translation_router, prefix="/api/v1")
    app.include_router(history_router, prefix="/api/v1")
    app.include_router(dashboard_router, prefix="/api/v1")

    return app


# Application instance — imported by uvicorn/gunicorn
app = create_app()
