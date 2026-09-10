"""Pydantic schemas for explainability and token attribution."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

AttributionDirection = Literal["supporting", "opposing", "neutral"]


class AttributedToken(BaseModel):
    """A token or subword-merged word with its estimated model attribution."""

    token: str = Field(
        ...,
        description="Cleaned, human-readable word or token (special tokens and subword prefixes removed).",
        examples=["government", "vaccine"],
    )
    importance: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Normalized attribution magnitude (0.0–1.0) representing relative influence on the model prediction.",
        examples=[0.85],
    )
    direction: AttributionDirection = Field(
        ...,
        description=(
            "'supporting' if token orientation pushed the logit toward the predicted class; "
            "'opposing' if it pushed the logit away from the predicted class."
        ),
        examples=["supporting"],
    )
    raw_score: float = Field(
        ...,
        description="Raw signed attribution estimate from the input-gradient dot product.",
        examples=[0.1425],
    )
    score: float = Field(
        default=0.0,
        description="Signed attribution score (alias for raw_score).",
    )
    normalized_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Normalized magnitude between 0.0 and 1.0 (alias for importance).",
    )


class ModelExplanation(BaseModel):
    """Attribution explanation for a specific classification model."""

    model: str = Field(
        ...,
        description="Name of the model: 'fake_news' or 'sentiment'.",
        examples=["fake_news"],
    )
    method: str = Field(
        default="Gradient × Input",
        description="Attribution method used.",
    )
    predicted_label: str = Field(
        ...,
        description="The class predicted by the model (the attribution target).",
        examples=["Fake"],
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Prediction confidence score (0.0–1.0).",
        examples=[0.9538],
    )
    tokens: list[AttributedToken] = Field(
        ...,
        description="Top influential tokens ranked by absolute attribution magnitude.",
    )
    latency_ms: float = Field(
        ...,
        ge=0.0,
        description="Attribution computation latency in milliseconds for this model.",
        examples=[315.4],
    )
    explanation_note: str = Field(
        default="These tokens had the strongest gradient-based attribution estimate for the predicted class logit.",
        description="Scientific caveat explaining the attribution estimate.",
    )


class ExplainRequest(BaseModel):
    """Request payload for text explainability."""

    text: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="The analyzed text content to explain (10–50,000 characters).",
        examples=[
            "Government officials announce unexpected economic relief package for small businesses."
        ],
    )


class ExplainResponse(BaseModel):
    """Unified explainability response containing credibility and sentiment attributions."""

    credibility: ModelExplanation = Field(
        ...,
        description="Attribution explanation for fake news detection model.",
    )
    sentiment: ModelExplanation = Field(
        ...,
        description="Attribution explanation for sentiment analysis model.",
    )
    credibility_explanation: ModelExplanation | None = Field(
        default=None,
        description="Alias for credibility.",
    )
    sentiment_explanation: ModelExplanation | None = Field(
        default=None,
        description="Alias for sentiment.",
    )
    total_latency_ms: float = Field(
        ...,
        ge=0.0,
        description="Total end-to-end explainability pipeline execution latency in milliseconds.",
        examples=[648.2],
    )
    disclaimer: str = Field(
        default=(
            "Gradient × Input attribution estimates token influence on the predicted-class logit. "
            "This reflects model sensitivity, not causal proof or factual verification."
        ),
        description="Educational disclaimer explaining the non-causal nature of token attributions.",
    )
