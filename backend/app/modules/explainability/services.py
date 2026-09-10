"""Explainability services — gradient-based token attribution for XLM-RoBERTa models."""

from __future__ import annotations

import re
import time
from typing import Any

import structlog

from app.modules.detection.model import fake_news_detector
from app.modules.explainability.schemas import (
    AttributedToken,
    AttributionDirection,
    ExplainResponse,
    ModelExplanation,
)
from app.modules.sentiment.model import SentimentLabel, sentiment_analyzer

logger = structlog.get_logger(__name__)

# Constants
DEFAULT_TOP_K: int = 15
MAX_SEQ_LENGTH_FAKE_NEWS: int = 256
MAX_SEQ_LENGTH_SENTIMENT: int = 128
SPECIAL_TOKENS: frozenset[str] = frozenset({"<s>", "</s>", "<pad>", "<unk>"})


class TokenAttributionEngine:
    """Calculates gradient-based token attribution estimates for transformer models.

    Computes the input-gradient dot product (Gradient × Input) targeting the
    predicted class logit, aggregating SentencePiece subwords into clean,
    human-readable words with directional influence classifications.
    """

    def explain_fake_news(
        self,
        text: str,
        top_k: int = DEFAULT_TOP_K,
    ) -> ModelExplanation:
        """Compute token attribution for the fake news detection model.

        Args:
            text: Input text to explain.
            top_k: Number of highest-importance tokens to return.

        Returns:
            ModelExplanation with attributed words, predicted label, and latency.
        """
        t0 = time.perf_counter()

        if fake_news_detector.status.value == "not_loaded":
            fake_news_detector.load()

        # Fallback for mock mode
        if fake_news_detector.is_mock or fake_news_detector._model is None or fake_news_detector._tokenizer is None:
            return self._mock_explanation(
                model_name="fake_news",
                predicted_label="Real",
                confidence=0.95,
                text=text,
                top_k=top_k,
                elapsed_ms=round((time.perf_counter() - t0) * 1000, 2),
            )

        import torch

        model = fake_news_detector._model
        tokenizer = fake_news_detector._tokenizer
        device = fake_news_detector._device or torch.device("cpu")

        # 1. Tokenize input
        enc = tokenizer(
            text,
            return_tensors="pt",
            max_length=MAX_SEQ_LENGTH_FAKE_NEWS,
            truncation=True,
        ).to(device)

        input_ids = enc["input_ids"]
        attention_mask = enc["attention_mask"]

        # 2. Get embeddings and enable gradient tracking
        embeddings_layer = model.get_input_embeddings()
        inputs_embeds = embeddings_layer(input_ids).detach().requires_grad_(True)

        # 3. Forward pass
        outputs = model(inputs_embeds=inputs_embeds, attention_mask=attention_mask)
        logits = outputs.logits

        # Determine predicted class and confidence
        probs = torch.softmax(logits, dim=-1)
        pred_idx = logits.argmax(dim=-1).item()
        confidence = round(probs[0, pred_idx].item(), 4)

        # 0 = Fake, 1 = Real
        predicted_label = "Real" if pred_idx == 1 else "Fake"

        # 4. Backward pass on predicted class logit
        model.zero_grad()
        target_logit = logits[0, pred_idx]
        target_logit.backward()

        grads = inputs_embeds.grad  # shape: (1, seq_len, hidden_dim)

        # 5. Gradient × Input dot product
        raw_attributions = (grads * inputs_embeds).sum(dim=-1)[0]  # shape: (seq_len,)
        raw_scores = [raw_attributions[i].item() for i in range(len(raw_attributions))]

        tokens = tokenizer.convert_ids_to_tokens(input_ids[0])

        # 6. Aggregate subwords into full words and rank
        attributed_tokens = self._aggregate_subwords_and_rank(tokens, raw_scores, top_k)

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        logger.info(
            "fake_news_attribution_computed",
            predicted_label=predicted_label,
            confidence=confidence,
            token_count=len(attributed_tokens),
            latency_ms=elapsed_ms,
        )

        return ModelExplanation(
            model="fake_news",
            predicted_label=predicted_label,
            confidence=confidence,
            tokens=attributed_tokens,
            latency_ms=elapsed_ms,
            explanation_note=(
                "These tokens had the strongest gradient-based attribution estimate "
                "toward or away from the predicted credibility class logit."
            ),
        )

    def explain_sentiment(
        self,
        text: str,
        top_k: int = DEFAULT_TOP_K,
    ) -> ModelExplanation:
        """Compute token attribution for the sentiment analysis model.

        Args:
            text: Input text to explain.
            top_k: Number of highest-importance tokens to return.

        Returns:
            ModelExplanation with attributed words, predicted label, and latency.
        """
        t0 = time.perf_counter()

        if not sentiment_analyzer._loaded and not sentiment_analyzer._is_mock:
            sentiment_analyzer.load()

        # Fallback for mock mode
        if sentiment_analyzer.is_mock or sentiment_analyzer._model is None or sentiment_analyzer._tokenizer is None:
            return self._mock_explanation(
                model_name="sentiment",
                predicted_label="Positive",
                confidence=0.91,
                text=text,
                top_k=top_k,
                elapsed_ms=round((time.perf_counter() - t0) * 1000, 2),
            )

        import torch

        model = sentiment_analyzer._model
        tokenizer = sentiment_analyzer._tokenizer
        device = sentiment_analyzer._device or torch.device("cpu")

        # 1. Tokenize input (max_length=128 for sentiment model)
        enc = tokenizer(
            text,
            return_tensors="pt",
            max_length=MAX_SEQ_LENGTH_SENTIMENT,
            truncation=True,
        ).to(device)

        input_ids = enc["input_ids"]
        attention_mask = enc["attention_mask"]

        # 2. Get embeddings and enable gradient tracking
        embeddings_layer = model.get_input_embeddings()
        inputs_embeds = embeddings_layer(input_ids).detach().requires_grad_(True)

        # 3. Forward pass
        outputs = model(inputs_embeds=inputs_embeds, attention_mask=attention_mask)
        logits = outputs.logits

        # Determine predicted class and confidence
        probs = torch.softmax(logits, dim=-1)
        pred_idx = logits.argmax(dim=-1).item()
        confidence = round(probs[0, pred_idx].item(), 4)

        # 0 = Negative, 1 = Positive, 2 = Neutral
        predicted_label = SentimentLabel.CLASS_MAP.get(pred_idx, SentimentLabel.NEUTRAL)

        # 4. Backward pass on predicted class logit
        model.zero_grad()
        target_logit = logits[0, pred_idx]
        target_logit.backward()

        grads = inputs_embeds.grad

        # 5. Gradient × Input dot product
        raw_attributions = (grads * inputs_embeds).sum(dim=-1)[0]
        raw_scores = [raw_attributions[i].item() for i in range(len(raw_attributions))]

        tokens = tokenizer.convert_ids_to_tokens(input_ids[0])

        # 6. Aggregate subwords into full words and rank
        attributed_tokens = self._aggregate_subwords_and_rank(tokens, raw_scores, top_k)

        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)

        logger.info(
            "sentiment_attribution_computed",
            predicted_label=predicted_label,
            confidence=confidence,
            token_count=len(attributed_tokens),
            latency_ms=elapsed_ms,
        )

        return ModelExplanation(
            model="sentiment",
            predicted_label=predicted_label,
            confidence=confidence,
            tokens=attributed_tokens,
            latency_ms=elapsed_ms,
            explanation_note=(
                "These tokens had the strongest gradient-based attribution estimate "
                "toward or away from the predicted sentiment class logit."
            ),
        )

    def _aggregate_subwords_and_rank(
        self,
        tokens: list[str],
        raw_scores: list[float],
        top_k: int,
    ) -> list[AttributedToken]:
        """Stitch SentencePiece subwords into clean words and rank by importance.

        SentencePiece subwords starting a new word begin with ' ' (\u2581).
        Subsequent tokens without ' ' are continuations of that word.
        Special tokens ('<s>', '</s>', '<pad>') are discarded.

        Args:
            tokens: Raw string tokens from XLMRobertaTokenizer.
            raw_scores: Corresponding signed dot-product scores.
            top_k: Max tokens to return.

        Returns:
            List of AttributedToken objects sorted by absolute importance descending.
        """
        words: list[dict[str, Any]] = []
        current_word = ""
        current_score = 0.0

        for tok, score in zip(tokens, raw_scores):
            # Skip special tokens
            if tok in SPECIAL_TOKENS or not tok:
                continue

            # SentencePiece word boundary marker: \u2581 (lower one eighth block)
            is_new_word = tok.startswith("\u2581") or tok.startswith(" ")

            cleaned_tok = tok.replace("\u2581", "").replace(" ", "")

            if is_new_word:
                # Save previous word if exists
                if current_word.strip():
                    words.append({"word": current_word.strip(), "score": current_score})
                current_word = cleaned_tok
                current_score = score
            else:
                current_word += cleaned_tok
                current_score += score

        if current_word.strip():
            words.append({"word": current_word.strip(), "score": current_score})

        # Filter out punctuation-only or very short non-informative artifacts
        filtered_words: list[dict[str, Any]] = []
        for w in words:
            cleaned_text = w["word"].strip()
            # Must contain at least one alphanumeric character
            if any(c.isalnum() for c in cleaned_text):
                filtered_words.append({"word": cleaned_text, "score": w["score"]})

        if not filtered_words:
            return []

        # Sort by absolute score descending
        filtered_words.sort(key=lambda x: abs(x["score"]), reverse=True)
        top_words = filtered_words[:top_k]

        # Normalization baseline: maximum absolute attribution among top words
        max_abs = max(abs(w["score"]) for w in top_words) if top_words else 1.0
        if max_abs == 0.0:
            max_abs = 1.0

        results: list[AttributedToken] = []
        for w in top_words:
            raw_val = w["score"]
            norm_importance = round(abs(raw_val) / max_abs, 4)

            # Direction interpretation:
            # Positive raw_val = pushed logit toward predicted class ("supporting")
            # Negative raw_val = pushed logit away from predicted class ("opposing")
            direction: AttributionDirection = (
                "supporting" if raw_val > 0 else "opposing" if raw_val < 0 else "neutral"
            )

            results.append(
                AttributedToken(
                    token=w["word"],
                    importance=norm_importance,
                    normalized_score=norm_importance,
                    direction=direction,
                    raw_score=round(raw_val, 4),
                    score=round(raw_val, 4),
                )
            )

        return results

    def _mock_explanation(
        self,
        model_name: str,
        predicted_label: str,
        confidence: float,
        text: str,
        top_k: int,
        elapsed_ms: float,
    ) -> ModelExplanation:
        """Generate deterministic token attributions for mock test mode."""
        # Simple word tokenization
        raw_words = re.findall(r"\b\w+\b", text)
        unique_words = list(dict.fromkeys(raw_words))[:top_k]

        tokens: list[AttributedToken] = []
        n_words = len(unique_words)

        for i, word in enumerate(unique_words):
            # Deterministic importance decaying with position
            importance = round(max(0.1, 1.0 - (i / max(1, n_words))), 4)
            direction: AttributionDirection = "supporting" if i % 4 != 3 else "opposing"
            raw_score = round(importance if direction == "supporting" else -importance, 4)

            tokens.append(
                AttributedToken(
                    token=word,
                    importance=importance,
                    normalized_score=importance,
                    direction=direction,
                    raw_score=raw_score,
                    score=raw_score,
                )
            )

        return ModelExplanation(
            model=model_name,
            predicted_label=predicted_label,
            confidence=confidence,
            tokens=tokens,
            latency_ms=elapsed_ms,
            explanation_note=(
                "Mock attribution: gradient computation is simulated in test/mock mode."
            ),
        )


class ExplainabilityService:
    """Orchestrates end-to-end token attribution for credibility and sentiment models."""

    def __init__(self, engine: TokenAttributionEngine | None = None) -> None:
        self.engine = engine or TokenAttributionEngine()

    def explain_text(self, text: str) -> ExplainResponse:
        """Generate token attribution explanations for both models on the given text.

        Args:
            text: Validated input text (from direct input, article body, or OCR).

        Returns:
            ExplainResponse with credibility and sentiment model explanations.
        """
        start_time = time.perf_counter()

        # 1. Explain credibility prediction
        credibility_explanation = self.engine.explain_fake_news(text)

        # 2. Explain sentiment prediction
        sentiment_explanation = self.engine.explain_sentiment(text)

        total_latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        logger.info(
            "explainability_pipeline_complete",
            credibility_ms=credibility_explanation.latency_ms,
            sentiment_ms=sentiment_explanation.latency_ms,
            total_latency_ms=total_latency_ms,
            text_length=len(text),
        )

        return ExplainResponse(
            credibility=credibility_explanation,
            sentiment=sentiment_explanation,
            credibility_explanation=credibility_explanation,
            sentiment_explanation=sentiment_explanation,
            total_latency_ms=total_latency_ms,
        )
