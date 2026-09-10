"""Analysis router — text analysis endpoint.

Accepts text input and returns credibility (fake/real) and
sentiment analysis results.
"""

from __future__ import annotations

import time
import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.analysis import AnalysisResult
from app.models.user import User
from app.modules.analysis.services import AnalysisService
from app.modules.auth.dependencies import get_optional_user
from app.modules.translation.detector import LanguageDetector
from app.modules.translation.languages import get_language_name

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

    id: uuid.UUID = Field(
        ...,
        description="Unique identifier for the analysis record.",
    )

    credibility: CredibilityResult

    sentiment: SentimentResult

    detected_language: str = Field(
        default="unknown",
        description="Detected ISO 639-1 language code of the text.",
        examples=["en", "hi", "unknown"],
    )

    language_name: str = Field(
        default="Unknown / Undetermined",
        description="Human-readable language name.",
        examples=["English", "Hindi", "Unknown / Undetermined"],
    )

    language_confidence: float | None = Field(
        default=None,
        description="Detector probability (0.0–1.0) or None if undetermined.",
        examples=[0.9999],
    )

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
async def analyze_text(
    request: AnalyzeRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User | None = Depends(get_optional_user),
) -> AnalyzeResponse:
    """Analyze text for credibility and sentiment.

    Runs the input text through both the fake news detection model
    and the sentiment analysis model, saves the result to the database,
    and returns combined results with a unique analysis ID.
    """

    start_time = time.perf_counter()

    # ── Language Detection (Executed on original text; never replaces inference input) ──
    if request.language.lower() == "auto":
        detected = LanguageDetector.detect_language(request.text)
        detected_lang_code = detected.code
        detected_lang_name = detected.name
        detected_lang_conf = detected.confidence
    else:
        detected_lang_code = request.language.lower()
        detected_lang_name = get_language_name(detected_lang_code)
        detected_lang_conf = 1.0

    logger.info(
        "analysis_request_received",
        text_length=len(request.text),
        language=request.language,
        detected_language=detected_lang_code,
        language_confidence=detected_lang_conf,
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

    # ── Persist to Database ──
    record_id = uuid.uuid4()
    try:
        avg_confidence = round(
            (results["credibility"]["confidence"] + results["sentiment"]["confidence"]) / 2,
            4,
        )
        record = AnalysisResult(
            id=record_id,
            user_id=current_user.id if current_user else None,
            input_type="text",
            original_text=request.text,
            detected_language=detected_lang_code,
            credibility_label=results["credibility"]["label"],
            credibility_score=results["credibility"]["confidence"],
            sentiment_label=results["sentiment"]["label"],
            sentiment_score=results["sentiment"]["confidence"],
            confidence=avg_confidence,
            processing_time_ms=elapsed_ms,
            is_mock=results["credibility"]["is_mock"] or results["sentiment"]["is_mock"],
        )
        db.add(record)
        await db.flush()

        logger.info(
            "analysis_saved",
            analysis_id=str(record_id),
            processing_time_ms=elapsed_ms,
        )

    except Exception as db_exc:
        await db.rollback()
        logger.warning(
            "analysis_db_save_failed",
            error=str(db_exc),
            analysis_id=str(record_id),
        )

    logger.info(
        "analysis_complete",
        analysis_id=str(record_id),
        credibility_label=results["credibility"]["label"],
        sentiment_label=results["sentiment"]["label"],
        processing_time_ms=elapsed_ms,
    )

    return AnalyzeResponse(
        id=record_id,
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
        detected_language=detected_lang_code,
        language_name=detected_lang_name,
        language_confidence=detected_lang_conf,
        processing_time_ms=elapsed_ms,
    )