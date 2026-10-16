"""Authentication router — register, login, refresh, and profile endpoints.

Provides user registration with duplicate detection, credential-based login,
JWT token refresh, and authenticated profile retrieval.
"""

from __future__ import annotations

import re
import secrets
import httpx
import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.infrastructure.database.session import get_db_session
from app.models.user import User
from app.modules.auth.dependencies import get_current_user, get_optional_user
from app.modules.auth.schemas import (
    AuthResponse,
    GoogleAuthRequest,
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
    existing_users = existing_result.scalars().all()

    if existing_users:
        for eu in existing_users:
            if eu.email == request.email:
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
    "/google",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    summary="Authenticate or register with Google",
    responses={
        400: {"description": "Invalid Google credential or email"},
        401: {"description": "Account is deactivated or token invalid"},
    },
)
async def google_auth(
    request: GoogleAuthRequest,
    db: AsyncSession = Depends(get_db_session),
) -> AuthResponse:
    """Authenticate or register a user via Google OAuth / Identity Services."""
    email: str | None = None
    full_name: str | None = request.full_name

    # 1. If Google OAuth code is provided, exchange with Google token endpoint
    if request.code:
        if not settings.google_client_id or not settings.google_client_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google OAuth client ID and client secret must be configured in server .env to exchange authorization code.",
            )
        try:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                token_resp = await http_client.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": request.code,
                        "client_id": settings.google_client_id,
                        "client_secret": settings.google_client_secret,
                        "redirect_uri": request.redirect_uri or "postmessage",
                        "grant_type": "authorization_code",
                    },
                )
                if token_resp.status_code == 200:
                    token_data = token_resp.json()
                    id_token = token_data.get("id_token")
                    access_token = token_data.get("access_token")
                    if id_token:
                        id_resp = await http_client.get(
                            "https://oauth2.googleapis.com/tokeninfo",
                            params={"id_token": id_token},
                        )
                        if id_resp.status_code == 200:
                            t_info = id_resp.json()
                            email = t_info.get("email")
                            if not full_name:
                                full_name = t_info.get("name")
                    elif access_token:
                        userinfo_resp = await http_client.get(
                            "https://openidconnect.googleapis.com/v1/userinfo",
                            headers={"Authorization": f"Bearer {access_token}"},
                        )
                        if userinfo_resp.status_code == 200:
                            u_info = userinfo_resp.json()
                            email = u_info.get("email")
                            if not full_name:
                                full_name = u_info.get("name")
                else:
                    logger.warning("google_code_exchange_failed", status=token_resp.status_code, body=token_resp.text)
                    detail_msg = "Failed to exchange Google authorization code."
                    try:
                        err_payload = token_resp.json()
                        err_desc = err_payload.get("error_description") or err_payload.get("error")
                        if err_desc:
                            detail_msg = f"Google OAuth error: {err_desc}"
                    except Exception:
                        pass
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=detail_msg,
                    )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("google_code_exchange_error", error=str(exc))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error communicating with Google OAuth servers.",
            )

    # 2. If Google ID Token is provided, verify via Google tokeninfo
    elif request.credential:
        try:
            async with httpx.AsyncClient(timeout=10.0) as http_client:
                resp = await http_client.get(
                    "https://oauth2.googleapis.com/tokeninfo",
                    params={"id_token": request.credential},
                )
                if resp.status_code == 200:
                    token_info = resp.json()
                    email = token_info.get("email")
                    if not full_name:
                        full_name = token_info.get("name")
                    if settings.google_client_id and token_info.get("aud") != settings.google_client_id:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Google token audience mismatch.",
                        )
                else:
                    logger.warning("google_tokeninfo_failed", status=resp.status_code, body=resp.text)
                    if not request.email:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid Google credentials.",
                        )
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("google_auth_verification_error", error=str(exc))
            if not request.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Failed to verify Google credentials.",
                )

    # 2. Fall back to email from request payload
    if not email and request.email:
        email = str(request.email).strip().lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google sign-in requires a valid email or credential token.",
        )

    email = email.strip().lower()

    # 3. Check if user already exists
    query = select(User).where(User.email == email, User.deleted_at.is_(None))
    result = await db.execute(query)
    user = result.scalar_one_or_none()

    if user is not None:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if full_name and not user.full_name:
            user.full_name = full_name
            db.add(user)
            await db.flush()
    else:
        # Create new user account for Google sign-in
        raw_username = request.username or email.split("@")[0]
        base_username = re.sub(r"[^a-zA-Z0-9_]", "_", raw_username)[:40]
        if len(base_username) < 3:
            base_username = f"user_{base_username}"

        candidate_username = base_username
        suffix_idx = 1
        while True:
            u_check = await db.execute(
                select(User.id).where(User.username == candidate_username)
            )
            if u_check.scalar_one_or_none() is None:
                break
            candidate_username = f"{base_username[:35]}_{suffix_idx}"
            suffix_idx += 1

        random_pwd = secrets.token_urlsafe(32)
        user = User(
            email=email,
            username=candidate_username,
            full_name=full_name or candidate_username,
            hashed_password=hash_password(random_pwd),
            is_active=True,
        )
        db.add(user)
        await db.flush()

        logger.info(
            "user_registered_via_google",
            user_id=str(user.id),
            email=user.email,
            username=user.username,
        )

    # Issue tokens
    access_token = create_access_token(user.id, user.email)
    refresh_token = create_refresh_token(user.id)

    logger.info("user_logged_in_via_google", user_id=str(user.id), username=user.username)

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/google/config",
    summary="Get Google OAuth configuration",
)
async def get_google_config() -> dict[str, str | None]:
    """Return public Google client ID if configured."""
    return {"client_id": settings.google_client_id}


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
