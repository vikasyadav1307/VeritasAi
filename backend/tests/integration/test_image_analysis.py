"""Comprehensive integration test suite for Image Analysis and OCR capabilities.

Tests cover:
1. Input validation & security defenses (file size limits, magic bytes, dimensions, decompression bombs)
2. Authentication requirements and user scoping
3. OCR engine extraction, text cleaning, quality validation, and graceful 503 fallback
4. Database persistence into AnalysisResult with input_type="image"
5. Reflection in History and Dashboard endpoints
"""

from __future__ import annotations

import io
import uuid
from unittest.mock import MagicMock, patch

import pytest
from httpx import AsyncClient
from PIL import Image, ImageDraw
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import AnalysisResult
from app.modules.image_analysis.security import (
    DecompressionBombSecurityError,
    ImageTooLargeError,
    ImageValidationError,
    MalformedImageError,
    UnsupportedImageFormatError,
    read_bounded_image_bytes,
    sanitize_filename,
    validate_and_open_image,
    verify_image_magic_bytes,
)
from app.modules.image_analysis.services import (
    ImageAnalysisService,
    ImagePreprocessor,
    InsufficientOcrTextError,
    OcrEngine,
    OcrUnavailableError,
    TextCleaner,
)


# ── Helpers & Fixtures ──


def make_test_image(
    format: str = "JPEG",
    size: tuple[int, int] = (200, 100),
    color: str = "white",
    text: str = "VeritasAI Test Headline",
) -> bytes:
    """Create in-memory image bytes for testing."""
    mode = "RGBA" if format == "PNG" else "RGB"
    img = Image.new(mode, size, color=color)
    draw = ImageDraw.Draw(img)
    draw.text((10, 10), text, fill="black")
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Helper fixture to register a test user and obtain auth headers."""
    unique_id = uuid.uuid4().hex[:8]
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"img_tester_{unique_id}@example.com",
            "username": f"img_user_{unique_id}",
            "password": "Password123!",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# 1. SECURITY & VALIDATION UNIT TESTS
# ══════════════════════════════════════════════════════════════════════════════


def test_magic_bytes_valid_jpeg():
    raw = make_test_image("JPEG")
    assert verify_image_magic_bytes(raw) == "JPEG"


def test_magic_bytes_valid_png():
    raw = make_test_image("PNG")
    assert verify_image_magic_bytes(raw) == "PNG"


def test_magic_bytes_valid_webp():
    raw = make_test_image("WEBP")
    assert verify_image_magic_bytes(raw) == "WEBP"


def test_magic_bytes_rejects_prohibited():
    with pytest.raises(UnsupportedImageFormatError, match="PDF document"):
        verify_image_magic_bytes(b"%PDF-1.5 fake pdf content")

    with pytest.raises(UnsupportedImageFormatError, match="SVG document"):
        verify_image_magic_bytes(b"<svg xmlns='http://www.w3.org/2000/svg'></svg>")

    with pytest.raises(UnsupportedImageFormatError, match="HTML document"):
        verify_image_magic_bytes(b"<!doctype html><html><body>malicious</body></html>")

    with pytest.raises(UnsupportedImageFormatError, match="Windows executable"):
        verify_image_magic_bytes(b"MZ\x90\x00\x03\x00\x00\x00")

    with pytest.raises(UnsupportedImageFormatError, match="ZIP/Office archive"):
        verify_image_magic_bytes(b"PK\x03\x04\x14\x00\x00\x00")


def test_sanitize_filename():
    assert sanitize_filename("../../etc/passwd.png") == "passwd.png"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe.jpg") == "cmd.exe.jpg"
    assert sanitize_filename("test\x00image\x1f.png") == "testimage.png"
    assert sanitize_filename("") == "uploaded_image.png"
    assert sanitize_filename(None) == "uploaded_image.png"
    assert len(sanitize_filename("a" * 300 + ".png")) <= 255


def test_validate_and_open_image_success():
    raw = make_test_image("JPEG")
    img = validate_and_open_image(raw)
    assert isinstance(img, Image.Image)
    assert img.size == (200, 100)


def test_validate_and_open_image_rejects_corrupted():
    corrupted = b"\xff\xd8\xff\xe0" + b"\x00" * 20
    with pytest.raises(MalformedImageError):
        validate_and_open_image(corrupted)


def test_validate_and_open_image_rejects_tiny():
    raw = make_test_image("PNG", size=(5, 5))
    with pytest.raises(MalformedImageError, match="too small"):
        validate_and_open_image(raw)


@pytest.mark.asyncio
async def test_read_bounded_image_bytes_exceeds_max():
    stream = io.BytesIO(b"x" * 1024)
    with pytest.raises(ImageTooLargeError):
        await read_bounded_image_bytes(stream, max_bytes=512)


@pytest.mark.asyncio
async def test_read_bounded_image_bytes_empty():
    stream = io.BytesIO(b"")
    with pytest.raises(ImageValidationError):
        await read_bounded_image_bytes(stream)


# ══════════════════════════════════════════════════════════════════════════════
# 2. PREPROCESSOR & TEXT CLEANER TESTS
# ══════════════════════════════════════════════════════════════════════════════


def test_image_preprocessor():
    preprocessor = ImagePreprocessor()
    img = Image.new("RGBA", (100, 100), (255, 0, 0, 128))
    processed = preprocessor.preprocess(img)
    assert processed.mode == "L"
    # Upscaled because min(100, 100) < 800
    assert processed.size[0] >= 300


def test_text_cleaner_success():
    cleaner = TextCleaner()
    raw = "  Headline: Government passes new education reform bill in parliament.\n\n\n  Details inside.  "
    cleaned = cleaner.clean_and_validate(raw)
    assert "Headline: Government passes new education reform bill in parliament." in cleaned
    assert "\n\n\n" not in cleaned


def test_text_cleaner_rejects_empty():
    cleaner = TextCleaner()
    with pytest.raises(InsufficientOcrTextError):
        cleaner.clean_and_validate("")


def test_text_cleaner_rejects_insufficient_length():
    cleaner = TextCleaner()
    with pytest.raises(InsufficientOcrTextError):
        cleaner.clean_and_validate("Short txt")


# ══════════════════════════════════════════════════════════════════════════════
# 3. ROUTER INTEGRATION TESTS — VALIDATION & SECURITY
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_image_analysis_requires_authentication(client: AsyncClient):
    """Unauthenticated requests return 401 Unauthorized."""
    raw = make_test_image("JPEG")
    response = await client.post(
        "/api/v1/analyze/image",
        files={"file": ("test.jpg", raw, "image/jpeg")},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_image_analysis_missing_file(client: AsyncClient, auth_headers: dict[str, str]):
    """Missing file upload returns 422 Unprocessable Entity."""
    response = await client.post(
        "/api/v1/analyze/image",
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_image_analysis_empty_file_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """Empty image payload returns 422 Unprocessable Entity."""
    response = await client.post(
        "/api/v1/analyze/image",
        files={"file": ("empty.jpg", b"", "image/jpeg")},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_image_analysis_unsupported_format_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """Non-image / prohibited formats return 400 Bad Request."""
    response = await client.post(
        "/api/v1/analyze/image",
        files={"file": ("doc.pdf", b"%PDF-1.5 document data", "application/pdf")},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_image_analysis_corrupted_image_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """Corrupted image bytes return 400 Bad Request."""
    corrupted = b"\xff\xd8\xff\xe0" + b"\x11" * 50
    response = await client.post(
        "/api/v1/analyze/image",
        files={"file": ("corrupt.jpg", corrupted, "image/jpeg")},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# 4. ROUTER INTEGRATION TESTS — OCR QUALITY & GRACEFUL ERROR HANDLING
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_image_analysis_ocr_unavailable_returns_503(client: AsyncClient, auth_headers: dict[str, str]):
    """When Tesseract is unavailable, returns graceful 503 without crashing."""
    raw = make_test_image("JPEG")
    with patch.object(OcrEngine, "is_available", return_value=False):
        response = await client.post(
            "/api/v1/analyze/image",
            files={"file": ("test.jpg", raw, "image/jpeg")},
            headers=auth_headers,
        )
    assert response.status_code == 503
    assert response.json()["detail"] == "Image text extraction is temporarily unavailable."


@pytest.mark.asyncio
async def test_image_analysis_insufficient_ocr_text_returns_422(client: AsyncClient, auth_headers: dict[str, str]):
    """When OCR returns empty or insufficient text, returns 422."""
    raw = make_test_image("JPEG")
    with patch.object(OcrEngine, "is_available", return_value=True), patch.object(
        OcrEngine, "extract_text", return_value="Too short"
    ):
        response = await client.post(
            "/api/v1/analyze/image",
            files={"file": ("test.jpg", raw, "image/jpeg")},
            headers=auth_headers,
        )
    assert response.status_code == 422
    assert "No readable text" in response.json()["detail"]


# ══════════════════════════════════════════════════════════════════════════════
# 5. ROUTER INTEGRATION TESTS — SUCCESS, USER SCOPING, & DB PERSISTENCE
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_image_analysis_success_and_db_persistence(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Successful image analysis extracts OCR, returns AI inference, and saves to DB."""
    raw = make_test_image("PNG")
    mocked_ocr_text = (
        "Breaking News: Ministry of Education announced new digital libraries across 500 schools today."
    )

    with patch.object(OcrEngine, "is_available", return_value=True), patch.object(
        OcrEngine, "extract_text", return_value=mocked_ocr_text
    ):
        response = await client.post(
            "/api/v1/analyze/image",
            files={"file": ("headline_news.png", raw, "image/png")},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()

    assert data["filename"] == "headline_news.png"
    assert data["content_type"] == "image/png"
    assert data["ocr_text"] == mocked_ocr_text
    assert data["character_count"] == len(mocked_ocr_text)
    assert data["detected_language"] in ("en", "auto")
    assert data["credibility"]["label"] in ("Real", "Fake")
    assert 0.0 <= data["credibility"]["confidence"] <= 1.0
    assert data["sentiment"]["label"] in ("Positive", "Negative", "Neutral")
    assert 0.0 <= data["sentiment"]["confidence"] <= 1.0
    assert data["processing_time_ms"] > 0

    record_id = uuid.UUID(data["id"])

    # Verify database persistence
    stmt = select(AnalysisResult).where(AnalysisResult.id == record_id)
    result = await db_session.execute(stmt)
    saved_record = result.scalar_one_or_none()

    assert saved_record is not None
    assert saved_record.input_type == "image"
    assert saved_record.title == "headline_news.png"
    assert saved_record.original_text == mocked_ocr_text
    assert saved_record.credibility_label == data["credibility"]["label"]
    assert saved_record.sentiment_label == data["sentiment"]["label"]


@pytest.mark.asyncio
async def test_image_analysis_path_traversal_filename_sanitized(
    client: AsyncClient,
    auth_headers: dict[str, str],
    db_session: AsyncSession,
):
    """Malicious path traversal filename is sanitized in response and database."""
    raw = make_test_image("JPEG")
    mocked_ocr_text = "Government confirms financial relief package approved for farmers."

    with patch.object(OcrEngine, "is_available", return_value=True), patch.object(
        OcrEngine, "extract_text", return_value=mocked_ocr_text
    ):
        response = await client.post(
            "/api/v1/analyze/image",
            files={"file": ("../../etc/shadow.jpg", raw, "image/jpeg")},
            headers=auth_headers,
        )

    assert response.status_code == 200
    data = response.json()
    assert data["filename"] == "shadow.jpg"
    assert "/" not in data["filename"]
    assert "\\" not in data["filename"]


@pytest.mark.asyncio
async def test_image_analysis_visible_in_history_and_dashboard(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Image analysis record appears in user's history and updates dashboard summary."""
    raw = make_test_image("JPEG")
    mocked_ocr_text = "Official statement confirms infrastructure project starts next Monday."

    with patch.object(OcrEngine, "is_available", return_value=True), patch.object(
        OcrEngine, "extract_text", return_value=mocked_ocr_text
    ):
        analyze_res = await client.post(
            "/api/v1/analyze/image",
            files={"file": ("article_screenshot.jpg", raw, "image/jpeg")},
            headers=auth_headers,
        )
    assert analyze_res.status_code == 200
    item_id = analyze_res.json()["id"]

    # 1. Query History
    history_res = await client.get("/api/v1/history", headers=auth_headers)
    assert history_res.status_code == 200
    history_items = history_res.json()["items"]
    assert any(item["id"] == item_id and item["input_type"] == "image" for item in history_items)

    # 2. Query Dashboard Summary
    dashboard_res = await client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert dashboard_res.status_code == 200
    summary = dashboard_res.json()
    assert summary["total_analyses"] >= 1
