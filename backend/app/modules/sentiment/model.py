"""Sentiment Analysis Model — XLM-RoBERTa based classifier.

Loads a fine-tuned XLM-RoBERTa model for sentiment classification.
Falls back to mock predictions when the model is not yet trained.
"""

from __future__ import annotations

from dataclasses import dataclass

import structlog

logger = structlog.get_logger(__name__)


class SentimentLabel:
    """Sentiment class labels."""

    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"
    POSITIVE = "Positive"

    CLASS_MAP: dict[int, str] = {
        0: NEGATIVE,
        1: POSITIVE,
        2: NEUTRAL,
    }


@dataclass
class PredictionResult:
    """Result of a sentiment prediction."""

    label: str
    confidence: float


class SentimentModel:
    """XLM-RoBERTa sentiment analysis model.

    Loads the model from a local directory. If the model is not available
    (not yet trained), falls back to mock predictions.

    Attributes:
        model_path: Path to the saved model directory.
    """

    def __init__(self, model_path: str = "models/sentiment_model") -> None:
        self.model_path = model_path
        self._model: object | None = None
        self._tokenizer: object | None = None
        self._device: object | None = None
        self._loaded: bool = False
        self._is_mock: bool = False

    @property
    def is_ready(self) -> bool:
        """Return True if model can make predictions (real or mock)."""
        return self._loaded or self._is_mock

    @property
    def is_mock(self) -> bool:
        """Return True if using mock predictions."""
        return self._is_mock

    def load(self) -> None:
        """Load the model from disk. Falls back to mock mode on failure."""
        try:
            import torch
            from transformers import (
                XLMRobertaForSequenceClassification,
                XLMRobertaTokenizer,
            )

            self._device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )
            self._tokenizer = XLMRobertaTokenizer.from_pretrained(
                self.model_path
            )
            self._model = XLMRobertaForSequenceClassification.from_pretrained(
                self.model_path
            )
            self._model.to(self._device)  # type: ignore[union-attr]
            self._model.eval()  # type: ignore[union-attr]
            self._loaded = True
            self._is_mock = False
            logger.info(
                "sentiment_model_loaded",
                model_path=self.model_path,
                device=str(self._device),
            )
        except Exception as exc:
            logger.warning(
                "sentiment_model_load_failed",
                model_path=self.model_path,
                error=str(exc),
                fallback="mock",
            )
            self._model = None
            self._tokenizer = None
            self._is_mock = True

    def predict(self, text: str) -> PredictionResult:
        """Predict the sentiment of the input text.

        Args:
            text: The input text to classify.

        Returns:
            PredictionResult with label and confidence.
        """
        if not self._loaded and not self._is_mock:
            self.load()

        if self._model is None or self._tokenizer is None:
            logger.debug("sentiment_mock_prediction", text_length=len(text))
            return PredictionResult(
                label=SentimentLabel.NEGATIVE, confidence=0.88
            )

        import torch

        inputs = self._tokenizer(  # type: ignore[misc]
            text,
            return_tensors="pt",
            truncation=True,
            max_length=128,
        ).to(self._device)

        with torch.no_grad():
            outputs = self._model(**inputs)  # type: ignore[misc]
            probabilities = torch.nn.functional.softmax(
                outputs.logits, dim=-1
            )
            confidence, predicted_class = torch.max(probabilities, dim=-1)

        label = SentimentLabel.CLASS_MAP.get(
            predicted_class.item(), SentimentLabel.NEUTRAL
        )
        result = PredictionResult(
            label=label, confidence=round(confidence.item(), 4)
        )

        logger.info(
            "sentiment_prediction",
            label=result.label,
            confidence=result.confidence,
            text_length=len(text),
        )
        return result


# Singleton instance
sentiment_analyzer = SentimentModel()
