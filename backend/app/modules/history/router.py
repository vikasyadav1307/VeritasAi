"""History router — retrieve, inspect, and manage past analyses.

Provides paginated listing, single-item inspection, and soft-delete endpoints.
See 05_API_SPECIFICATION.md §5.11–5.13 for endpoint specifications.
"""

from __future__ import annotations

import math
import uuid
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.analysis import AnalysisResult
from app.models.user import User
from app.modules.auth.dependencies import get_current_user

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/history", tags=["History"])


# ── Schemas ──


class HistoryItem(BaseModel):
    """Public representation of an analysis history record."""

    id: uuid.UUID
    user_id: uuid.UUID | None = None
    input_type: str
    original_text: str
    source_url: str | None = None
    title: str | None = None
    detected_language: str
    credibility_label: str
    credibility_score: float
    sentiment_label: str
    sentiment_score: float
    confidence: float
    processing_time_ms: float
    is_mock: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedHistoryResponse(BaseModel):
    """Paginated list of history items with metadata."""

    items: list[HistoryItem] = Field(default_factory=list)
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    per_page: int = Field(ge=1)
    total_pages: int = Field(ge=0)


# ── Endpoints ──


@router.get(
    "",
    response_model=PaginatedHistoryResponse,
    status_code=status.HTTP_200_OK,
    summary="List analysis history",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def list_history(
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    per_page: int = Query(default=10, ge=1, le=100, description="Items per page"),
    credibility: str | None = Query(default=None, description="Filter by credibility label"),
    sentiment: str | None = Query(default=None, description="Filter by sentiment label"),
    search: str | None = Query(default=None, description="Search text content"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> PaginatedHistoryResponse:
    """Retrieve a paginated list of past analyses ordered by creation time."""

    # Base query: strictly exclude soft-deleted records and scope to current user
    base_filter = [
        AnalysisResult.deleted_at.is_(None),
        AnalysisResult.user_id == current_user.id,
    ]

    if credibility:
        base_filter.append(AnalysisResult.credibility_label.ilike(credibility))
    if sentiment:
        base_filter.append(AnalysisResult.sentiment_label.ilike(sentiment))
    if search:
        base_filter.append(AnalysisResult.original_text.ilike(f"%{search}%"))

    # Total count query
    count_query = select(func.count(AnalysisResult.id)).where(*base_filter)
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginated data query
    offset = (page - 1) * per_page
    data_query = (
        select(AnalysisResult)
        .where(*base_filter)
        .order_by(AnalysisResult.created_at.desc())
        .offset(offset)
        .limit(per_page)
    )
    items_result = await db.execute(data_query)
    records = items_result.scalars().all()

    total_pages = math.ceil(total / per_page) if total > 0 else 0

    return PaginatedHistoryResponse(
        items=[HistoryItem.model_validate(r) for r in records],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
    )


@router.get(
    "/{analysis_id}",
    response_model=HistoryItem,
    status_code=status.HTTP_200_OK,
    summary="Get single analysis details",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied — analysis belongs to another user"},
        404: {"description": "Analysis record not found"},
    },
)
async def get_history_item(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> HistoryItem:
    """Retrieve full details of a specific analysis record."""

    query = select(AnalysisResult).where(
        AnalysisResult.id == analysis_id,
        AnalysisResult.deleted_at.is_(None),
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )

    # Ownership check — prevent IDOR
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to view this analysis record.",
        )

    return HistoryItem.model_validate(record)


@router.delete(
    "/{analysis_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete analysis record",
    responses={
        401: {"description": "Not authenticated"},
        403: {"description": "Access denied — analysis belongs to another user"},
        404: {"description": "Analysis record not found"},
    },
)
async def delete_history_item(
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> None:
    """Soft-delete an analysis record."""

    query = select(AnalysisResult).where(
        AnalysisResult.id == analysis_id,
        AnalysisResult.deleted_at.is_(None),
    )
    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )

    # Ownership check — prevent IDOR
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You do not have permission to delete this analysis record.",
        )

    record.deleted_at = func.now()
    await db.flush()

    logger.info(
        "analysis_record_deleted",
        analysis_id=str(analysis_id),
        user_id=str(current_user.id),
    )
