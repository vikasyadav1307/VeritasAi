"""Dashboard router — real-time analytics and metrics computed from database.

Provides summary metrics, credibility/sentiment distributions, telemetry,
and recent analyses directly from non-deleted AnalysisResult records.
"""

from __future__ import annotations

import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.analysis import AnalysisResult
from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.history.router import HistoryItem

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


# ── Response Schemas ──


class CredibilityDistribution(BaseModel):
    """Counts and percentages for credibility predictions."""

    real_count: int = Field(ge=0, description="Total verified real analyses")
    fake_count: int = Field(ge=0, description="Total fake news detected")
    real_percentage: float = Field(ge=0.0, le=100.0, description="Percentage of real analyses")
    fake_percentage: float = Field(ge=0.0, le=100.0, description="Percentage of fake analyses")


class SentimentDistribution(BaseModel):
    """Counts and percentages for sentiment predictions."""

    positive_count: int = Field(ge=0, description="Total positive sentiment analyses")
    negative_count: int = Field(ge=0, description="Total negative sentiment analyses")
    neutral_count: int = Field(ge=0, description="Total neutral sentiment analyses")
    positive_percentage: float = Field(ge=0.0, le=100.0, description="Percentage positive")
    negative_percentage: float = Field(ge=0.0, le=100.0, description="Percentage negative")
    neutral_percentage: float = Field(ge=0.0, le=100.0, description="Percentage neutral")


class LanguageCount(BaseModel):
    """Count and percentage for a specific detected language."""

    language: str = Field(description="Language code (e.g., 'en', 'hi', 'auto')")
    count: int = Field(ge=0, description="Number of analyses in this language")
    percentage: float = Field(ge=0.0, le=100.0, description="Percentage of total analyses")


class DashboardSummary(BaseModel):
    """Comprehensive dashboard statistics and recent activity."""

    total_analyses: int = Field(ge=0, description="Total active non-deleted analyses")
    credibility_distribution: CredibilityDistribution
    sentiment_distribution: SentimentDistribution
    average_confidence: float = Field(ge=0.0, le=100.0, description="Mean prediction confidence %")
    average_processing_time_ms: float = Field(ge=0.0, description="Mean inference time in ms")
    language_distribution: list[LanguageCount]
    recent_analyses: list[HistoryItem]


# ── Endpoints ──


@router.get(
    "/summary",
    response_model=DashboardSummary,
    status_code=status.HTTP_200_OK,
    summary="Get analytics dashboard summary",
    responses={
        401: {"description": "Not authenticated"},
    },
)
async def get_dashboard_summary(
    user_id: Optional[uuid.UUID] = Query(
        default=None,
        description="Deprecated/ignored — analytics are strictly scoped to authenticated user",
    ),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    """Compute and return aggregate statistics from non-deleted analysis records.

    Strictly scoped to the authenticated user (IDOR prevention).
    Client-supplied user_id parameters are never used to view other users' data.
    """

    # Base filter: strictly exclude soft-deleted records and scope to current_user
    base_filter = [
        AnalysisResult.deleted_at.is_(None),
        AnalysisResult.user_id == current_user.id,
    ]

    # 1. Total count, average confidence, and average processing time
    agg_query = (
        select(
            func.count(AnalysisResult.id).label("total"),
            func.coalesce(func.avg(AnalysisResult.confidence), 0.0).label("avg_confidence"),
            func.coalesce(func.avg(AnalysisResult.processing_time_ms), 0.0).label("avg_processing_time"),
        )
        .where(*base_filter)
    )
    agg_res = await db.execute(agg_query)
    agg_row = agg_res.one()

    total: int = agg_row.total or 0
    # Average confidence stored as 0.0-1.0; format as percentage 0.0-100.0
    avg_confidence: float = round(float(agg_row.avg_confidence or 0.0) * 100.0, 1)
    avg_processing_time_ms: float = round(float(agg_row.avg_processing_time or 0.0), 1)

    # 2. Credibility breakdown
    cred_query = (
        select(
            AnalysisResult.credibility_label,
            func.count(AnalysisResult.id).label("cnt"),
        )
        .where(*base_filter)
        .group_by(AnalysisResult.credibility_label)
    )
    cred_res = await db.execute(cred_query)
    cred_counts = {row.credibility_label.capitalize(): row.cnt for row in cred_res.all()}

    real_count = cred_counts.get("Real", 0)
    fake_count = cred_counts.get("Fake", 0)
    real_pct = round((real_count / total * 100.0), 1) if total > 0 else 0.0
    fake_pct = round((fake_count / total * 100.0), 1) if total > 0 else 0.0

    cred_dist = CredibilityDistribution(
        real_count=real_count,
        fake_count=fake_count,
        real_percentage=real_pct,
        fake_percentage=fake_pct,
    )

    # 3. Sentiment breakdown
    sent_query = (
        select(
            AnalysisResult.sentiment_label,
            func.count(AnalysisResult.id).label("cnt"),
        )
        .where(*base_filter)
        .group_by(AnalysisResult.sentiment_label)
    )
    sent_res = await db.execute(sent_query)
    sent_counts = {row.sentiment_label.capitalize(): row.cnt for row in sent_res.all()}

    pos_count = sent_counts.get("Positive", 0)
    neg_count = sent_counts.get("Negative", 0)
    neu_count = sent_counts.get("Neutral", 0)

    pos_pct = round((pos_count / total * 100.0), 1) if total > 0 else 0.0
    neg_pct = round((neg_count / total * 100.0), 1) if total > 0 else 0.0
    neu_pct = round((neu_count / total * 100.0), 1) if total > 0 else 0.0

    sent_dist = SentimentDistribution(
        positive_count=pos_count,
        negative_count=neg_count,
        neutral_count=neu_count,
        positive_percentage=pos_pct,
        negative_percentage=neg_pct,
        neutral_percentage=neu_pct,
    )

    # 4. Language distribution (top 5)
    lang_query = (
        select(
            AnalysisResult.detected_language,
            func.count(AnalysisResult.id).label("cnt"),
        )
        .where(*base_filter)
        .group_by(AnalysisResult.detected_language)
        .order_by(func.count(AnalysisResult.id).desc())
        .limit(5)
    )
    lang_res = await db.execute(lang_query)
    lang_dist = [
        LanguageCount(
            language=row.detected_language,
            count=row.cnt,
            percentage=round((row.cnt / total * 100.0), 1) if total > 0 else 0.0,
        )
        for row in lang_res.all()
    ]

    # 5. Recent analyses (latest 5)
    recent_query = (
        select(AnalysisResult)
        .where(*base_filter)
        .order_by(AnalysisResult.created_at.desc())
        .limit(5)
    )
    recent_res = await db.execute(recent_query)
    recent_records = recent_res.scalars().all()

    logger.info(
        "dashboard_summary_computed",
        total_analyses=total,
        real_count=real_count,
        fake_count=fake_count,
    )

    return DashboardSummary(
        total_analyses=total,
        credibility_distribution=cred_dist,
        sentiment_distribution=sent_dist,
        average_confidence=avg_confidence,
        average_processing_time_ms=avg_processing_time_ms,
        language_distribution=lang_dist,
        recent_analyses=[HistoryItem.model_validate(r) for r in recent_records],
    )
