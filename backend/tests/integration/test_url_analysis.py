"""Comprehensive test suite for URL analysis and SSRF defenses.

Covers input validation, SSRF blocking (IPv4, IPv6, cloud metadata, local TLDs),
safe redirect checking (public-to-private hop prevention), authentication,
response limits, article extraction, and user association.
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from httpx import AsyncClient

from app.modules.url_analysis.security import (
    SSRFSecurityError,
    UrlValidationError,
    validate_url_for_ssrf,
    validate_url_syntax,
)
from app.modules.url_analysis.services import (
    ArticleExtractionError,
    ArticleExtractorService,
    FetchError,
    FetchedPage,
    ResponseTooLargeError,
    UnsupportedContentTypeError,
    UpstreamHttpError,
    UrlAnalysisService,
    UrlFetcherService,
)


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Helper fixture to register a test user and obtain auth headers."""
    unique_id = uuid.uuid4().hex[:8]
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"url_tester_{unique_id}@example.com",
            "username": f"tester_{unique_id}",
            "password": "Password123!",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# 1. URL VALIDATION TESTS
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_missing_url_field(client: AsyncClient, auth_headers: dict[str, str]):
    """Missing 'url' key returns 422 Unprocessable Entity."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_empty_url_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """Empty string URL returns 422 Unprocessable Entity."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": ""},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_invalid_url_syntax(client: AsyncClient, auth_headers: dict[str, str]):
    """Invalid URL string without protocol returns 422."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": "not-a-valid-url-at-all"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_relative_url_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """Relative URL path is rejected with 422."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": "/news/article-about-clean-energy"},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "unsupported_url",
    [
        "ftp://example.com/file.txt",
        "file:///etc/passwd",
        "data:text/html,<h1>Hello</h1>",
        "javascript:alert(1)",
        "gopher://example.com/",
    ],
)
async def test_unsupported_protocol_rejected(
    client: AsyncClient,
    auth_headers: dict[str, str],
    unsupported_url: str,
):
    """Protocols other than http and https are strictly rejected."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": unsupported_url},
        headers=auth_headers,
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_url_too_long_rejected(client: AsyncClient, auth_headers: dict[str, str]):
    """URLs exceeding 2048 characters are rejected with 422."""
    long_url = "https://example.com/article?" + ("param=" + "a" * 2100)
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": long_url},
        headers=auth_headers,
    )
    assert response.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# 2. SSRF DEFENSE TESTS
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "ssrf_target",
    [
        "http://localhost/news",
        "https://localhost:8000/admin",
        "http://localhost.localdomain/api",
        "http://127.0.0.1/status",
        "http://127.0.0.1:8000/docs",
        "http://127.0.1.1/secret",
        "http://10.0.0.1/metadata",
        "http://10.254.0.1/metrics",
        "http://172.16.0.1/admin",
        "http://172.31.255.255/intranet",
        "http://192.168.1.1/router",
        "http://192.168.0.100/status",
        "http://169.254.169.254/latest/meta-data",
        "http://169.254.1.1/internal",
        "http://100.64.0.1/cgnat",
        "http://0.0.0.0/internal",
        "http://[::1]/secret",
        "http://server.local/article",
        "http://service.internal/data",
        "http://database.lan/test",
    ],
)
async def test_ssrf_destinations_blocked(
    client: AsyncClient,
    auth_headers: dict[str, str],
    ssrf_target: str,
):
    """Private, loopback, link-local, and local hostname destinations are rejected with 400."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": ssrf_target},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "security reasons" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_ssrf_rejects_redirect_to_private_ip(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """If a public host attempts to redirect to a private IP, it must be blocked with 400."""
    initial_url = "https://safe-news-site.org/redirect-service"

    with patch(
        "app.modules.url_analysis.security.socket.getaddrinfo",
        return_value=[(2, 1, 6, "", ("93.184.216.34", 443))],
    ):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 302
        mock_response.headers = {"Location": "http://169.254.169.254/latest/meta-data/"}

        with patch("httpx.AsyncClient.get", return_value=mock_response):
            response = await client.post(
                "/api/v1/analyze/url",
                json={"url": initial_url},
                headers=auth_headers,
            )

            assert response.status_code == 400
            assert "security reasons" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_ssrf_rejects_redirect_to_localhost(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """If a public host attempts to redirect to localhost, it must be blocked with 400."""
    initial_url = "https://safe-news-site.org/bounce"

    with patch(
        "app.modules.url_analysis.security.socket.getaddrinfo",
        return_value=[(2, 1, 6, "", ("93.184.216.34", 443))],
    ):
        mock_response = MagicMock(spec=httpx.Response)
        mock_response.status_code = 301
        mock_response.headers = {"Location": "http://localhost:8000/internal"}

        with patch("httpx.AsyncClient.get", return_value=mock_response):
            response = await client.post(
                "/api/v1/analyze/url",
                json={"url": initial_url},
                headers=auth_headers,
            )

            assert response.status_code == 400
            assert "security reasons" in response.json()["detail"].lower()


# ══════════════════════════════════════════════════════════════════════════════
# 3. AUTHENTICATION & USER ASSOCIATION TESTS
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_url_analysis_requires_authentication(client: AsyncClient):
    """Unauthenticated request to /analyze/url returns 401 Unauthorized."""
    response = await client.post(
        "/api/v1/analyze/url",
        json={"url": "https://example.com/article"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_authenticated_url_analysis_associates_with_user(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Successful URL analysis is associated with the authenticated user in history."""
    test_html = """
    <!DOCTYPE html>
    <html>
      <head>
        <title>New Scientific Breakthrough Announced</title>
        <meta property="og:title" content="New Scientific Breakthrough Announced">
      </head>
      <body>
        <article>
          <h1>New Scientific Breakthrough Announced</h1>
          <p>Researchers in energy science have developed a scalable method for capturing solar power efficiently.</p>
          <p>The innovation allows solar arrays to operate with forty percent higher conversion rates worldwide.</p>
        </article>
      </body>
    </html>
    """

    with patch.object(
        UrlFetcherService,
        "fetch_html",
        new=AsyncMock(
            return_value=FetchedPage(
                initial_url="https://valid-news.org/article-101",
                final_url="https://valid-news.org/article-101",
                html_content=test_html,
                content_type="text/html",
            )
        ),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://valid-news.org/article-101"},
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["source_url"] == "https://valid-news.org/article-101"
        assert data["extracted_title"] == "New Scientific Breakthrough Announced"
        assert data["credibility"]["label"] in ("Real", "Fake")
        assert data["sentiment"]["label"] in ("Positive", "Negative", "Neutral")
        assert data["character_count"] > 50

        # Verify the record exists in the authenticated user's history
        history_res = await client.get("/api/v1/history", headers=auth_headers)
        assert history_res.status_code == 200
        history_items = history_res.json()["items"]
        matching = [item for item in history_items if item["id"] == data["id"]]
        assert len(matching) == 1
        assert matching[0]["input_type"] == "url"
        assert matching[0]["source_url"] == "https://valid-news.org/article-101"
        assert matching[0]["title"] == "New Scientific Breakthrough Announced"


@pytest.mark.asyncio
async def test_client_cannot_override_user_id(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Client cannot spoof user_id in URL analysis payload."""
    fake_user_id = str(uuid.uuid4())
    test_html = "<html><body><article><p>" + ("Valid article text content here. " * 10) + "</p></article></body></html>"

    with patch.object(
        UrlFetcherService,
        "fetch_html",
        new=AsyncMock(
            return_value=FetchedPage(
                initial_url="https://valid-news.org/article-102",
                final_url="https://valid-news.org/article-102",
                html_content=test_html,
                content_type="text/html",
            )
        ),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={
                "url": "https://valid-news.org/article-102",
                "user_id": fake_user_id,
            },
            headers=auth_headers,
        )

        assert response.status_code == 200
        analysis_id = response.json()["id"]

        detail_res = await client.get(f"/api/v1/history/{analysis_id}", headers=auth_headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["user_id"] != fake_user_id


# ══════════════════════════════════════════════════════════════════════════════
# 4. FETCHING & EDGE CASE TESTS
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_fetch_timeout_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Fetch timeout is caught and returns safe 400 error."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=FetchError("Request timed out while connecting to the webpage."),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://slow-responding-host.com/news"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "could not be reached" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_fetch_connection_error_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Network connection failure returns 'The webpage could not be reached.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=FetchError("The webpage could not be reached."),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://unreachable-host.com/news"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "The webpage could not be reached."


@pytest.mark.asyncio
async def test_fetch_401_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """HTTP 401 returns 'This website does not allow automated article access.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UpstreamHttpError(status_code=401),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://protected-site.com/article-401"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "This website does not allow automated article access."


@pytest.mark.asyncio
async def test_fetch_403_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """HTTP 403 returns 'This website does not allow automated article access.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UpstreamHttpError(status_code=403),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://protected-site.com/article-403"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "This website does not allow automated article access."


@pytest.mark.asyncio
async def test_fetch_404_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """HTTP 404 from upstream returns 'The requested webpage was not found.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UpstreamHttpError(status_code=404),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/nonexistent-article"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "The requested webpage was not found."


@pytest.mark.asyncio
async def test_fetch_500_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """HTTP 500 from upstream returns 'The website is temporarily unavailable.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UpstreamHttpError(status_code=500),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/server-error"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "The website is temporarily unavailable."


@pytest.mark.asyncio
async def test_fetch_503_handled_safely(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """HTTP 503 from upstream returns 'The website is temporarily unavailable.'."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UpstreamHttpError(status_code=503),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/service-unavailable"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "The website is temporarily unavailable."


@pytest.mark.asyncio
async def test_non_html_content_rejected(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Non-HTML MIME type (e.g. PDF or binary) returns 400 Bad Request."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=UnsupportedContentTypeError("The webpage is not an HTML document."),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/document.pdf"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "not an html document" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_oversized_response_rejected(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Responses exceeding 5 MB return 400 Bad Request."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=ResponseTooLargeError("The webpage is too large to analyze."),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/huge-archive.html"},
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "too large to analyze" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_too_many_redirects_rejected(
    client: AsyncClient,
    auth_headers: dict[str, str],
):
    """Redirect loops or excessive redirects return 400."""
    with patch.object(
        UrlFetcherService,
        "fetch_html",
        side_effect=FetchError("Exceeded maximum allowed redirects (5)."),
    ):
        response = await client.post(
            "/api/v1/analyze/url",
            json={"url": "https://example.com/redirect-loop"},
            headers=auth_headers,
        )
        assert response.status_code == 400


# ══════════════════════════════════════════════════════════════════════════════
# 5. ARTICLE EXTRACTION TESTS
# ══════════════════════════════════════════════════════════════════════════════


def test_article_extractor_service_success():
    """ArticleExtractorService successfully extracts title, text, and language."""
    html_content = """
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Major AI Breakthrough in Education - Global News</title>
        <meta property="og:title" content="Major AI Breakthrough in Education">
        <link rel="canonical" href="https://globalnews.org/ai-breakthrough">
      </head>
      <body>
        <nav><a href="/">Home</a><a href="/news">News</a></nav>
        <div class="sidebar"><p>Sponsored advertising content here</p></div>
        <article>
          <h1>Major AI Breakthrough in Education</h1>
          <p>Educational researchers revealed an AI platform tailored for multilingual classrooms today.</p>
          <p>The system adapts curriculum in real time for over fifty thousand students across twelve school districts.</p>
        </article>
        <footer><p>Copyright 2026 Global News Inc.</p></footer>
      </body>
    </html>
    """

    extractor = ArticleExtractorService()
    article = extractor.extract_article(html_content)

    assert article.title == "Major AI Breakthrough in Education"
    assert article.canonical_url == "https://globalnews.org/ai-breakthrough"
    assert "Educational researchers revealed an AI platform" in article.text
    assert "Sponsored advertising content" not in article.text
    assert article.character_count > 100
    assert article.detected_language in ("en", "auto")


def test_article_extractor_service_missing_title_fallback():
    """ArticleExtractorService extracts first h1 if no og:title or title tag."""
    html_content = """
    <html>
      <body>
        <article>
          <h1>Headline from First Heading</h1>
          <p>This is a sufficiently long paragraph describing the events that occurred yesterday afternoon.</p>
          <p>Additional details and witness statements were provided to local media organizations today.</p>
        </article>
      </body>
    </html>
    """

    extractor = ArticleExtractorService()
    article = extractor.extract_article(html_content)

    assert article.title == "Headline from First Heading"
    assert len(article.text) > 50


def test_article_extractor_empty_content_rejected():
    """Empty HTML content raises ArticleExtractionError."""
    extractor = ArticleExtractorService()
    with pytest.raises(ArticleExtractionError):
        extractor.extract_article("<html><body><div></div></body></html>")


def test_article_extractor_insufficient_text_rejected():
    """HTML with fewer than 50 characters of readable text raises ArticleExtractionError."""
    extractor = ArticleExtractorService()
    with pytest.raises(ArticleExtractionError):
        extractor.extract_article("<html><body><article><p>Too short.</p></article></body></html>")


@pytest.mark.asyncio
async def test_url_fetcher_service_raises_upstream_http_error():
    """UrlFetcherService raises UpstreamHttpError on HTTP 4xx or 5xx responses."""
    fetcher = UrlFetcherService()
    mock_resp = MagicMock(spec=httpx.Response)
    mock_resp.status_code = 401

    with patch(
        "app.modules.url_analysis.services.validate_url_for_ssrf",
        return_value=("https://example.com/article", "example.com", 443),
    ):
        with patch("httpx.AsyncClient.get", return_value=mock_resp):
            with pytest.raises(UpstreamHttpError) as exc_info:
                await fetcher.fetch_html("https://example.com/article")
            assert exc_info.value.status_code == 401

