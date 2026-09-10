"""Explainability router — on-demand model token attribution endpoint."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.explainability.schemas import ExplainRequest, ExplainResponse
from app.modules.explainability.services import ExplainabilityService

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/explain", tags=["Explainability"])

_explainability_service = ExplainabilityService()


@router.post(
    "/text",
    response_model=ExplainResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute gradient-based token attribution estimates for text",
    responses={
        400: {"description": "Invalid input text or processing failure"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error (text too short or too long)"},
        500: {"description": "Internal explainability computation failure"},
    },
)
async def explain_text(
    request: ExplainRequest,
    current_user: User = Depends(get_current_user),
) -> ExplainResponse:
    """Generate model-attribution explanations for credibility and sentiment predictions.

    Uses gradient-based input attribution (Gradient × Input) targeting the
    predicted class logit for both XLM-RoBERTa models. Returns top influential
    words with normalized importance scores and direction (supporting vs opposing).

    Operates on actual analyzed text (direct text, extracted article text, or OCR text).
    """
    logger.info(
        "explain_text_requested",
        user_id=str(current_user.id),
        text_length=len(request.text),
    )

    try:
        response = _explainability_service.explain_text(request.text)
        return response

    except Exception as exc:
        logger.error(
            "explain_text_unexpected_failure",
            user_id=str(current_user.id),
            error=str(exc),
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate model explanation. Please try again.",
        ) from exc
