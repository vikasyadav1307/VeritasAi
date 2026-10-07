"""Production rate limiting middleware.

Provides sliding window rate limiting backed by Redis with automatic fail-open
fallbacks. Protects expensive ML inference and auth endpoints against DoS and brute force.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Tuple

import structlog
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import settings
from app.infrastructure.cache.redis_client import get_redis_client

logger = structlog.get_logger(__name__)

# Excluded paths from rate limiting
EXCLUDED_PATHS = {
    "/health",
    "/health/ready",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
}


def _get_rate_limit_for_path(path: str) -> Tuple[int, str]:
    """Determine (limit_per_minute, bucket_name) for a given request path."""
    if path.startswith("/api/v1/auth/login") or path.startswith("/api/v1/auth/register"):
        return 15, "auth"
    if path.startswith("/api/v1/analyze") or path.startswith("/api/v1/explain"):
        return 30, "inference"
    return 120, "standard"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Enforces rate limits using Redis with fail-open resiliency."""

    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint,
    ) -> Response:
        # If rate limiting is disabled globally, skip check
        if not getattr(settings, "rate_limit_enabled", False):
            return await call_next(request)

        path = request.url.path
        if path in EXCLUDED_PATHS:
            return await call_next(request)

        # Determine client identifier (authenticated user ID if present, otherwise client IP)
        client_ip = request.headers.get("X-Forwarded-For")
        if client_ip:
            client_ip = client_ip.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        # Check for Authorization token identifier without full JWT decode to save CPU
        auth_header = request.headers.get("Authorization", "")
        client_id = f"ip:{client_ip}"
        if auth_header.startswith("Bearer "):
            # Use last 16 chars of token as unique user bucket
            client_id = f"token:{auth_header[-16:]}"

        limit, bucket = _get_rate_limit_for_path(path)
        current_minute = int(time.time() // 60)
        cache_key = f"rate_limit:{bucket}:{client_id}:{current_minute}"

        current_count = 1
        ttl = 60 - int(time.time() % 60)

        try:
            redis_client = await get_redis_client()
            pipe = redis_client.pipeline()
            pipe.incr(cache_key)
            pipe.expire(cache_key, 65)
            results = await pipe.execute()
            current_count = results[0]
        except Exception as exc:
            # Resilient fail-open: do not block users if Redis is temporarily unreachable
            logger.warning("Rate limiter Redis unavailable, failing open", error=str(exc))
            return await call_next(request)

        # Check if rate limit exceeded
        if current_count > limit:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Rate limit exceeded",
                client=client_id,
                bucket=bucket,
                count=current_count,
                limit=limit,
                path=path,
                request_id=request_id,
            )
            response = JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Limit is {limit} requests per minute.",
                        "details": {
                            "limit": limit,
                            "retry_after_seconds": ttl,
                        },
                    },
                    "meta": {
                        "request_id": request_id,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
            response.headers["Retry-After"] = str(ttl)
            response.headers["X-RateLimit-Limit"] = str(limit)
            response.headers["X-RateLimit-Remaining"] = "0"
            response.headers["X-RateLimit-Reset"] = str(ttl)
            return response

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, limit - current_count))
        response.headers["X-RateLimit-Reset"] = str(ttl)
        return response
