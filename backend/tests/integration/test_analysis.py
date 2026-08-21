"""Integration tests for the text analysis endpoint.

Tests cover:
- Successful analysis with valid input
- Response structure validation (all fields present)
- Mock model flag verification
- Processing time measurement
"""

import pytest
from httpx import AsyncClient


VALID_TEXT = (
    "Scientists at MIT have developed a new AI system capable of detecting "
    "misinformation in multiple languages with high accuracy."
)


@pytest.mark.asyncio
async def test_analyze_text_returns_200(client: AsyncClient) -> None:
    """POST /api/v1/analyze/text with valid text should return 200."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT, "language": "auto"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_analyze_text_response_structure(client: AsyncClient) -> None:
    """Response should contain credibility, sentiment, and processing_time_ms."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    data = response.json()

    # Top-level keys
    assert "credibility" in data
    assert "sentiment" in data
    assert "processing_time_ms" in data

    # Credibility fields
    assert "label" in data["credibility"]
    assert "confidence" in data["credibility"]
    assert "is_mock" in data["credibility"]

    # Sentiment fields
    assert "label" in data["sentiment"]
    assert "confidence" in data["sentiment"]
    assert "is_mock" in data["sentiment"]


@pytest.mark.asyncio
async def test_analyze_text_mock_mode(client: AsyncClient) -> None:
    """Without trained models, is_mock should be True."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    data = response.json()

    assert data["credibility"]["is_mock"] is True
    assert data["sentiment"]["is_mock"] is True


@pytest.mark.asyncio
async def test_analyze_text_confidence_range(client: AsyncClient) -> None:
    """Confidence scores must be between 0.0 and 1.0."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    data = response.json()

    assert 0.0 <= data["credibility"]["confidence"] <= 1.0
    assert 0.0 <= data["sentiment"]["confidence"] <= 1.0


@pytest.mark.asyncio
async def test_analyze_text_valid_labels(client: AsyncClient) -> None:
    """Labels must be from the expected set."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    data = response.json()

    assert data["credibility"]["label"] in ("Fake", "Real")
    assert data["sentiment"]["label"] in ("Positive", "Negative", "Neutral")


@pytest.mark.asyncio
async def test_analyze_text_processing_time(client: AsyncClient) -> None:
    """Processing time must be a positive number."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    data = response.json()

    assert data["processing_time_ms"] > 0


@pytest.mark.asyncio
async def test_analyze_text_default_language(client: AsyncClient) -> None:
    """Language should default to 'auto' when omitted."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": VALID_TEXT},
    )
    assert response.status_code == 200
