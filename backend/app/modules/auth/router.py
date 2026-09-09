"""Authentication router — register, login, refresh, and profile endpoints.

Provides user registration with duplicate detection, credential-based login,
JWT token refresh, and authenticated profile retrieval.
"""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.schemas import (
    AuthResponse,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    UserResponse,
)
from app.modules.auth.security import (
    JWTError,
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Endpoints ──


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user account",
    responses={
        409: {"description": "Email or username already registered"},
    },
)
async def register(
    request: RegisterRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Create a new user account and return authentication tokens."""

    # Check for existing email or username
    existing_query = select(User).where(
        or_(
            User.email == request.email,
            User.username == request.username,
        ),
        User.deleted_at.is_(None),
    )
    existing_result = await db.execute(existing_query)
    existing_user = existing_result.scalar_one_or_none()

    if existing_user is not None:
        if existing_user.email == request.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This username is already taken.",
        )

    # Create user
    user = User(
        email=request.email,
        username=request.username,
        full_name=request.full_name,
        hashed_password=hash_password(request.password),
        is_active=True,
    )
    db.add(user)
    await db.flush()

    # Generate tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    logger.info(
        "user_registered",
        user_id=str(user.id),
        username=user.username,
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate and obtain tokens",
    responses={
        401: {"description": "Invalid credentials"},
    },
)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Authenticate a user with email and password, return JWT tokens."""

    # Find user by email
    query = select(User).where(
        User.email == request.email,
        User.deleted_at.is_(None),
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    logger.info(
        "user_logged_in",
        user_id=str(user.id),
        username=user.username,
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/refresh",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Refresh access token",
    responses={
        401: {"description": "Invalid or expired refresh token"},
    },
)
async def refresh(
    request: RefreshRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Exchange a valid refresh token for a new access token pair."""

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(request.refresh_token)
        user_id_str = payload.get("sub")
        token_type = payload.get("type")

        if user_id_str is None or token_type != "refresh":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    import uuid

    query = select(User).where(
        User.id == uuid.UUID(user_id_str),
        User.deleted_at.is_(None),
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    # Issue new token pair
    access_token = create_access_token(user.id, user.email)
    new_refresh_token = create_refresh_token(user.id)

    logger.info(
        "token_refreshed",
        user_id=str(user.id),
    )

    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get current user profile",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Log out the current user",
    responses={
        200: {"description": "Successfully logged out"},
    },
)
async def logout(
    current_user: User | None = Depends(get_optional_user),
) -> dict[str, str]:
    """Log out the user and invalidate client authentication session."""
    if current_user:
        logger.info("user_logged_out", user_id=str(current_user.id))
    return {"message": "Successfully logged out"}
