"""Image analysis router — OCR text extraction and AI inference endpoint."""

from __future__ import annotations

import time
import uuid

import structlog
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.analysis import AnalysisResult
from app.models.user import User
from app.modules.analysis.router import CredibilityResult, SentimentResult
from app.modules.auth.dependencies import get_current_user
from app.modules.image_analysis.schemas import AnalyzeImageResponse
from app.modules.image_analysis.security import (
    DecompressionBombSecurityError,
    ImageSecurityError,
    ImageTooLargeError,
    ImageValidationError,
    MalformedImageError,
    UnsupportedImageFormatError,
)
from app.modules.image_analysis.services import (
    ImageAnalysisService,
    InsufficientOcrTextError,
    OcrError,
    OcrUnavailableError,
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

_image_analysis_service = ImageAnalysisService()


@router.post(
    "/image",
    response_model=AnalyzeImageResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze uploaded image text via OCR for fake news and sentiment",
    responses={
        400: {"description": "Invalid, oversized, or unsupported image upload"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation or insufficient readable OCR text"},
        503: {"description": "OCR engine temporarily unavailable"},
        500: {"description": "Internal image analysis failure"},
    },
)
async def analyze_image(
    file: UploadFile = File(..., description="Uploaded image file (JPEG, PNG, or WEBP, max 10MB)"),
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> AnalyzeImageResponse:
    """Extract text from an uploaded image using OCR and analyze credibility and sentiment.

    Performs strict in-memory security validation, preprocessing, OCR text extraction,
    and runs multilingual XLM-RoBERTa models. Results are persisted to the authenticated
    user's analysis history.
    """
    start_time = time.perf_counter()

    logger.info(
        "image_analysis_requested",
        user_id=str(current_user.id),
        filename=file.filename,
        content_type=file.content_type,
    )

    try:
        results = await _image_analysis_service.analyze_image(
            file_stream=file.file,
            filename=file.filename,
            content_type=file.content_type,
        )

    except (ImageTooLargeError, DecompressionBombSecurityError) as exc:
        logger.warning("image_size_rejection", error=str(exc), filename=file.filename)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=str(exc),
        ) from exc

    except (UnsupportedImageFormatError, MalformedImageError) as exc:
        logger.warning("image_format_rejection", error=str(exc), filename=file.filename)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    except (ImageValidationError, InsufficientOcrTextError) as exc:
        logger.info("image_validation_rejection", error=str(exc), filename=file.filename)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except OcrUnavailableError as exc:
        logger.warning("ocr_engine_unavailable", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Image text extraction is temporarily unavailable.",
        ) from exc

    except Exception as exc:
        logger.error(
            "image_analysis_unexpected_failure",
            error=str(exc),
            filename=file.filename,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Image analysis failed. Please try another image.",
        ) from exc

    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    record_id = uuid.uuid4()

    # ── Persist to Database ──
    try:
        avg_confidence = round(
            (
                results["credibility"]["confidence"]
                + results["sentiment"]["confidence"]
            )
            / 2,
            4,
        )

        record = AnalysisResult(
            id=record_id,
            user_id=current_user.id,
            input_type="image",
            source_url=None,
            title=results["filename"],
            original_text=results["ocr_text"],
            cleaned_text=results["ocr_text"],
            detected_language=results["detected_language"],
            credibility_label=results["credibility"]["label"],
            credibility_score=results["credibility"]["confidence"],
            sentiment_label=results["sentiment"]["label"],
            sentiment_score=results["sentiment"]["confidence"],
            confidence=avg_confidence,
            processing_time_ms=elapsed_ms,
            is_mock=results["credibility"]["is_mock"]
            or results["sentiment"]["is_mock"],
        )
        db.add(record)
        await db.flush()

        logger.info(
            "image_analysis_saved",
            analysis_id=str(record_id),
            user_id=str(current_user.id),
            processing_time_ms=elapsed_ms,
        )

    except Exception as db_exc:
        await db.rollback()
        logger.warning(
            "image_analysis_db_save_failed",
            error=str(db_exc),
            analysis_id=str(record_id),
        )

    return AnalyzeImageResponse(
        id=record_id,
        filename=results["filename"],
        content_type=results["content_type"],
        ocr_text=results["ocr_text"],
        detected_language=results["detected_language"],
        character_count=results["character_count"],
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
