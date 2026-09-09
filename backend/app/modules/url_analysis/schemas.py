"""Pydantic V2 schemas for URL analysis."""

from __future__ import annotations

import uuid
from pydantic import BaseModel, Field

from app.modules.analysis.router import CredibilityResult, SentimentResult


class AnalyzeUrlRequest(BaseModel):
    """Request body for public article URL analysis."""

    url: str = Field(
        ...,
        min_length=10,
        max_length=2048,
        description="The public HTTP or HTTPS URL of the news article to analyze.",
        examples=["https://example.com/news/article-123"],
    )


class AnalyzeUrlResponse(BaseModel):
    """Response body for article URL analysis."""

    id: uuid.UUID = Field(
        ...,
        description="Unique identifier for the saved analysis record.",
    )
    source_url: str = Field(
        ...,
        description="The original user-submitted article URL.",
        examples=["https://example.com/news/article-123"],
    )
    final_url: str | None = Field(
        default=None,
        description="The final destination URL after redirects or canonical link.",
        examples=["https://example.com/news/article-123"],
    )
    extracted_title: str | None = Field(
        default=None,
        description="The extracted title of the article, if available.",
        examples=["Scientists Discover Renewable Breakthrough"],
    )
    detected_language: str = Field(
        default="en",
        description="Detected ISO 639-1 language code of the extracted article.",
        examples=["en"],
    )
    character_count: int = Field(
        ...,
        ge=0,
        description="Character count of the cleaned extracted article body.",
        examples=[1450],
    )
    credibility: CredibilityResult
    sentiment: SentimentResult
    processing_time_ms: float = Field(
        ...,
        description="Total end-to-end pipeline execution time in milliseconds.",
        examples=[45.2],
    )
