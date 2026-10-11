"""VeritasAI Database Connection and Health Verification Script.

Tests connectivity to the database configured in DATABASE_URL, verifies tables,
and optionally verifies account registration and login.
"""

from __future__ import annotations

import asyncio
import sys
import uuid
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings
from app.infrastructure.database.session import get_engine_connect_args
from app.modules.auth.security import hash_password, verify_password


async def verify():
    url = settings.database_url
    # Mask password for display
    safe_display = url.split("@")[-1] if "@" in url else url

    print(f"[*] Testing connection to: ...@{safe_display}")

    connect_args = get_engine_connect_args(url)
    engine = create_async_engine(url, connect_args=connect_args)

    try:
        async with engine.connect() as conn:
            # 1. Test ping
            result = await conn.execute(text("SELECT 1;"))
            assert result.scalar() == 1
            print("[+] Database connection successful!")

            # 2. Check public tables
            tables_res = await conn.execute(
                text(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
                )
            )
            tables = [row[0] for row in tables_res.fetchall()]
            print(f"[+] Public tables found: {', '.join(tables) if tables else 'None'}")

            if "users" not in tables:
                print("[-] Warning: 'users' table not found. Migrations need to be run.")
                print("    Run: uv run alembic upgrade head")
                return False

            # 3. Check users count
            user_count = (await conn.execute(text("SELECT count(*) FROM users;"))).scalar()
            print(f"[+] Registered users count in 'users' table: {user_count}")

            # 4. Check alembic version
            if "alembic_version" in tables:
                rev = (await conn.execute(text("SELECT version_num FROM alembic_version;"))).scalar()
                print(f"[+] Current Alembic revision: {rev}")

            # 5. Test transient user insertion and password verification
            test_email = f"verify_{uuid.uuid4().hex[:8]}@example.com"
            test_username = f"verify_{uuid.uuid4().hex[:8]}"
            test_pwd = "TestPassword123!"
            pwd_hash = hash_password(test_pwd)

            await conn.execute(
                text(
                    """
                    INSERT INTO users (id, email, username, hashed_password, is_active, created_at, updated_at)
                    VALUES (gen_random_uuid(), :email, :username, :hash, true, now(), now());
                    """
                ),
                {"email": test_email, "username": test_username, "hash": pwd_hash},
            )
            await conn.commit()

            # Verify the record exists
            row = (
                await conn.execute(
                    text("SELECT email, hashed_password, is_active FROM users WHERE email = :email;"),
                    {"email": test_email},
                )
            ).fetchone()
            assert row is not None
            assert verify_password(test_pwd, row[1]) is True
            print("[+] Successfully verified user record creation and password hash verification!")

            # Clean up test user
            await conn.execute(
                text("DELETE FROM users WHERE email = :email;"),
                {"email": test_email},
            )
            await conn.commit()
            print("[+] Test user record cleaned up.")

    except Exception as exc:
        print(f"[-] Connection or verification failed: {exc}")
        return False
    finally:
        await engine.dispose()

    return True


if __name__ == "__main__":
    success = asyncio.run(verify())
    sys.exit(0 if success else 1)
