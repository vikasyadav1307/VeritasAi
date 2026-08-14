"""Async SQLAlchemy engine and session factory.

Provides a single async engine and a scoped async session factory.
Session lifecycle is managed via FastAPI dependency injection.
See 04_DATABASE_DESIGN.md §12 for connection pooling configuration.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.config import settings

# Async engine — single instance per process
engine = create_async_engine(
    settings.database_url,
    echo=settings.database_echo,
    pool_size=5 if settings.is_development else 20,
    max_overflow=10 if settings.is_development else 40,
    pool_pre_ping=True,
    pool_recycle=300,
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
