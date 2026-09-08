"""Analysis results database model.

Stores every text, URL, or image analysis performed by VeritasAI.
See 04_DATABASE_DESIGN.md §3.2 for schema specifications.
"""

from __future__ import annotations

import uuid

from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import (
    Base,
    SoftDeleteMixin,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
)


class AnalysisResult(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Stores a single completed analysis record."""

    __tablename__ = "analysis_results"

    # User association (nullable for anonymous / pre-auth analyses)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True,
    )

    # Input details
    input_type: Mapped[str] = mapped_column(
        String(20),
        default="text",
        nullable=False,
        index=True,
    )
    original_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    cleaned_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    detected_language: Mapped[str] = mapped_column(
        String(10),
        default="auto",
        nullable=False,
        index=True,
    )

    # Credibility prediction
    credibility_label: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    credibility_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # Sentiment prediction
    sentiment_label: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
    )
    sentiment_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )

    # Overall confidence & telemetry
    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    processing_time_ms: Mapped[float] = mapped_column(
        Float,
        nullable=False,
    )
    is_mock: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
