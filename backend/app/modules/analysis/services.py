"""Analysis service — orchestrates fake news detection and sentiment analysis.

Coordinates calls to the detection and sentiment models, returning
combined results. Runs model loading and inference asynchronously.
"""

from __future__ import annotations

import time
from typing import Any

import structlog

from app.modules.detection.model import fake_news_detector
from app.modules.sentiment.model import sentiment_analyzer

logger = structlog.get_logger(__name__)


class AnalysisService:
    """Orchestrates text analysis through detection and sentiment models.

    Handles lazy model loading and provides timing telemetry.
    """

    async def analyze_text(self, text: str) -> dict[str, Any]:
        """Run text through both analysis models.

        Args:
            text: The input text to analyze.

        Returns:
            Dictionary with 'credibility' and 'sentiment' sub-dicts,
            each containing 'label', 'confidence', and 'is_mock'.
        """
        # ── Fake News Detection ──
        t0 = time.perf_counter()
        detection_result = fake_news_detector.predict(text)
        detection_ms = round((time.perf_counter() - t0) * 1000, 2)

        # ── Sentiment Analysis ──
        t1 = time.perf_counter()
        sentiment_result = sentiment_analyzer.predict(text)
        sentiment_ms = round((time.perf_counter() - t1) * 1000, 2)

        logger.info(
            "analysis_models_executed",
            detection_ms=detection_ms,
            sentiment_ms=sentiment_ms,
            detection_mock=fake_news_detector.status.value
            if hasattr(fake_news_detector, "status")
            else "unknown",
            sentiment_mock=sentiment_analyzer.is_mock,
        )

        return {
            "credibility": {
                "label": detection_result.label,
                "confidence": detection_result.confidence,
                "is_mock": fake_news_detector.status.value == "mock",
            },
            "sentiment": {
                "label": sentiment_result.label,
                "confidence": sentiment_result.confidence,
                "is_mock": sentiment_analyzer.is_mock,
            },
        }
