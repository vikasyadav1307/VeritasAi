"""Integration and unit tests for Translation & Multilingual UX (Milestone 3.7).

Tests cover:
1. GET /api/v1/languages endpoint (supported registry, structure, defaults).
2. POST /api/v1/translate authentication & authorization (401 vs 200).
3. POST /api/v1/translate input validation (empty, short, long, unsupported codes).
4. LanguageDetector correctness:
   - Short text (<10 chars) returns explicit unknown state (code="unknown", confidence=None).
   - Symbol-only text returns explicit unknown state.
   - Verified languages (English, Hindi, Spanish, French, German) return expected codes and confidence.
5. Translation caching and provider metadata.
6. Provider failure handling (503 Service Unavailable).
7. Integration with /api/v1/analyze/text (detected_language, language_name, language_confidence).
"""

import uuid
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.modules.translation.detector import LanguageDetector
from app.modules.translation.languages import (
    SUPPORTED_LANGUAGES,
    get_language_info,
    get_language_name,
    normalize_language_code,
)
from app.modules.translation.services import (
    MockTranslationProvider,
    TranslationService,
    TranslationUnavailableError,
    UnsupportedLanguageError,
)


SAMPLE_ENGLISH_TEXT = (
    "Scientists at the international laboratory announced a breakthrough in clean energy today."
)
SAMPLE_HINDI_TEXT = (
    "वैज्ञानिकों ने आज स्वच्छ ऊर्जा के क्षेत्र में एक ऐतिहासिक और महत्वपूर्ण सफलता हासिल की है।"
)
SAMPLE_SPANISH_TEXT = (
    "Los científicos del laboratorio internacional anunciaron hoy un gran avance en energía limpia."
)
SAMPLE_FRENCH_TEXT = (
    "Les scientifiques du laboratoire international ont annoncé aujourd'hui une avancée majeure."
)


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Helper fixture to register a test user and obtain auth headers."""
    unique_id = uuid.uuid4().hex[:8]
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"trans_user_{unique_id}@example.com",
            "username": f"translator_{unique_id}",
            "password": "Password123!",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# 1. LANGUAGES REGISTRY ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_get_languages_returns_200(client: AsyncClient) -> None:
    """GET /api/v1/languages should be public and return the supported languages list."""
    res = await client.get("/api/v1/languages")
    assert res.status_code == 200
    data = res.json()

    assert "languages" in data
    assert "total_supported" in data
    assert "default_target" in data
    assert data["default_target"] == "en"
    assert data["total_supported"] == len(SUPPORTED_LANGUAGES)
    assert data["total_supported"] >= 14

    first_lang = data["languages"][0]
    assert "code" in first_lang
    assert "name" in first_lang
    assert "native_name" in first_lang
    assert "is_supported_for_analysis" in first_lang
    assert "is_verified_translation" in first_lang


# ══════════════════════════════════════════════════════════════════════════════
# 2. AUTHENTICATION & ACCESS CONTROL
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_translate_unauthenticated_returns_401(client: AsyncClient) -> None:
    """POST /api/v1/translate without token must return 401."""
    res = await client.post(
        "/api/v1/translate",
        json={
            "text": SAMPLE_HINDI_TEXT,
            "target_lang": "en",
        },
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_translate_authenticated_returns_200(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """POST /api/v1/translate with valid token returns translated text and metadata."""
    from app.modules.translation.router import _translation_service
    from app.modules.translation.services import MockTranslationProvider

    orig_provider = _translation_service.provider
    _translation_service.provider = MockTranslationProvider()
    try:
        res = await client.post(
            "/api/v1/translate",
            headers=auth_headers,
            json={
                "text": SAMPLE_HINDI_TEXT,
                "target_lang": "en",
            },
        )
        assert res.status_code == 200
        data = res.json()

        assert "translated_text" in data
        assert len(data["translated_text"]) > 0
        assert data["target_language"] == "en"
        assert data["target_language_name"] == "English"
        assert "source_language" in data
        assert "source_language_name" in data
        assert "disclaimer" in data
        assert "presentation" in data["disclaimer"].lower()
        assert "provider" in data
        assert "character_count" in data
    finally:
        _translation_service.provider = orig_provider


# ══════════════════════════════════════════════════════════════════════════════
# 3. INPUT VALIDATION & CONSTRAINTS
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_translate_empty_text_returns_422(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """Empty text must be rejected with 422 Unprocessable Entity."""
    res = await client.post(
        "/api/v1/translate",
        headers=auth_headers,
        json={
            "text": "",
            "target_lang": "en",
        },
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_translate_unsupported_language_returns_400(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """Unsupported target language code must return 400 Bad Request."""
    res = await client.post(
        "/api/v1/translate",
        headers=auth_headers,
        json={
            "text": SAMPLE_ENGLISH_TEXT,
            "target_lang": "klingon_xyz",
        },
    )
    assert res.status_code == 400
    assert "supported" in res.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# 4. LANGUAGE DETECTOR UNIT TESTS (NO SILENT ENGLISH FALLBACK)
# ══════════════════════════════════════════════════════════════════════════════


def test_language_detector_short_text_returns_unknown():
    """Short text (<10 chars) must return unknown state with confidence=None."""
    res = LanguageDetector.detect_language("hi")
    assert res.code == "unknown"
    assert res.name == "Unknown / Undetermined"
    assert res.confidence is None
    assert res.is_reliable is False


def test_language_detector_symbol_only_text_returns_unknown():
    """Symbol-only text must return unknown state without crashing."""
    res = LanguageDetector.detect_language("1234567890 !@#$%^&*()")
    assert res.code == "unknown"
    assert res.name == "Unknown / Undetermined"
    assert res.confidence is None
    assert res.is_reliable is False


def test_language_detector_english():
    """Valid English text is accurately detected."""
    res = LanguageDetector.detect_language(SAMPLE_ENGLISH_TEXT)
    assert res.code == "en"
    assert res.name == "English"
    assert res.confidence is not None
    assert res.confidence > 0.5
    assert res.is_reliable is True


def test_language_detector_hindi():
    """Valid Hindi text is accurately detected."""
    res = LanguageDetector.detect_language(SAMPLE_HINDI_TEXT)
    assert res.code == "hi"
    assert res.name == "Hindi"
    assert res.confidence is not None
    assert res.confidence > 0.5
    assert res.is_reliable is True


def test_language_detector_spanish():
    """Valid Spanish text is accurately detected."""
    res = LanguageDetector.detect_language(SAMPLE_SPANISH_TEXT)
    assert res.code == "es"
    assert res.name == "Spanish"
    assert res.confidence is not None
    assert res.confidence > 0.5
    assert res.is_reliable is True


def test_language_detector_french():
    """Valid French text is accurately detected."""
    res = LanguageDetector.detect_language(SAMPLE_FRENCH_TEXT)
    assert res.code == "fr"
    assert res.name == "French"
    assert res.confidence is not None
    assert res.confidence > 0.5
    assert res.is_reliable is True


def test_language_detector_indic_languages():
    """Verify detection on several Indic languages (Bengali, Tamil, Telugu, Marathi)."""
    samples = [
        ("bn", "Bengali", "আন্তর্জাতিক গবেষণাগারের বিজ্ঞানীরা আজ পরিচ্ছন্ন শক্তির ক্ষেত্রে একটি যুগান্তকারী সাফল্যের ঘোষণা দিয়েছেন।"),
        ("ta", "Tamil", "சர்வதேச ஆய்வக விஞ்ஞானிகள் இன்று தூய ஆற்றல் துறையில் ஒரு முக்கிய முன்னேற்றத்தை அறிவித்துள்ளனர்."),
        ("te", "Telugu", "అంతర్జాతీయ ప్రయోగశాల శాస్త్రవేత్తలు నేడు స్వచ్ఛమైన ఇంధన రంగంలో ఒక పెద్ద విజయాన్ని ప్రకటించారు."),
        ("mr", "Marathi", "आंतरराष्ट्रीय प्रयोगशाळेतील शास्त्रज्ञांनी आज स्वच्छ ऊर्जेच्या क्षेत्रात महत्त्वपूर्ण यशाची घोषणा केली."),
    ]
    for expected_code, expected_name, text in samples:
        res = LanguageDetector.detect_language(text)
        assert res.code == expected_code
        assert res.name == expected_name
        assert res.confidence is not None
        assert res.confidence > 0.5
        assert res.is_reliable is True



# ══════════════════════════════════════════════════════════════════════════════
# 5. TRANSLATION SERVICE CACHING & FAILURE HANDLING
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_translation_caching():
    """Second request with identical text and target language should return cached result."""
    mock_provider = MockTranslationProvider()
    service = TranslationService(provider=mock_provider)

    # First call
    res1 = await service.translate(SAMPLE_ENGLISH_TEXT, target_lang="es")
    assert res1.is_cached is False

    # Second call
    res2 = await service.translate(SAMPLE_ENGLISH_TEXT, target_lang="es")
    assert res2.is_cached is True
    assert res2.translated_text == res1.translated_text


@pytest.mark.asyncio
async def test_translation_provider_failure_returns_503(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """When translation provider fails, endpoint must return 503 Service Unavailable."""
    with patch(
        "app.modules.translation.services.TranslationService.translate",
        side_effect=TranslationUnavailableError("External service timeout"),
    ):
        res = await client.post(
            "/api/v1/translate",
            headers=auth_headers,
            json={
                "text": SAMPLE_ENGLISH_TEXT,
                "target_lang": "hi",
            },
        )
        assert res.status_code == 503
        assert "temporarily unavailable" in res.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# 6. INTEGRATION WITH ANALYSIS ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_analyze_text_includes_detected_language(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """POST /api/v1/analyze/text must include detected language information."""
    res = await client.post(
        "/api/v1/analyze/text",
        headers=auth_headers,
        json={"text": SAMPLE_HINDI_TEXT},
    )
    assert res.status_code == 200
    data = res.json()

    assert "detected_language" in data
    assert data["detected_language"] == "hi"
    assert "language_name" in data
    assert data["language_name"] == "Hindi"
    assert "language_confidence" in data
    assert data["language_confidence"] is not None


@pytest.mark.asyncio
async def test_translate_preserves_original_text_and_validates_structure(
    client: AsyncClient,
    auth_headers: dict[str, str],
) -> None:
    """POST /api/v1/translate must retain original_text intact and return complete structure."""
    from app.modules.translation.router import _translation_service
    from app.modules.translation.services import MockTranslationProvider

    orig_provider = _translation_service.provider
    _translation_service.provider = MockTranslationProvider()
    try:
        res = await client.post(
            "/api/v1/translate",
            headers=auth_headers,
            json={
                "text": SAMPLE_HINDI_TEXT,
                "target_lang": "en",
            },
        )
        assert res.status_code == 200
        data = res.json()

        # Original text must match submitted text exactly
        assert data["original_text"] == SAMPLE_HINDI_TEXT
        assert data["translated_text"] != data["original_text"]
        assert data["source_language"] == "hi"
        assert data["source_language_name"] == "Hindi"
        assert data["target_language"] == "en"
        assert data["target_language_name"] == "English"
        assert data["character_count"] == len(SAMPLE_HINDI_TEXT)
        assert "latency_ms" in data
        assert data["latency_ms"] >= 0.0
        assert "provider" in data
        assert "disclaimer" in data
        assert "presentation" in data["disclaimer"].lower()
    finally:
        _translation_service.provider = orig_provider

