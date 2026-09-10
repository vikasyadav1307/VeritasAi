"""Comprehensive test suite for Explainability (Milestone 3.6).

Tests cover:
1. Input validation & constraints (min/max length, missing text).
2. Authentication requirements (401 unauthenticated, 200 authenticated).
3. Response schema & structure (credibility_explanation, sentiment_explanation, disclaimer, latencies).
4. Sign interpretation:
   - Positive score (> 0) -> direction == "supporting" (influence toward predicted-class logit)
   - Negative score (< 0) -> direction == "opposing" (influence away from predicted-class logit)
5. Subword merging and token cleaning:
   - SentencePiece artifacts removed (\u2581, <s>, </s>, <pad>)
   - Subwords merged into words
   - Max tokens <= 15
   - normalized_score within [0.0, 1.0] with max at 1.0
6. Mock fallback and real inference verification.
"""

import uuid
import pytest
from httpx import AsyncClient

from app.modules.explainability.services import TokenAttributionEngine
from app.modules.explainability.schemas import AttributedToken, ModelExplanation


SAMPLE_ANALYZED_TEXT = (
    "Scientists at MIT announced a major breakthrough in nuclear fusion energy today, "
    "achieving net energy gain in a compact magnetic confinement reactor."
)


@pytest.fixture
async def auth_headers(client: AsyncClient) -> dict[str, str]:
    """Helper fixture to register a test user and obtain auth headers."""
    unique_id = uuid.uuid4().hex[:8]
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"explain_user_{unique_id}@example.com",
            "username": f"explainer_{unique_id}",
            "password": "Password123!",
        },
    )
    assert res.status_code == 201
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════════════════
# 1. AUTHENTICATION & ACCESS CONTROL
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_explain_unauthenticated_returns_401(client: AsyncClient) -> None:
    """POST /api/v1/explain/text without token must return 401."""
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": SAMPLE_ANALYZED_TEXT},
    )
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_explain_authenticated_returns_200(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """POST /api/v1/explain/text with valid token must return 200."""
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": SAMPLE_ANALYZED_TEXT},
        headers=auth_headers,
    )
    assert res.status_code == 200


# ══════════════════════════════════════════════════════════════════════════════
# 2. INPUT VALIDATION
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_explain_missing_text_returns_422(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Missing 'text' key returns 422 Unprocessable Entity."""
    res = await client.post(
        "/api/v1/explain/text",
        json={},
        headers=auth_headers,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_explain_text_too_short_returns_422(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Text shorter than 10 characters returns 422."""
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": "Short"},
        headers=auth_headers,
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_explain_text_too_long_returns_422(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Text exceeding 50,000 characters returns 422."""
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": "A" * 50_001},
        headers=auth_headers,
    )
    assert res.status_code == 422


# ══════════════════════════════════════════════════════════════════════════════
# 3. RESPONSE SCHEMA & METRIC ACCURACY
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_explain_response_structure_and_disclaimer(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Validate full response schema, educational disclaimer, and latencies."""
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": SAMPLE_ANALYZED_TEXT},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()

    # Top-level keys
    assert "credibility_explanation" in data
    assert "sentiment_explanation" in data
    assert "total_latency_ms" in data
    assert "disclaimer" in data

    # Non-causal educational disclaimer check
    disclaimer = data["disclaimer"]
    assert "Gradient × Input attribution estimates token influence" in disclaimer
    assert "not causal proof or factual verification" in disclaimer

    # Credibility Explanation
    cred = data["credibility_explanation"]
    assert "predicted_label" in cred
    assert "confidence" in cred
    assert "method" in cred
    assert "tokens" in cred
    assert "latency_ms" in cred
    assert cred["method"] == "Gradient × Input"
    assert cred["latency_ms"] >= 0

    # Sentiment Explanation
    sent = data["sentiment_explanation"]
    assert "predicted_label" in sent
    assert "confidence" in sent
    assert "method" in sent
    assert "tokens" in sent
    assert "latency_ms" in sent
    assert sent["method"] == "Gradient × Input"
    assert sent["latency_ms"] >= 0

    assert data["total_latency_ms"] >= 0


# ══════════════════════════════════════════════════════════════════════════════
# 4. SIGN INTERPRETATION & TOKEN NORMALIZATION
# ══════════════════════════════════════════════════════════════════════════════


@pytest.mark.asyncio
async def test_explain_sign_interpretation_and_token_bounds(
    client: AsyncClient, auth_headers: dict[str, str]
) -> None:
    """Verify sign interpretation, token count limits, and score normalization.
    
    Positive attribution = contribution toward the targeted predicted-class logit ('supporting').
    Negative attribution = contribution away from it ('opposing').
    """
    res = await client.post(
        "/api/v1/explain/text",
        json={"text": SAMPLE_ANALYZED_TEXT},
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()

    for explanation in [data["credibility_explanation"], data["sentiment_explanation"]]:
        tokens = explanation["tokens"]
        # Max top-15 tokens
        assert len(tokens) <= 15
        assert len(tokens) > 0

        for tok in tokens:
            assert "token" in tok
            assert "score" in tok
            assert "direction" in tok
            assert "normalized_score" in tok

            # Sign interpretation
            if tok["score"] >= 0:
                assert tok["direction"] == "supporting"
            else:
                assert tok["direction"] == "opposing"

            # Normalization bounds [0.0, 1.0]
            assert 0.0 <= tok["normalized_score"] <= 1.0

            # Cleaned tokens: No SentencePiece meta characters or special tags
            assert "\u2581" not in tok["token"]
            assert tok["token"] not in ["<s>", "</s>", "<pad>", "<unk>"]

        # The first token (highest influence) must have normalized_score == 1.0
        assert tokens[0]["normalized_score"] == pytest.approx(1.0, abs=1e-3)


# ══════════════════════════════════════════════════════════════════════════════
# 5. UNIT TESTS FOR ATTRIBUTION ENGINE LOGIC
# ══════════════════════════════════════════════════════════════════════════════


def test_token_attribution_engine_aggregation_and_ranking():
    """Unit test for _aggregate_subwords_and_rank in TokenAttributionEngine."""
    engine = TokenAttributionEngine()

    raw_tokens = ["<s>", " Sci", "ent", "ists", " at", " MIT", "</s>"]
    raw_scores = [0.0, 0.4, 0.2, 0.1, 0.05, -0.8, 0.0]

    attributed = engine._aggregate_subwords_and_rank(
        tokens=raw_tokens,
        raw_scores=raw_scores,
        top_k=5,
    )

    assert len(attributed) <= 5

    # 'MIT' had raw score -0.8 -> magnitude 0.8 (highest magnitude)
    assert attributed[0].token == "MIT"
    assert attributed[0].score == pytest.approx(-0.8)
    assert attributed[0].direction == "opposing"
    assert attributed[0].normalized_score == pytest.approx(1.0)

    # 'Scientists' was merged from [' Sci', 'ent', 'ists'] with scores 0.4 + 0.2 + 0.1 = 0.7
    scientists_tok = next((t for t in attributed if t.token == "Scientists"), None)
    assert scientists_tok is not None
    assert scientists_tok.score == pytest.approx(0.7)
    assert scientists_tok.direction == "supporting"
    assert scientists_tok.normalized_score == pytest.approx(0.7 / 0.8)


def test_token_attribution_engine_mock_fallback():
    """Unit test verifying mock explanation fallback."""
    engine = TokenAttributionEngine()
    explanation = engine._mock_explanation(
        model_name="fake_news",
        predicted_label="Real",
        confidence=0.92,
        text="Breaking news update regarding climate summit",
        top_k=5,
        elapsed_ms=12.5,
    )

    assert isinstance(explanation, ModelExplanation)
    assert explanation.predicted_label == "Real"
    assert explanation.confidence == 0.92
    assert explanation.method == "Gradient × Input"
    assert len(explanation.tokens) > 0
    assert len(explanation.tokens) <= 15
    for t in explanation.tokens:
        assert t.direction in ("supporting", "opposing")
        assert 0.0 <= t.normalized_score <= 1.0
