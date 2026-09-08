"""Sentiment Analysis Model — XLM-RoBERTa based classifier.

Loads a fine-tuned XLM-RoBERTa model for 3-class sentiment classification.
Falls back to mock predictions when the model is not available.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)


class SentimentLabel:
    """Sentiment class labels."""

    NEGATIVE = "Negative"
    NEUTRAL = "Neutral"
    POSITIVE = "Positive"

    # This mapping MUST match the mapping used during training:
    # 0 = Negative
    # 1 = Positive
    # 2 = Neutral
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

    Loads the fine-tuned model from the project's models directory.
    If the model cannot be loaded, falls back to mock predictions.
    """

    def __init__(
        self,
        model_path: str | None = None,
    ) -> None:
        # Project root:
        # aiproject/
        # ├── backend/
        # │   └── app/
        # │       └── modules/
        # │           └── sentiment/
        # │               └── model.py
        # └── models/
        #     └── sentiment_model/
        project_root = Path(__file__).resolve().parents[4]

        self.model_path = (
            Path(model_path)
            if model_path
            else project_root / "models" / "sentiment_model"
        )

        self._model: object | None = None
        self._tokenizer: object | None = None
        self._device: object | None = None

        self._loaded: bool = False
        self._is_mock: bool = False

    @property
    def is_ready(self) -> bool:
        """Return True if model can make predictions."""
        return self._loaded or self._is_mock

    @property
    def is_mock(self) -> bool:
        """Return True if using mock predictions."""
        return self._is_mock

    def load(self) -> None:
        """Load the fine-tuned model from disk.

        Falls back to mock mode if the model cannot be loaded.
        """

        try:
            import torch
            from transformers import (
                XLMRobertaForSequenceClassification,
                XLMRobertaTokenizer,
            )

            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Sentiment model directory not found: "
                    f"{self.model_path}"
                )

            self._device = torch.device(
                "cuda" if torch.cuda.is_available() else "cpu"
            )

            self._tokenizer = XLMRobertaTokenizer.from_pretrained(
                str(self.model_path)
            )

            self._model = (
                XLMRobertaForSequenceClassification.from_pretrained(
                    str(self.model_path)
                )
            )

            self._model.to(self._device)  # type: ignore[union-attr]
            self._model.eval()  # type: ignore[union-attr]

            self._loaded = True
            self._is_mock = False

            logger.info(
                "sentiment_model_loaded",
                model_path=str(self.model_path),
                device=str(self._device),
            )

        except Exception as exc:
            logger.warning(
                "sentiment_model_load_failed",
                model_path=str(self.model_path),
                error=str(exc),
                fallback="mock",
            )

            self._model = None
            self._tokenizer = None
            self._loaded = False
            self._is_mock = True

    def predict(self, text: str) -> PredictionResult:
        """Predict the sentiment of the input text.

        Args:
            text: The input text to classify.

        Returns:
            PredictionResult containing the predicted sentiment
            and confidence score.
        """

        if not self._loaded and not self._is_mock:
            self.load()

        # Mock fallback
        if self._model is None or self._tokenizer is None:
            logger.debug(
                "sentiment_mock_prediction",
                text_length=len(text),
            )

            return PredictionResult(
                label=SentimentLabel.NEGATIVE,
                confidence=0.88,
            )

        import torch

        # IMPORTANT:
        # The sentiment model was trained with max_length=128.
        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=128,
        ).to(self._device)

        with torch.no_grad():
            outputs = self._model(**inputs)  # type: ignore[misc]

            probabilities = torch.nn.functional.softmax(
                outputs.logits,
                dim=-1,
            )

            confidence, predicted_class = torch.max(
                probabilities,
                dim=-1,
            )

        # Training mapping:
        # 0 = Negative
        # 1 = Positive
        # 2 = Neutral
        label = SentimentLabel.CLASS_MAP.get(
            predicted_class.item(),
            SentimentLabel.NEUTRAL,
        )

        result = PredictionResult(
            label=label,
            confidence=round(confidence.item(), 4),
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