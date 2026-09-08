"""Analysis router — text analysis endpoint.

Accepts text input and returns credibility (fake/real) and
sentiment analysis results.
"""

from __future__ import annotations

import time

import structlog
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.modules.analysis.services import AnalysisService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])


# ── Request / Response Schemas ──


class AnalyzeRequest(BaseModel):
    """Request body for text analysis."""

    text: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="The text to analyze (10–50,000 characters).",
        examples=[
            "Breaking news: Scientists discover new method "
            "for detecting misinformation."
        ],
    )

    language: str = Field(
        default="auto",
        description=(
            "ISO 639-1 language code, or 'auto' "
            "for automatic language detection."
        ),
        examples=["auto", "en", "hi"],
    )


class CredibilityResult(BaseModel):
    """Fake news detection result."""

    label: str = Field(
        ...,
        description="Classification label: 'Fake' or 'Real'.",
        examples=["Real"],
    )

    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score (0.0–1.0).",
        examples=[0.95],
    )

    is_mock: bool = Field(
        default=False,
        description=(
            "True if the result comes from the mock fallback model."
        ),
    )


class SentimentResult(BaseModel):
    """Sentiment analysis result."""

    label: str = Field(
        ...,
        description=(
            "Sentiment label: 'Positive', 'Negative', or 'Neutral'."
        ),
        examples=["Negative"],
    )

    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score (0.0–1.0).",
        examples=[0.88],
    )

    is_mock: bool = Field(
        default=False,
        description=(
            "True if the result comes from the mock fallback model."
        ),
    )


class AnalyzeResponse(BaseModel):
    """Response body for text analysis."""

    credibility: CredibilityResult

    sentiment: SentimentResult

    processing_time_ms: float = Field(
        ...,
        description="Total processing time in milliseconds.",
        examples=[42.5],
    )


class ErrorDetail(BaseModel):
    """Structured error response."""

    detail: str
    error_code: str


# ── Service singleton ──

_analysis_service = AnalysisService()


# ── Endpoints ──


@router.post(
    "/text",
    response_model=AnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze text for fake news and sentiment",
    responses={
        422: {
            "description": "Validation error (text too short/long)"
        },
        500: {
            "description": "Internal analysis error"
        },
    },
)
async def analyze_text(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analyze text for credibility and sentiment.

    Runs the input text through both the fake news detection model
    and the sentiment analysis model, returning combined results.
    """

    start_time = time.perf_counter()

    logger.info(
        "analysis_request_received",
        text_length=len(request.text),
        language=request.language,
    )

    try:
        results = await _analysis_service.analyze_text(
            request.text
        )

    except Exception as exc:
        logger.error(
            "analysis_failed",
            error=str(exc),
            text_length=len(request.text),
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed. Please try again.",
        ) from exc

    elapsed_ms = round(
        (time.perf_counter() - start_time) * 1000,
        2,
    )

    logger.info(
        "analysis_complete",
        credibility_label=results["credibility"]["label"],
        sentiment_label=results["sentiment"]["label"],
        processing_time_ms=elapsed_ms,
    )

    return AnalyzeResponse(
        credibility=CredibilityResult(
            label=results["credibility"]["label"],
            confidence=results["credibility"]["confidence"],
            is_mock=results["credibility"]["is_mock"],
        ),
        sentiment=SentimentResult(
            label=results["sentiment"]["label"],
            confidence=results["sentiment"]["confidence"],
            is_mock=results["sentiment"]["is_mock"],
        ),
        processing_time_ms=elapsed_ms,
    )