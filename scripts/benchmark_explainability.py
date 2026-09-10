"""Benchmark script to measure and report exact inference vs explainability latencies."""

import sys
import time
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.modules.detection.model import fake_news_detector
from app.modules.sentiment.model import sentiment_analyzer
from app.modules.explainability.services import ExplainabilityService

TEST_TEXT = (
    "Scientists at MIT announced a major breakthrough in nuclear fusion energy today, "
    "achieving net energy gain in a compact magnetic confinement reactor."
)

print("=" * 60)
print("VERITASAI MILESTONE 3.6 LATENCY BENCHMARK")
print("=" * 60)

# Warm up / ensure models loaded
print("\n[1] Checking models...")
if fake_news_detector.status.value == "not_loaded":
    fake_news_detector.load()
if sentiment_analyzer._model is None:
    sentiment_analyzer.load()

print(f"Fake news detector mock: {fake_news_detector.is_mock}")
print(f"Sentiment analyzer mock: {sentiment_analyzer.is_mock}")

# Measure ordinary forward inference
print("\n[2] Measuring Ordinary Forward Inference...")
t0 = time.perf_counter()
fn_pred = fake_news_detector.predict(TEST_TEXT)
fn_infer_ms = (time.perf_counter() - t0) * 1000

t0 = time.perf_counter()
sent_pred = sentiment_analyzer.predict(TEST_TEXT)
sent_infer_ms = (time.perf_counter() - t0) * 1000

total_infer_ms = fn_infer_ms + sent_infer_ms
print(f"  - Fake News Forward Inference : {fn_infer_ms:.2f} ms ({fn_pred.label}, {fn_pred.confidence:.4f})")
print(f"  - Sentiment Forward Inference : {sent_infer_ms:.2f} ms ({sent_pred.label}, {sent_pred.confidence:.4f})")
print(f"  - Total Ordinary Inference    : {total_infer_ms:.2f} ms")

# Measure Explainability (Gradient x Input)
print("\n[3] Measuring Gradient × Input Attribution...")
service = ExplainabilityService()

t0 = time.perf_counter()
explanation = service.explain_text(TEST_TEXT)
total_explain_wall_ms = (time.perf_counter() - t0) * 1000

fn_attr_ms = explanation.credibility.latency_ms
sent_attr_ms = explanation.sentiment.latency_ms

print(f"  - Fake News Attribution       : {fn_attr_ms:.2f} ms (Target: {explanation.credibility.predicted_label}, Conf: {explanation.credibility.confidence:.4f})")
print(f"  - Sentiment Attribution       : {sent_attr_ms:.2f} ms (Target: {explanation.sentiment.predicted_label}, Conf: {explanation.sentiment.confidence:.4f})")
print(f"  - Total Pipeline Latency      : {explanation.total_latency_ms:.2f} ms (Wall clock: {total_explain_wall_ms:.2f} ms)")

print("\n[4] Ratio Analysis:")
print(f"  - Fake News (Attr / Infer)    : {fn_attr_ms / fn_infer_ms:.2f}x")
print(f"  - Sentiment (Attr / Infer)    : {sent_attr_ms / sent_infer_ms:.2f}x")
print(f"  - Total (Attr / Infer)        : {explanation.total_latency_ms / total_infer_ms:.2f}x")

print("\n[5] Sample Top Attributed Tokens:")
print("  Credibility Tokens:")
for t in explanation.credibility.tokens[:5]:
    print(f"    - {t.token:15s} raw={t.score:+.4f} ({t.direction:10s}) norm={t.normalized_score:.2f}")
print("  Sentiment Tokens:")
for t in explanation.sentiment.tokens[:5]:
    print(f"    - {t.token:15s} raw={t.score:+.4f} ({t.direction:10s}) norm={t.normalized_score:.2f}")

print("\n" + "=" * 60)
