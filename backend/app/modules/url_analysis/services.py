"""Services for URL fetching, article content extraction, and analysis pipeline."""

from __future__ import annotations

import html
import re
import urllib.parse
from dataclasses import dataclass
from typing import Any

import httpx
import structlog
from bs4 import BeautifulSoup
from langdetect import DetectorFactory, detect

from app.modules.analysis.services import AnalysisService
from app.modules.url_analysis.security import (
    SSRFSecurityError,
    UrlResolutionError,
    UrlValidationError,
    validate_url_for_ssrf,
)

# Seed langdetect for deterministic results
DetectorFactory.seed = 0

logger = structlog.get_logger(__name__)

# Request constraints
MAX_REDIRECTS = 5
MAX_BODY_BYTES = 5 * 1024 * 1024  # 5 MB
CONNECT_TIMEOUT = 5.0
READ_TIMEOUT = 10.0
TOTAL_TIMEOUT = 15.0

# Minimum extracted text length to be considered an article
MIN_ARTICLE_TEXT_LENGTH = 50
MAX_ARTICLE_TEXT_LENGTH = 50_000

# User-Agent header (neutral, identification only)
USER_AGENT = "VeritasAI/0.1.0 (News Verification Bot)"

# Supported MIME types for article parsing
SUPPORTED_CONTENT_TYPES = (
    "text/html",
    "application/xhtml+xml",
)


class FetchError(Exception):
    """Raised when fetching the webpage fails."""

    def __init__(
        self,
        message: str = "The webpage could not be reached.",
        status_code: int | None = None,
    ) -> None:
        super().__init__(message)
        if status_code is None:
            match = re.search(r"HTTP (?:status )?(\d{3})", message)
            if match:
                try:
                    status_code = int(match.group(1))
                except ValueError:
                    status_code = None
        self.status_code = status_code


class UpstreamHttpError(FetchError):
    """Raised when the upstream web server returns an HTTP 4xx or 5xx status."""

    def __init__(self, status_code: int, message: str | None = None) -> None:
        super().__init__(
            message=message or f"The webpage returned HTTP status {status_code}.",
            status_code=status_code,
        )


class UnsupportedContentTypeError(FetchError):
    """Raised when the fetched resource is not HTML."""
    pass


class ResponseTooLargeError(FetchError):
    """Raised when the remote response exceeds size limits."""
    pass


class ArticleExtractionError(Exception):
    """Raised when readable article text cannot be extracted."""
    pass


@dataclass
class FetchedPage:
    """Represents a safely fetched web page."""

    initial_url: str
    final_url: str
    html_content: str
    content_type: str


@dataclass
class ExtractedArticle:
    """Represents the structured content extracted from HTML."""

    title: str | None
    text: str
    canonical_url: str | None
    detected_language: str
    character_count: int


class UrlFetcherService:
    """Safely retrieves HTML from external URLs with full SSRF and DoS protection."""

    async def fetch_html(self, initial_url: str) -> FetchedPage:
        """Fetch a public webpage following redirects safely and verifying content.

        Args:
            initial_url: The user-supplied URL.

        Returns:
            FetchedPage containing the final URL and cleaned HTML content.

        Raises:
            UrlValidationError: On invalid syntax.
            SSRFSecurityError: If any hop attempts to connect to private/internal IPs.
            UrlResolutionError: If DNS resolution fails.
            FetchError: On network, HTTP, or redirect failure.
            UnsupportedContentTypeError: If response is not HTML.
            ResponseTooLargeError: If response exceeds 5 MB.
        """
        current_url = initial_url
        visited_urls: set[str] = set()

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
            "Accept-Language": "en-US,en;q=0.9,*;q=0.5",
        }

        timeout = httpx.Timeout(
            TOTAL_TIMEOUT,
            connect=CONNECT_TIMEOUT,
            read=READ_TIMEOUT,
            write=5.0,
        )

        # Use an isolated AsyncClient without ambient environment proxies or cookies
        async with httpx.AsyncClient(
            follow_redirects=False,
            timeout=timeout,
            trust_env=False,
        ) as client:
            for hop in range(MAX_REDIRECTS + 1):
                # ── CRITICAL: Validate EVERY redirect destination independently before connecting ──
                normalized_url, _host, _port = await validate_url_for_ssrf(current_url)
                visited_urls.add(normalized_url)

                logger.info(
                    "fetching_url_hop",
                    hop=hop,
                    url=normalized_url,
                )

                try:
                    response = await client.get(
                        normalized_url,
                        headers=headers,
                    )
                except httpx.TimeoutException as exc:
                    logger.warning("fetch_timeout", url=normalized_url)
                    raise FetchError("Request timed out while connecting to the webpage.") from exc
                except httpx.ConnectError as exc:
                    logger.warning("fetch_connect_error", url=normalized_url, error=str(exc))
                    raise FetchError("The webpage could not be reached.") from exc
                except httpx.RequestError as exc:
                    logger.warning("fetch_request_error", url=normalized_url, error=str(exc))
                    raise FetchError("Failed to fetch the webpage.") from exc

                # ── Handle Redirects (301, 302, 303, 307, 308) ──
                if response.status_code in (301, 302, 303, 307, 308):
                    location = response.headers.get("Location")
                    if not location:
                        raise FetchError("Received redirect status with no destination Location header.")

                    # Resolve relative redirect URLs safely
                    next_url = urllib.parse.urljoin(current_url, location)

                    if next_url in visited_urls:
                        raise FetchError("Too many redirects or redirect loop detected.")

                    if hop == MAX_REDIRECTS:
                        raise FetchError(f"Exceeded maximum allowed redirects ({MAX_REDIRECTS}).")

                    # Loop advances; next iteration's validate_url_for_ssrf will inspect next_url
                    current_url = next_url
                    continue

                # ── Handle HTTP Status ──
                if response.status_code >= 400:
                    logger.info(
                        "fetch_upstream_error",
                        status_code=response.status_code,
                        url=normalized_url,
                    )
                    raise UpstreamHttpError(
                        status_code=response.status_code,
                    )

                # ── Content-Type Verification ──
                raw_content_type = response.headers.get("Content-Type", "").lower()
                # e.g., "text/html; charset=utf-8" -> "text/html"
                mime_type = raw_content_type.split(";")[0].strip()

                if not any(mime_type == supported for supported in SUPPORTED_CONTENT_TYPES):
                    logger.warning(
                        "unsupported_content_type",
                        content_type=raw_content_type,
                        url=normalized_url,
                    )
                    raise UnsupportedContentTypeError(
                        "The webpage is not an HTML document."
                    )

                # ── Response Size Verification ──
                content_length_header = response.headers.get("Content-Length")
                if content_length_header:
                    try:
                        content_length = int(content_length_header)
                        if content_length > MAX_BODY_BYTES:
                            raise ResponseTooLargeError("The webpage is too large to analyze.")
                    except ValueError:
                        pass

                raw_bytes = response.content
                if len(raw_bytes) > MAX_BODY_BYTES:
                    raise ResponseTooLargeError("The webpage is too large to analyze.")

                # Decode HTML with fallback to utf-8
                encoding = response.encoding or "utf-8"
                try:
                    html_text = raw_bytes.decode(encoding, errors="replace")
                except Exception:
                    html_text = raw_bytes.decode("utf-8", errors="replace")

                return FetchedPage(
                    initial_url=initial_url,
                    final_url=normalized_url,
                    html_content=html_text,
                    content_type=mime_type,
                )

        raise FetchError("Exceeded maximum allowed redirects.")


class ArticleExtractorService:
    """Extracts title, body, and metadata from raw HTML documents."""

    def extract_article(self, html_content: str) -> ExtractedArticle:
        """Parse HTML to extract clean article text and metadata.

        Args:
            html_content: Raw HTML text of the webpage.

        Returns:
            ExtractedArticle with cleaned body text, title, and language.

        Raises:
            ArticleExtractionError: If readable article content cannot be found.
        """
        if not html_content or not html_content.strip():
            raise ArticleExtractionError("Could not extract readable article content from this URL.")

        soup = BeautifulSoup(html_content, "html.parser")

        # ── 1. Extract Metadata Before Removing Tags ──
        title = self._extract_title(soup)
        canonical_url = self._extract_canonical_url(soup)

        # ── 2. Decompose Non-Content Tags ──
        unwanted_tags = [
            "script", "style", "noscript", "header", "footer", "nav",
            "aside", "form", "svg", "iframe", "button", "dialog",
            "menu", "template", "select", "option", "textarea", "input",
        ]
        for tag in soup(unwanted_tags):
            tag.decompose()

        # Remove elements with noisy boilerplate class or id attributes
        noise_pattern = re.compile(
            r"sidebar|comment|banner|ad-|advertisement|cookie|social-share|newsletter|promo|modal|popup",
            re.IGNORECASE,
        )
        for element in soup.find_all(attrs={"class": noise_pattern}):
            element.decompose()
        for element in soup.find_all(attrs={"id": noise_pattern}):
            element.decompose()

        # ── 3. Locate Main Article Container ──
        article_container = (
            soup.find("article")
            or soup.find("main")
            or soup.find(attrs={"role": "main"})
            or soup.find(class_=re.compile(r"article-body|post-content|entry-content|story-body", re.I))
            or soup.body
            or soup
        )

        # ── 4. Collect Paragraph Text ──
        paragraphs: list[str] = []
        for p in article_container.find_all(["p", "h2", "h3"]):
            p_text = p.get_text().strip()
            # Filter out very short UI fragments or cookie notices
            if len(p_text) >= 15:
                paragraphs.append(p_text)

        # Fallback if container was too specific or had no <p> tags
        if not paragraphs:
            for p in soup.find_all("p"):
                p_text = p.get_text().strip()
                if len(p_text) >= 15:
                    paragraphs.append(p_text)

        full_text = " ".join(paragraphs)

        # ── 5. Clean & Normalize Text ──
        full_text = html.unescape(full_text)
        full_text = re.sub(r"\s+", " ", full_text).strip()

        if len(full_text) < MIN_ARTICLE_TEXT_LENGTH:
            raise ArticleExtractionError(
                "Could not extract readable article content from this URL."
            )

        # Cap text at maximum length for model inference
        trimmed_text = full_text[:MAX_ARTICLE_TEXT_LENGTH]

        # ── 6. Language Detection ──
        detected_lang = self._detect_language(trimmed_text, soup)

        return ExtractedArticle(
            title=title,
            text=trimmed_text,
            canonical_url=canonical_url,
            detected_language=detected_lang,
            character_count=len(trimmed_text),
        )

    def _extract_title(self, soup: BeautifulSoup) -> str | None:
        """Extract article title from OpenGraph, Twitter, title tag, or h1."""
        # OpenGraph title
        og_title = soup.find("meta", property="og:title") or soup.find("meta", attrs={"name": "og:title"})
        if og_title and og_title.get("content"):
            return str(og_title["content"]).strip()

        # Twitter title
        tw_title = soup.find("meta", attrs={"name": "twitter:title"})
        if tw_title and tw_title.get("content"):
            return str(tw_title["content"]).strip()

        # <title> tag
        if soup.title and soup.title.string:
            clean_title = soup.title.string.strip()
            # Remove trailing site branding like " - The New York Times"
            clean_title = re.sub(r"\s*[-|–—]\s*[^-\n|]+$", "", clean_title).strip()
            if clean_title:
                return clean_title

        # First <h1>
        h1 = soup.find("h1")
        if h1:
            h1_text = h1.get_text().strip()
            if h1_text:
                return h1_text

        return None

    def _extract_canonical_url(self, soup: BeautifulSoup) -> str | None:
        """Extract canonical link if available."""
        link = soup.find("link", rel="canonical")
        if link and link.get("href"):
            return str(link["href"]).strip()
        og_url = soup.find("meta", property="og:url")
        if og_url and og_url.get("content"):
            return str(og_url["content"]).strip()
        return None

    def _detect_language(self, text: str, soup: BeautifulSoup) -> str:
        """Detect language using langdetect, falling back to html lang attribute or 'en'."""
        try:
            detected = detect(text)
            if detected:
                return str(detected)
        except Exception:
            pass

        # Check <html lang="...">
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            lang_attr = str(html_tag["lang"]).strip().split("-")[0].lower()
            if len(lang_attr) in (2, 3):
                return lang_attr

        return "en"


class UrlAnalysisService:
    """Coordinates fetching, article extraction, and AI inference."""

    def __init__(
        self,
        fetcher: UrlFetcherService | None = None,
        extractor: ArticleExtractorService | None = None,
        analysis_service: AnalysisService | None = None,
    ):
        self.fetcher = fetcher or UrlFetcherService()
        self.extractor = extractor or ArticleExtractorService()
        self.analysis_service = analysis_service or AnalysisService()

    async def analyze_url(self, url: str) -> dict[str, Any]:
        """Fetch URL, extract article text, and run detection & sentiment models.

        Args:
            url: The user-provided URL.

        Returns:
            Dictionary with extracted content and AI prediction results.
        """
        # Step 1: Safely fetch the page HTML with full SSRF & redirect checks
        page = await self.fetcher.fetch_html(url)

        # Step 2: Extract clean article text and metadata
        article = self.extractor.extract_article(page.html_content)

        # Step 3: Run existing AI models on extracted text
        ai_results = await self.analysis_service.analyze_text(article.text)

        return {
            "source_url": page.initial_url,
            "final_url": article.canonical_url or page.final_url,
            "title": article.title,
            "extracted_text": article.text,
            "detected_language": article.detected_language,
            "character_count": article.character_count,
            "credibility": ai_results["credibility"],
            "sentiment": ai_results["sentiment"],
        }
