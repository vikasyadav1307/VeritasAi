"""Fake News Detection Model — XLM-RoBERTa based classifier.

Loads a fine-tuned XLM-RoBERTa model for binary fake/real classification.
Falls back to mock predictions when the model is not available.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)


class ModelStatus(str, Enum):
    """Status of a loaded model."""

    NOT_LOADED = "not_loaded"
    LOADED = "loaded"
    MOCK = "mock"


@dataclass
class PredictionResult:
    """Result of a fake news prediction."""

    label: str
    confidence: float


class FakeNewsModel:
    """XLM-RoBERTa fake news detection model."""

    def __init__(
        self,
        model_path: str | None = None,
    ) -> None:
        # Project root: aiproject/
        project_root = Path(__file__).resolve().parents[4]

        self.model_path = (
            Path(model_path)
            if model_path
            else project_root / "models" / "fake_news_model"
        )

        self._status: ModelStatus = ModelStatus.NOT_LOADED
        self._model: object | None = None
        self._tokenizer: object | None = None
        self._device: object | None = None

    @property
    def status(self) -> ModelStatus:
        """Return current model status."""
        return self._status

    @property
    def is_ready(self) -> bool:
        """Return True if model can make predictions."""
        return self._status in (
            ModelStatus.LOADED,
            ModelStatus.MOCK,
        )

    @property
    def is_mock(self) -> bool:
        """Return True when using the mock fallback."""
        return self._status == ModelStatus.MOCK

    def load(self) -> None:
        """Load the fine-tuned model from disk."""

        try:
            import torch
            from transformers import (
                XLMRobertaForSequenceClassification,
                XLMRobertaTokenizer,
            )

            if not self.model_path.exists():
                raise FileNotFoundError(
                    f"Model directory not found: {self.model_path}"
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

            self._status = ModelStatus.LOADED

            logger.info(
                "fake_news_model_loaded",
                model_path=str(self.model_path),
                device=str(self._device),
            )

        except Exception as exc:
            logger.warning(
                "fake_news_model_load_failed",
                model_path=str(self.model_path),
                error=str(exc),
                fallback="mock",
            )

            self._model = None
            self._tokenizer = None
            self._status = ModelStatus.MOCK

    def predict(self, text: str) -> PredictionResult:
        """Predict whether text is fake or real news."""

        if self._status == ModelStatus.NOT_LOADED:
            self.load()

        if self._model is None or self._tokenizer is None:
            logger.debug(
                "fake_news_mock_prediction",
                text_length=len(text),
            )
            return PredictionResult(
                label="Real",
                confidence=0.95,
            )

        import torch

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
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

        # Model mapping:
        # 0 = Fake
        # 1 = Real
        label = (
            "Real"
            if predicted_class.item() == 1
            else "Fake"
        )

        result = PredictionResult(
            label=label,
            confidence=round(confidence.item(), 4),
        )

        logger.info(
            "fake_news_prediction",
            label=result.label,
            confidence=result.confidence,
            text_length=len(text),
        )

        return result


# Singleton instance
fake_news_detector = FakeNewsModel()