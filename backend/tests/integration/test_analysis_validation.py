"""Validation tests for the text analysis endpoint.

Tests cover:
- Text too short (< 10 characters)
- Missing text field
- Empty request body
- Text at boundary length (exactly 10 characters)
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_text_too_short_returns_422(client: AsyncClient) -> None:
    """Text shorter than 10 characters should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": "Short"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_empty_text_returns_422(client: AsyncClient) -> None:
    """Empty string should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": ""},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_missing_text_field_returns_422(client: AsyncClient) -> None:
    """Request without 'text' field should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"language": "en"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_empty_body_returns_422(client: AsyncClient) -> None:
    """Empty JSON body should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_no_body_returns_422(client: AsyncClient) -> None:
    """Request with no body should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        content=b"",
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_text_exactly_10_chars_accepted(client: AsyncClient) -> None:
    """Text at the minimum boundary (10 chars) should be accepted."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": "1234567890"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_text_9_chars_rejected(client: AsyncClient) -> None:
    """Text just below minimum (9 chars) should be rejected."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": "123456789"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_422_response_contains_detail(client: AsyncClient) -> None:
    """422 responses should include validation error details."""
    response = await client.post(
        "/api/v1/analyze/text",
        json={"text": "Short"},
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
