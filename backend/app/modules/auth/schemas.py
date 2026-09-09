"""Authentication Pydantic schemas — request/response models.

Defines validation schemas for registration, login, token refresh,
and user profile responses.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Request Schemas ──


class RegisterRequest(BaseModel):
    """User registration request body."""

    email: EmailStr = Field(
        ...,
        description="Valid email address.",
        examples=["user@example.com"],
    )

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        pattern=r"^[a-zA-Z0-9_]+$",
        description="Username (3-50 chars, alphanumeric and underscores).",
        examples=["john_doe"],
    )

    full_name: str | None = Field(
        default=None,
        max_length=255,
        description="Optional full display name.",
        examples=["John Doe"],
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (minimum 8 characters).",
        examples=["securepassword123"],
    )


class LoginRequest(BaseModel):
    """User login request body."""

    email: EmailStr = Field(
        ...,
        description="Registered email address.",
        examples=["user@example.com"],
    )

    password: str = Field(
        ...,
        description="Account password.",
        examples=["securepassword123"],
    )


class RefreshRequest(BaseModel):
    """Token refresh request body."""

    refresh_token: str = Field(
        ...,
        description="Valid refresh token.",
    )


# ── Response Schemas ──


class UserResponse(BaseModel):
    """Public user profile information."""

    id: uuid.UUID = Field(description="User UUID.")
    email: str = Field(description="Email address.")
    username: str = Field(description="Username.")
    full_name: str | None = Field(description="Full display name.")
    is_active: bool = Field(description="Whether the account is active.")
    created_at: datetime = Field(description="Account creation timestamp.")

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Authentication response with tokens and user profile."""

    access_token: str = Field(description="JWT access token.")
    refresh_token: str = Field(description="JWT refresh token.")
    token_type: str = Field(default="bearer", description="Token type.")
    user: UserResponse = Field(description="Authenticated user profile.")
