"""Async SQLAlchemy engine and session factory.

Provides a single async engine and a scoped async session factory.
Session lifecycle is managed via FastAPI dependency injection.
See 04_DATABASE_DESIGN.md §12 for connection pooling configuration.
"""

from collections.abc import AsyncGenerator

from typing import Any

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings


def get_engine_connect_args(database_url: str) -> dict[str, Any]:
    """Configure connection arguments for asyncpg based on database provider."""
    args: dict[str, Any] = {}
    url_lower = database_url.lower()

    # Supabase & managed cloud PostgreSQL SSL configuration
    if "supabase.co" in url_lower or "supabase.com" in url_lower:
        if "ssl" not in url_lower:
            args["ssl"] = "require"
        # Supabase transaction pooler (port 6543) requires disabling statement cache
        if ":6543" in database_url or "pooler.supabase.com" in url_lower:
            args["statement_cache_size"] = 0

    return args


# Async engine — single instance per process
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=5 if settings.is_development else 20,
    max_overflow=10 if settings.is_development else 40,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args=get_engine_connect_args(settings.database_url),
)

# Session factory — creates new sessions for each request
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields an async database session.

    Usage::

        @router.get("/example")
        async def example(db: AsyncSession = Depends(get_db_session)):
            ...
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
