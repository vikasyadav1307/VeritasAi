"""Redis client factory and connection management."""

import redis.asyncio as redis

from app.config import settings

# Lazy-initialized Redis connection pool
_redis_client: redis.Redis | None = None


async def get_redis_client() -> redis.Redis:
    """Get or create the Redis client singleton.

    Returns a cached connection to avoid reconnecting on every request.
    Connection pool is managed by the redis-py library.
    """
    global _redis_client  # noqa: PLW0603
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            socket_timeout=5,
            retry_on_timeout=True,
        )
    return _redis_client


async def close_redis_client() -> None:
    """Close the Redis connection (called on app shutdown)."""
    global _redis_client  # noqa: PLW0603
    if _redis_client is not None:
        await _redis_client.close()
        _redis_client = None
