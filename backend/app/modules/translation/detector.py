"""Language detection engine for VeritasAI using langdetect.

Adheres strictly to research guidelines:
- Never silently falls back to English when detection fails or is ambiguous.
- Returns an explicit 'unknown' state with confidence=None when text is too short,
  symbol-only, or fails feature extraction.
- Does not fabricate confidence metrics: reports the exact top probability
  returned by langdetect.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Final

import structlog
from langdetect import DetectorFactory, detect_langs
from langdetect.lang_detect_exception import LangDetectException

from app.modules.translation.languages import (
    UNKNOWN_LANGUAGE,
    get_language_name,
    normalize_language_code,
)

logger = structlog.get_logger(__name__)

# Enforce deterministic language detection across requests/threads
DetectorFactory.seed = 0

MIN_DETECTION_LENGTH: Final[int] = 10
MIN_ALPHABETIC_CHARS: Final[int] = 3
MIN_RELIABLE_CONFIDENCE: Final[float] = 0.50


@dataclass(frozen=True)
class DetectedLanguage:
    """Standardized language detection output."""

    code: str
    name: str
    confidence: float | None
    is_reliable: bool


class LanguageDetector:
    """Detects text language with strict non-fallback and validation guards."""

    @staticmethod
    def detect_language(text: str | None) -> DetectedLanguage:
        """Detect the language of the provided text.

        Args:
            text: Input text string.

        Returns:
            DetectedLanguage containing normalized ISO 639-1 code, human-readable name,
            detector probability (or None if undetermined), and reliability flag.
            Never silently falls back to English.
        """
        if not text or not isinstance(text, str):
            return DetectedLanguage(
                code=UNKNOWN_LANGUAGE.code,
                name=UNKNOWN_LANGUAGE.name,
                confidence=None,
                is_reliable=False,
            )

        stripped = text.strip()

        # Guard: Check character count and alphabetic character density
        if len(stripped) < MIN_DETECTION_LENGTH:
            return DetectedLanguage(
                code=UNKNOWN_LANGUAGE.code,
                name=UNKNOWN_LANGUAGE.name,
                confidence=None,
                is_reliable=False,
            )

        # Ensure text has actual alphabetic or unicode word characters (not purely punctuation/digits)
        alphabetic_count = len(re.findall(r"[\w]", stripped, re.UNICODE))
        if alphabetic_count < MIN_ALPHABETIC_CHARS:
            return DetectedLanguage(
                code=UNKNOWN_LANGUAGE.code,
                name=UNKNOWN_LANGUAGE.name,
                confidence=None,
                is_reliable=False,
            )

        try:
            candidates = detect_langs(stripped)
            if not candidates:
                return DetectedLanguage(
                    code=UNKNOWN_LANGUAGE.code,
                    name=UNKNOWN_LANGUAGE.name,
                    confidence=None,
                    is_reliable=False,
                )

            top = candidates[0]
            prob = round(float(top.prob), 4)

            # If top probability is below reliability threshold, report as undetermined
            if prob < MIN_RELIABLE_CONFIDENCE:
                logger.debug(
                    "language_detection_ambiguous",
                    top_code=top.lang,
                    confidence=prob,
                )
                return DetectedLanguage(
                    code=UNKNOWN_LANGUAGE.code,
                    name=UNKNOWN_LANGUAGE.name,
                    confidence=prob,
                    is_reliable=False,
                )

            normalized_code = normalize_language_code(top.lang)
            language_name = get_language_name(normalized_code)

            return DetectedLanguage(
                code=normalized_code,
                name=language_name,
                confidence=prob,
                is_reliable=True,
            )

        except LangDetectException as lde:
            # Langdetect failed (e.g. no feature tokens in text)
            logger.debug("langdetect_no_features", error=str(lde))
            return DetectedLanguage(
                code=UNKNOWN_LANGUAGE.code,
                name=UNKNOWN_LANGUAGE.name,
                confidence=None,
                is_reliable=False,
            )
        except Exception as exc:
            logger.warning("language_detection_unexpected_error", error=str(exc))
            return DetectedLanguage(
                code=UNKNOWN_LANGUAGE.code,
                name=UNKNOWN_LANGUAGE.name,
                confidence=None,
                is_reliable=False,
            )
