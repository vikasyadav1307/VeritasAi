"""Initialize local SQLite database for development and testing when Postgres is offline."""

import asyncio
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.infrastructure.database.base import Base
import app.models
from app.models.user import User
from app.modules.auth.security import hash_password


async def init():
    db_path = backend_dir / "veritasai.db"
    engine = create_async_engine(f"sqlite+aiosqlite:///{db_path}")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print(f"Created tables in SQLite: {db_path}")

    session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        from sqlalchemy import select
        stmt = select(User).where(User.email == "browser_m37@example.com")
        res = await session.execute(stmt)
        user = res.scalar_one_or_none()
        if not user:
            user = User(
                username="browser_m37",
                email="browser_m37@example.com",
                hashed_password=hash_password("Password123!"),
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print("Created test user: browser_m37@example.com / Password123!")
        else:
            print("Test user already exists.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())
