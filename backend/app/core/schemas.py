"""Shared Pydantic schemas for the standard API response envelope.

All API responses use these wrappers to ensure consistent structure.
See 05_API_SPECIFICATION.md §2 for the full specification.
"""

from datetime import datetime
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseMeta(BaseModel):
    """Metadata included in every API response."""

    request_id: str = Field(description="Unique request identifier for tracing")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp (UTC)")
    processing_time_ms: int | None = Field(default=None, description="Server processing time in milliseconds")


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response envelope."""

    success: bool = Field(default=True, description="Whether the request was successful")
    data: T = Field(description="Response payload")
    meta: ResponseMeta = Field(description="Response metadata")


class ErrorDetail(BaseModel):
    """Structured error information."""

    code: str = Field(description="Machine-readable error code")
    message: str = Field(description="Human-readable error message")
    details: dict[str, Any] = Field(default_factory=dict, description="Additional error context")


class ErrorResponse(BaseModel):
    """Standard error response envelope."""

    success: bool = Field(default=False, description="Always false for error responses")
    error: ErrorDetail = Field(description="Error details")
    meta: ResponseMeta = Field(description="Response metadata")


class PaginationMeta(BaseModel):
    """Pagination metadata for list endpoints."""

    total: int = Field(description="Total number of items")
    page: int = Field(description="Current page number")
    per_page: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether a next page exists")
    has_prev: bool = Field(description="Whether a previous page exists")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response envelope."""

    success: bool = Field(default=True)
    data: list[T] = Field(description="List of items for the current page")
    pagination: PaginationMeta = Field(description="Pagination metadata")
    meta: ResponseMeta = Field(description="Response metadata")


class HealthResponse(BaseModel):
    """Response for the shallow health check."""

    status: str = Field(description="Service status")
    version: str = Field(description="Application version")


class HealthCheckDetail(BaseModel):
    """Health status for a single dependency."""

    status: str = Field(description="up | down")
    latency_ms: float | None = Field(default=None, description="Latency in milliseconds")
    error: str | None = Field(default=None, description="Error message if unhealthy")


class ReadinessResponse(BaseModel):
    """Response for the deep readiness check."""

    status: str = Field(description="ready | not_ready")
    checks: dict[str, HealthCheckDetail] = Field(description="Dependency health checks")
