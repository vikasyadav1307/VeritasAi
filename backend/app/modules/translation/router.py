"""Translation router — language catalog and on-demand translation endpoints."""

from __future__ import annotations

import structlog
from fastapi import APIRouter, Depends, HTTPException, status

from app.models.user import User
from app.modules.auth.dependencies import get_current_user
from app.modules.translation.languages import get_supported_languages_list
from app.modules.translation.schemas import (
    LanguagesResponse,
    SupportedLanguageItem,
    TranslateRequest,
    TranslateResponse,
)
from app.modules.translation.services import (
    TranslationService,
    TranslationUnavailableError,
    UnsupportedLanguageError,
)

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["Translation"])

# Service singleton
_translation_service = TranslationService()


@router.get(
    "/languages",
    response_model=LanguagesResponse,
    status_code=status.HTTP_200_OK,
    summary="Get list of supported languages",
)
async def get_supported_languages() -> LanguagesResponse:
    """Return the catalog of supported languages with ISO codes and native script names."""
    catalog = get_supported_languages_list()
    languages = [
        SupportedLanguageItem(
            code=item.code,
            name=item.name,
            native_name=item.native_name,
            is_rtl=item.is_rtl,
            is_supported_for_analysis=True,
            is_verified_translation=True,
        )
        for item in catalog
    ]
    return LanguagesResponse(
        languages=languages,
        total_supported=len(languages),
        default_target="en",
    )


@router.post(
    "/translate",
    response_model=TranslateResponse,
    status_code=status.HTTP_200_OK,
    summary="Translate text for presentation display",
    responses={
        400: {"description": "Unsupported or invalid language code"},
        401: {"description": "Authentication required"},
        422: {"description": "Validation error (text too short or long)"},
        503: {"description": "Translation provider unavailable or rate-limited"},
    },
)
async def translate_text(
    request: TranslateRequest,
    current_user: User = Depends(get_current_user),
) -> TranslateResponse:
    """Translate text on demand for presentation.

    Translation is decoupled from AI model inference: credibility, sentiment,
    and token attribution are always calculated on the original text.
    """
    logger.info(
        "translation_requested",
        user_id=str(current_user.id),
        source_lang=request.source_language,
        target_lang=request.target_language,
        text_length=len(request.text),
    )

    try:
        response = await _translation_service.translate(
            text=request.text,
            source_language=request.source_language,
            target_language=request.target_language,
        )
        return response

    except UnsupportedLanguageError as ule:
        logger.info("translation_unsupported_language", error=str(ule))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ule),
        ) from ule

    except TranslationUnavailableError as tue:
        logger.warning("translation_unavailable", error=str(tue))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Translation service is temporarily unavailable. Please try again later.",
        ) from tue

    except Exception as exc:
        logger.error("translation_unexpected_failure", error=str(exc))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred during translation.",
        ) from exc
