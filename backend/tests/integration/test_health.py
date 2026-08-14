"""Smoke tests for the health endpoints.

These tests verify that the API process starts correctly
and returns valid responses on /health.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_returns_200(client: AsyncClient) -> None:
    """GET /health should return 200 with status and version."""
    response = await client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_response_contains_version(client: AsyncClient) -> None:
    """GET /health should include the application version."""
    response = await client.get("/health")
    data = response.json()
    assert data["version"] == "0.1.0"


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client: AsyncClient) -> None:
    """Requesting an undefined route should return 404."""
    response = await client.get("/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_response_contains_request_id_header(client: AsyncClient) -> None:
    """Every response should contain an X-Request-ID header."""
    response = await client.get("/health")
    assert "X-Request-ID" in response.headers


@pytest.mark.asyncio
async def test_response_contains_security_headers(client: AsyncClient) -> None:
    """Every response should contain security headers."""
    response = await client.get("/health")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
