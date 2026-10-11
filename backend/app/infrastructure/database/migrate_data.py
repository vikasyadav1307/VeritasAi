"""Database migration utility from local PostgreSQL to Supabase PostgreSQL.

Transfers existing users and analysis results without discarding or overwriting records.
"""

from __future__ import annotations

import argparse
import asyncio
import os
from typing import Any

from sqlalchemy import insert, select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import Settings
from app.infrastructure.database.base import Base
from app.infrastructure.database.session import get_engine_connect_args
from app.models.analysis import AnalysisResult
from app.models.user import User


async def migrate_data(
    source_url: str,
    target_url: str,
) -> dict[str, int]:
    """Migrate users and analysis records from source database to target database.

    Args:
        source_url: Connection string of the source database (e.g. local PostgreSQL).
        target_url: Connection string of the target database (e.g. Supabase PostgreSQL).

    Returns:
        Dictionary with count of migrated and skipped records.
    """
    settings = Settings()
    source_norm = settings.assemble_database_url(source_url)
    target_norm = settings.assemble_database_url(target_url)

    if source_norm == target_norm:
        print("[!] Source and target database URLs are identical. Nothing to migrate.")
        return {"users_migrated": 0, "analyses_migrated": 0}

    source_engine = create_async_engine(
        source_norm,
        connect_args=get_engine_connect_args(source_norm),
    )
    target_engine = create_async_engine(
        target_norm,
        connect_args=get_engine_connect_args(target_norm),
    )

    source_session_factory = async_sessionmaker(source_engine, expire_on_commit=False)
    target_session_factory = async_sessionmaker(target_engine, expire_on_commit=False)

    users_migrated = 0
    users_skipped = 0
    analyses_migrated = 0
    analyses_skipped = 0

    try:
        # 1. Ensure target schema tables exist
        async with target_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            # Ensure alembic_version table is marked with current head
            await conn.execute(
                text(
                    "CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL, CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num));"
                )
            )
            version_check = await conn.execute(text("SELECT version_num FROM alembic_version;"))
            if not version_check.fetchall():
                await conn.execute(
                    text("INSERT INTO alembic_version (version_num) VALUES ('e1a47b892c01');")
                )

        # 2. Migrate Users
        async with source_session_factory() as src_session, target_session_factory() as tgt_session:
            src_users = (await src_session.execute(select(User))).scalars().all()
            print(f"[*] Found {len(src_users)} user(s) in source database.")

            for u in src_users:
                # Check if user already exists in target by ID or email
                existing = await tgt_session.execute(
                    select(User.id).where(
                        (User.id == u.id) | (User.email == u.email) | (User.username == u.username)
                    )
                )
                if existing.scalar_one_or_none() is not None:
                    users_skipped += 1
                    continue

                new_user = User(
                    id=u.id,
                    email=u.email,
                    username=u.username,
                    full_name=u.full_name,
                    hashed_password=u.hashed_password,
                    is_active=u.is_active,
                    created_at=u.created_at,
                    updated_at=u.updated_at,
                    deleted_at=u.deleted_at,
                )
                tgt_session.add(new_user)
                users_migrated += 1

            await tgt_session.commit()
            print(f"[+] Migrated {users_migrated} user(s) ({users_skipped} already existed).")

            # 3. Migrate Analysis Results
            src_analyses = (await src_session.execute(select(AnalysisResult))).scalars().all()
            print(f"[*] Found {len(src_analyses)} analysis record(s) in source database.")

            for a in src_analyses:
                existing = await tgt_session.execute(
                    select(AnalysisResult.id).where(AnalysisResult.id == a.id)
                )
                if existing.scalar_one_or_none() is not None:
                    analyses_skipped += 1
                    continue

                new_analysis = AnalysisResult(
                    id=a.id,
                    user_id=a.user_id,
                    input_type=a.input_type,
                    original_text=a.original_text,
                    cleaned_text=a.cleaned_text,
                    source_url=a.source_url,
                    title=a.title,
                    detected_language=a.detected_language,
                    credibility_label=a.credibility_label,
                    credibility_score=a.credibility_score,
                    sentiment_label=a.sentiment_label,
                    sentiment_score=a.sentiment_score,
                    confidence=a.confidence,
                    processing_time_ms=a.processing_time_ms,
                    is_mock=a.is_mock,
                    created_at=a.created_at,
                    updated_at=a.updated_at,
                    deleted_at=a.deleted_at,
                )
                tgt_session.add(new_analysis)
                analyses_migrated += 1

            await tgt_session.commit()
            print(f"[+] Migrated {analyses_migrated} analysis record(s) ({analyses_skipped} already existed).")

    finally:
        await source_engine.dispose()
        await target_engine.dispose()

    return {
        "users_migrated": users_migrated,
        "users_skipped": users_skipped,
        "analyses_migrated": analyses_migrated,
        "analyses_skipped": analyses_skipped,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Migrate VeritasAI data to Supabase PostgreSQL.")
    parser.add_argument(
        "--source",
        default=os.getenv("SOURCE_DATABASE_URL", "postgresql+asyncpg://veritas:veritas@localhost:5432/veritasai"),
        help="Source database URL (defaults to local PostgreSQL)",
    )
    parser.add_argument(
        "--target",
        default=os.getenv("DATABASE_URL") or Settings().database_url,
        help="Target database URL (defaults to DATABASE_URL environment variable or settings.database_url)",
    )
    args = parser.parse_args()

    if not args.target:
        print("[!] Error: Target database URL not provided. Set DATABASE_URL or pass --target.")
        return

    asyncio.run(migrate_data(args.source, args.target))


if __name__ == "__main__":
    main()
