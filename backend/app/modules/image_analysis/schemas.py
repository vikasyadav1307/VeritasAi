"""Pydantic schemas for image analysis."""

from __future__ import annotations

import uuid

from pydantic import BaseModel, Field

from app.modules.analysis.router import CredibilityResult, SentimentResult


class AnalyzeImageResponse(BaseModel):
    """Response body for image analysis endpoint."""

    id: uuid.UUID = Field(
        ...,
        description="Unique identifier for the saved analysis record.",
    )
    filename: str = Field(
        ...,
        description="Sanitized name of the uploaded image file.",
        examples=["newspaper_headline.jpg"],
    )
    content_type: str = Field(
        ...,
        description="Detected image MIME type (e.g., image/jpeg, image/png, image/webp).",
        examples=["image/jpeg"],
    )
    ocr_text: str = Field(
        ...,
        description="Cleaned, normalized text extracted from the image via OCR.",
        examples=["Government announces new education initiative for students."],
    )
    detected_language: str = Field(
        default="en",
        description="Detected ISO 639-1 language code of the extracted text.",
        examples=["en"],
    )
    character_count: int = Field(
        ...,
        ge=0,
        description="Character count of the cleaned OCR text.",
        examples=[450],
    )
    credibility: CredibilityResult
    sentiment: SentimentResult
    processing_time_ms: float = Field(
        ...,
        description="Total end-to-end pipeline execution time in milliseconds.",
        examples=[123.45],
    )
