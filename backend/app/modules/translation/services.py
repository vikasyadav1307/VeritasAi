"""Translation services — presentation-only translation abstraction.

Provides a pluggable translation architecture with MyMemory as the default
external provider and a deterministic mock provider for testing and offline modes.

CRITICAL INTEGRITY RULES:
- Translation is strictly for display/presentation; model inference and
  explainability always run on the original analyzed text.
- Full user text is never logged to maintain privacy.
- External translation failures degrade gracefully to HTTP 503.
"""

from __future__ import annotations

import html
import time
from typing import Protocol

import httpx
import structlog

from app.modules.translation.detector import LanguageDetector
from app.modules.translation.languages import (
    get_language_name,
    is_supported_language,
    normalize_language_code,
)
from app.modules.translation.schemas import TranslateResponse

logger = structlog.get_logger(__name__)

MYMEMORY_API_URL = "https://api.mymemory.translated.net/get"
MAX_CHUNK_LENGTH = 450
HTTP_TIMEOUT_SECONDS = 10.0


class TranslationError(Exception):
    """Base exception for translation failures."""


class UnsupportedLanguageError(TranslationError):
    """Raised when source or target language is not supported."""


class TranslationUnavailableError(TranslationError):
    """Raised when external translation provider is unreachable or rate-limited."""


class TranslationProvider(Protocol):
    """Protocol defining the translation provider interface."""

    name: str

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """Translate text from source_lang to target_lang."""
        ...


class MyMemoryTranslationProvider:
    """External translation provider using the public MyMemory API.

    Treats MyMemory as an optional, presentation-only translation engine.
    Splits long text into sentence/paragraph chunks to respect API length caps,
    unescapes HTML entities, and raises TranslationUnavailableError on failures.
    """

    name: str = "mymemory"

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """Translate text using MyMemory HTTP API."""
        # Chunk text if necessary
        chunks = self._split_into_chunks(text, max_len=MAX_CHUNK_LENGTH)
        translated_chunks: list[str] = []

        langpair = f"{source_lang}|{target_lang}"

        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
            for chunk in chunks:
                if not chunk.strip():
                    continue

                try:
                    response = await client.get(
                        MYMEMORY_API_URL,
                        params={"q": chunk, "langpair": langpair},
                    )

                    if response.status_code == 429:
                        logger.warning("mymemory_rate_limited", langpair=langpair)
                        raise TranslationUnavailableError(
                            "Translation service is temporarily rate-limited. Please try again later."
                        )

                    if response.status_code != 200:
                        logger.warning(
                            "mymemory_http_error",
                            status_code=response.status_code,
                            langpair=langpair,
                        )
                        raise TranslationUnavailableError(
                            f"Translation provider returned HTTP {response.status_code}."
                        )

                    data = response.json()
                    status = data.get("responseStatus")

                    if status == 200:
                        res_data = data.get("responseData") or {}
                        raw_translated = res_data.get("translatedText", "")
                        clean_translated = html.unescape(raw_translated)
                        translated_chunks.append(clean_translated)
                    elif status == 403 or status == 429:
                        logger.warning("mymemory_quota_exceeded", status=status, langpair=langpair)
                        raise TranslationUnavailableError(
                            "Translation provider quota exceeded or temporarily unavailable."
                        )
                    else:
                        error_msg = data.get("responseDetails") or "Provider error"
                        logger.warning("mymemory_response_error", status=status, details=error_msg)
                        raise TranslationUnavailableError(
                            f"Translation failed: {error_msg}"
                        )

                except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                    logger.warning(
                        "mymemory_network_failure",
                        error=type(net_err).__name__,
                        chunk_len=len(chunk),
                    )
                    raise TranslationUnavailableError(
                        "Translation service is temporarily unreachable."
                    ) from net_err

        return " ".join(translated_chunks) if translated_chunks else text

    @staticmethod
    def _split_into_chunks(text: str, max_len: int = MAX_CHUNK_LENGTH) -> list[str]:
        """Split text into sentence/space-bounded chunks not exceeding max_len."""
        if len(text) <= max_len:
            return [text]

        chunks: list[str] = []
        words = text.split(" ")
        current_chunk: list[str] = []
        current_len = 0

        for word in words:
            word_len = len(word) + (1 if current_chunk else 0)
            if current_len + word_len > max_len and current_chunk:
                chunks.append(" ".join(current_chunk))
                current_chunk = [word]
                current_len = len(word)
            else:
                current_chunk.append(word)
                current_len += word_len

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks


class MockTranslationProvider:
    """Deterministic mock provider for automated testing and offline environments."""

    name: str = "mock"

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
    ) -> str:
        """Return deterministic translated text without making external network calls."""
        # Simple deterministic substitution for testing
        return f"[Translated ({source_lang} -> {target_lang})] {text}"


class TranslationService:
    """Orchestrates on-demand text translation with language validation and telemetry."""

    def __init__(self, provider: TranslationProvider | None = None) -> None:
        self.provider: TranslationProvider = provider or MyMemoryTranslationProvider()
        self.detector = LanguageDetector()
        self._cache: dict[tuple[str, str, str], str] = {}

    async def translate(
        self,
        text: str,
        source_language: str = "auto",
        target_language: str = "en",
        *,
        source_lang: str | None = None,
        target_lang: str | None = None,
    ) -> TranslateResponse:
        """Translate text for display presentation.

        Args:
            text: Validated input text (10–50,000 characters).
            source_language: Source language code or 'auto'.
            target_language: Target language code.
            source_lang: Optional alias for source_language.
            target_lang: Optional alias for target_language.

        Returns:
            TranslateResponse with translated text and non-causal presentation disclaimer.

        Raises:
            UnsupportedLanguageError: If source or target language is invalid.
            TranslationUnavailableError: If provider is offline or rate-limited.
        """
        start_time = time.perf_counter()

        actual_target = target_lang if target_lang is not None else target_language
        actual_source = source_lang if source_lang is not None else source_language

        # 1. Validate target language
        norm_target = normalize_language_code(actual_target)
        if not is_supported_language(norm_target):
            raise UnsupportedLanguageError(
                f"Target language '{actual_target}' is not in the supported languages registry."
            )

        # 2. Determine source language
        if actual_source.lower() == "auto":
            detected = self.detector.detect_language(text)
            if not detected.is_reliable or detected.code == "unknown":
                raise UnsupportedLanguageError(
                    "Source language could not be reliably determined. Please specify source_language explicitly."
                )
            norm_source = detected.code
        else:
            norm_source = normalize_language_code(actual_source)
            if not is_supported_language(norm_source):
                raise UnsupportedLanguageError(
                    f"Source language '{actual_source}' is not in the supported languages registry."
                )

        # 3. If source equals target, return immediately (no-op)
        if norm_source == norm_target:
            elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return TranslateResponse(
                source_language=norm_source,
                source_language_name=get_language_name(norm_source),
                target_language=norm_target,
                target_language_name=get_language_name(norm_target),
                original_text=text,
                translated_text=text,
                latency_ms=elapsed_ms,
                provider=self.provider.name,
                is_cached=False,
                character_count=len(text),
            )

        # 4. Check cache
        cache_key = (norm_source, norm_target, text)
        if cache_key in self._cache:
            translated_text = self._cache[cache_key]
            is_cached = True
        else:
            # Execute translation via provider
            translated_text = await self.provider.translate(
                text=text,
                source_lang=norm_source,
                target_lang=norm_target,
            )
            self._cache[cache_key] = translated_text
            is_cached = False

        elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)

        # Structured logging: logs lengths and status, NEVER logs user text content
        logger.info(
            "translation_completed",
            provider=self.provider.name,
            source_lang=norm_source,
            target_lang=norm_target,
            char_count=len(text),
            is_cached=is_cached,
            latency_ms=elapsed_ms,
        )

        return TranslateResponse(
            source_language=norm_source,
            source_language_name=get_language_name(norm_source),
            target_language=norm_target,
            target_language_name=get_language_name(norm_target),
            original_text=text,
            translated_text=translated_text,
            latency_ms=elapsed_ms,
            provider=self.provider.name,
            is_cached=is_cached,
            character_count=len(text),
        )
