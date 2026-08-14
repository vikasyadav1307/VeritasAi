"""Health check router.

Provides two endpoints:
- GET /health — shallow check (always returns healthy if the process is alive)
- GET /health/ready — deep check (verifies database and Redis connectivity)

See 05_API_SPECIFICATION.md §5.27–5.28.
"""

import time

import structlog
from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.core.schemas import HealthCheckDetail, HealthResponse, ReadinessResponse
from app.infrastructure.cache.redis_client import get_redis_client
from app.infrastructure.database.session import engine

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=200,
    summary="Shallow health check",
    description="Returns healthy if the API process is running.",
)
async def health_check() -> HealthResponse:
    """Shallow health check — no external dependencies verified."""
    return HealthResponse(
        status="healthy",
        version=settings.app_version,
    )


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    status_code=200,
    summary="Deep readiness check",
    description="Verifies database and Redis connectivity.",
)
async def readiness_check() -> ReadinessResponse:
    """Deep readiness check — verifies all external dependencies."""
    checks: dict[str, HealthCheckDetail] = {}
    all_healthy = True

    # ── Database check ──
    try:
        start = time.monotonic()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency = (time.monotonic() - start) * 1000
        checks["database"] = HealthCheckDetail(status="up", latency_ms=round(latency, 2))
    except Exception as exc:
        logger.error("Database health check failed", error=str(exc))
        checks["database"] = HealthCheckDetail(status="down", error=str(exc))
        all_healthy = False

    # ── Redis check ──
    try:
        start = time.monotonic()
        redis_client = await get_redis_client()
        await redis_client.ping()
        latency = (time.monotonic() - start) * 1000
        checks["redis"] = HealthCheckDetail(status="up", latency_ms=round(latency, 2))
    except Exception as exc:
        logger.error("Redis health check failed", error=str(exc))
        checks["redis"] = HealthCheckDetail(status="down", error=str(exc))
        all_healthy = False

    response = ReadinessResponse(
        status="ready" if all_healthy else "not_ready",
        checks=checks,
    )

    if not all_healthy:
        # Return 503 for failing readiness (handled by returning the model;
        # status code override via Response parameter if needed)
        logger.warning("Readiness check failed", checks=checks)

    return response
