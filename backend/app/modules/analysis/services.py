"""Analysis service — orchestrates fake news detection and sentiment analysis.

Coordinates calls to the detection and sentiment models, returning
combined results. Runs model loading and inference asynchronously.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import structlog

from app.config import settings
from app.modules.detection.model import fake_news_detector
from app.modules.sentiment.model import sentiment_analyzer

logger = structlog.get_logger(__name__)

# Bounded semaphore to prevent unbounded thread execution and RAM exhaustion
_inference_semaphore = asyncio.Semaphore(settings.model_max_concurrency)


class AnalysisService:
    """Orchestrates text analysis through detection and sentiment models.

    Handles lazy model loading and executes CPU-intensive tensor operations
    in worker threads to prevent event loop starvation.
    """

    async def analyze_text(self, text: str) -> dict[str, Any]:
        """Run text through both analysis models concurrently off the event loop.

        Args:
            text: The input text to analyze.

        Returns:
            Dictionary with 'credibility' and 'sentiment' sub-dicts,
            each containing 'label', 'confidence', and 'is_mock'.
        """
        async with _inference_semaphore:
            # ── Execute Detection and Sentiment in parallel threads ──
            t0 = time.perf_counter()
            detection_task = asyncio.to_thread(fake_news_detector.predict, text)
            sentiment_task = asyncio.to_thread(sentiment_analyzer.predict, text)

            detection_result, sentiment_result = await asyncio.gather(
                detection_task,
                sentiment_task,
            )
            total_inference_ms = round((time.perf_counter() - t0) * 1000, 2)

        logger.info(
            "analysis_models_executed",
            total_inference_ms=total_inference_ms,
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
