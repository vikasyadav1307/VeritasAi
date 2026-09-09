"""Authentication FastAPI dependencies.

Provides dependency-injection functions for extracting the current
user from JWT tokens in incoming requests.

Two flavours:
- `get_current_user`: Mandatory authentication — raises 401 if no valid token.
- `get_optional_user`: Optional authentication — returns None if no token present,
  raises 401 only if a token IS present but invalid/expired.

Security note:
- The authenticated user's ID is always derived from the JWT `sub` claim.
- Client-supplied user_id parameters are NEVER trusted for authenticated requests.
"""

from __future__ import annotations

import uuid

import structlog
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import Request

from app.infrastructure.database.session import get_db_session
from app.models.user import User
from app.modules.auth.security import JWTError, decode_token

logger = structlog.get_logger(__name__)

# OAuth2 scheme extracts token from Authorization: Bearer <token>
# tokenUrl points to the login endpoint for OpenAPI docs compatibility
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=True,
)

# Same scheme but does not auto-raise 401 when token is missing
oauth2_scheme_optional = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db_session),
) -> User:
    """Extract and validate the current authenticated user from the JWT.

    Raises:
        HTTPException 401: If the token is missing, invalid, expired,
            or the user does not exist / is inactive.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id_str: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id_str is None or token_type != "access":
            raise credentials_exception

        user_id = uuid.UUID(user_id_str)

    except (JWTError, ValueError):
        raise credentials_exception

    query = select(User).where(
        User.id == user_id,
        User.deleted_at.is_(None),
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db_session),
) -> User | None:
    """Extract the current user if an Authorization header is present.

    Returns None for unauthenticated requests (no header).
    Raises 401 only if a token IS present but is invalid or expired.

    This is used on endpoints that work for both anonymous and
    authenticated users (e.g., analysis, history, dashboard).
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    # Header present — must be valid
    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None

    token = parts[1]

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token)
        user_id_str: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")

        if user_id_str is None or token_type != "access":
            raise credentials_exception

        user_id = uuid.UUID(user_id_str)

    except (JWTError, ValueError):
        raise credentials_exception

    query = select(User).where(
        User.id == user_id,
        User.deleted_at.is_(None),
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    return user
