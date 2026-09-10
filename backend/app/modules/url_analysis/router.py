"""URL analysis router — safe article URL ingestion and inference endpoint."""

from __future__ import annotations

import time
import uuid

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session import get_db_session
from app.models.analysis import AnalysisResult
from app.models.user import User
from app.modules.analysis.router import CredibilityResult, SentimentResult
from app.modules.auth.dependencies import get_current_user
from app.modules.url_analysis.schemas import AnalyzeUrlRequest, AnalyzeUrlResponse
from app.modules.url_analysis.security import (
    SSRFSecurityError,
    UrlResolutionError,
    UrlValidationError,
)
from app.modules.url_analysis.services import (
    ArticleExtractionError,
    FetchError,
    ResponseTooLargeError,
    UnsupportedContentTypeError,
    UpstreamHttpError,
    UrlAnalysisService,
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/analyze", tags=["Analysis"])

_url_analysis_service = UrlAnalysisService()


@router.post(
    "/url",
    response_model=AnalyzeUrlResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze public article URL for fake news and sentiment",
    responses={
        400: {"description": "Invalid URL destination, SSRF rejection, or fetch error"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation or article extraction failure"},
        500: {"description": "Internal analysis failure"},
    },
)
async def analyze_url(
    request: AnalyzeUrlRequest,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_user),
) -> AnalyzeUrlResponse:
    """Analyze a public news article URL for credibility and sentiment.

    Safely fetches the remote web page with multi-layer SSRF protection,
    extracts main article body text and metadata, runs fake news detection
    and sentiment analysis models, and persists the record to the authenticated
    user's history.
    """
    start_time = time.perf_counter()

    logger.info(
        "url_analysis_requested",
        user_id=str(current_user.id),
        url=request.url[:100],  # Log prefix to prevent huge logs
    )

    try:
        results = await _url_analysis_service.analyze_url(request.url)

    except UrlValidationError as exc:
        logger.warning("url_validation_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    except SSRFSecurityError as exc:
        logger.warning("url_ssrf_blocked", url=request.url[:100], error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This URL cannot be accessed for security reasons.",
        ) from exc

    except UrlResolutionError as exc:
        logger.info("url_resolution_failed", url=request.url[:100])
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The webpage could not be reached.",
        ) from exc

    except UnsupportedContentTypeError as exc:
        logger.info("url_unsupported_content_type", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The webpage is not an HTML document.",
        ) from exc

    except ResponseTooLargeError as exc:
        logger.info("url_response_too_large", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The webpage is too large to analyze.",
        ) from exc

    except ArticleExtractionError as exc:
        logger.info("article_extraction_failed", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract readable article content from this URL.",
        ) from exc

    except UpstreamHttpError as exc:
        logger.warning(
            "url_upstream_http_error",
            status_code=exc.status_code,
            error=str(exc),
        )
        if exc.status_code in (401, 403):
            detail = "This website does not allow automated article access."
        elif exc.status_code == 404:
            detail = "The requested webpage was not found."
        elif 500 <= exc.status_code < 600:
            detail = "The website is temporarily unavailable."
        else:
            detail = "The webpage could not be reached."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        ) from exc

    except FetchError as exc:
        logger.warning("url_fetch_failed", error=str(exc))
        status_code = getattr(exc, "status_code", None)
        if status_code in (401, 403):
            detail = "This website does not allow automated article access."
        elif status_code == 404:
            detail = "The requested webpage was not found."
        elif status_code is not None and 500 <= status_code < 600:
            detail = "The website is temporarily unavailable."
        else:
            detail = "The webpage could not be reached."
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        ) from exc

    except Exception as exc:
        logger.error(
            "url_analysis_unexpected_failure",
            error=str(exc),
            url=request.url[:100],
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Article analysis failed. Please try another URL.",
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
            input_type="url",
            source_url=results["source_url"],
            title=results["title"],
            original_text=results["extracted_text"],
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
            "url_analysis_saved",
            analysis_id=str(record_id),
            user_id=str(current_user.id),
            processing_time_ms=elapsed_ms,
        )

    except Exception as db_exc:
        await db.rollback()
        logger.warning(
            "url_analysis_db_save_failed",
            error=str(db_exc),
            analysis_id=str(record_id),
        )

    return AnalyzeUrlResponse(
        id=record_id,
        source_url=results["source_url"],
        final_url=results["final_url"],
        extracted_title=results["title"],
        extracted_text=results.get("extracted_text"),
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
