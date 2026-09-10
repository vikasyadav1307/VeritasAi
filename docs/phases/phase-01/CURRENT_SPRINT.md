# Phase 3 — Milestone 3.6: Explainability (Gradient × Input Token Attribution)

| Field | Value |
|---|---|
| **Phase** | 3 — Core Platform Features |
| **Milestone** | 3.6: Explainability (Gradient × Input Token Attribution) |
| **Started** | 2026-09-09 |
| **Target End** | 2026-09-09 |
| **Status** | Implemented & Verified (Uncommitted) |

## Sprint Objective

Implement a token-level gradient attribution layer for VeritasAI's multilingual XLM-RoBERTa models (Fake News detection and Sentiment Analysis). Using Gradient × Input ($A_i = \sum_d \nabla_{E_i} L_{c^*} \odot E_{i,d}$) on input embeddings targeting the predicted class logit, explain which words contributed toward or away from the model's prediction. Present explanations with educational non-causal disclaimers, on-demand execution, subword stitching, supporting/opposing direction classifications, normalized importance scores, and latency tracking across Text, URL, Image OCR, and History modalities.

## Prerequisites — VERIFIED

| Prerequisite | Status |
|---|---|
| Milestone 3.1: Analysis History Persistence | ✅ Done & Verified |
| Milestone 3.2: Analytics Dashboard | ✅ Implemented & Verified |
| Milestone 3.3: Authentication & IDOR Protection | ✅ Implemented & Verified |
| Milestone 3.4: URL Analysis & SSRF Defenses | ✅ Implemented & Verified |
| Milestone 3.5: Image Analysis / OCR | ✅ Implemented & Verified |
| XLM-RoBERTa real inference pipeline | ✅ Verified |
| PostgreSQL database running / Alembic ready | ✅ Verified |
| React frontend running / building | ✅ Verified |

## Tasks

### Backend Explainability Module
- [x] Create `backend/app/modules/explainability/schemas.py`:
  - `AttributedToken` (`token`, `importance`, `direction`, `raw_score`, `score`, `normalized_score`)
  - `ModelExplanation` (`model`, `predicted_label`, `confidence`, `method`, `tokens`, `latency_ms`, `explanation_note`)
  - `ExplainRequest` (10–50,000 chars)
  - `ExplainResponse` (`credibility`, `sentiment`, `total_latency_ms`, `disclaimer`)
- [x] Create `backend/app/modules/explainability/services.py`:
  - `TokenAttributionEngine`: Gradient × Input backpropagation on input embeddings targeting predicted class logit
  - SentencePiece subword aggregation (`\u2581`) into whole words, special token removal (`<s>`, `</s>`, `<pad>`, `<unk>`)
  - Sign interpretation: positive = `"supporting"` (toward predicted class logit), negative = `"opposing"` (away from it)
  - Normalized importance: $[0.0, 1.0]$ with highest magnitude token at 1.0
  - `ExplainabilityService`: Orchestrator for credibility and sentiment model attributions
- [x] Create `backend/app/modules/explainability/router.py`:
  - `POST /api/v1/explain/text` authenticated via `get_current_user`
  - Returns unified `ExplainResponse`
- [x] Mount `explainability_router` in `backend/app/main.py` under `/api/v1`
- [x] Add optional `extracted_text` field to `AnalyzeUrlResponse` in `backend/app/modules/url_analysis/schemas.py` and `router.py`

### Milestone 3.7 — Multilingual Language Detection & Presentation Translation
- [x] Create `backend/app/modules/translation/`:
  - `detector.py`: Deterministic `LanguageDetector` with `langdetect` (`seed = 0`), strict non-fallback returning `"unknown"` with confidence `None` for short/symbol text
  - `languages.py`: 14 supported languages registry, code normalization, and display names
  - `schemas.py`: Pydantic V2 schemas for language registry and translation requests/responses
  - `services.py`: Decoupled `TranslationService` with `MyMemoryTranslationProvider`, LRU caching, chunking, and 503 fallback
  - `router.py`: `GET /api/v1/languages` and `POST /api/v1/translate` endpoints
- [x] Mount `translation_router` in `backend/app/main.py`
- [x] Update `backend/app/modules/analysis/router.py` to include detected language in `AnalyzeResponse` without altering model inputs
- [x] Create backend integration test suite `backend/tests/integration/test_translation.py` (16 tests)
- [x] Run full backend test suite: **133 tests passing with 0 failures**
- [x] Create frontend `TranslationPanel.tsx` in `frontend/src/features/analyze/components/`
- [x] Integrate `TranslationPanel` into `AnalyzePage.tsx` and `HistoryPage.tsx`
- [x] Create frontend Vitest suite `frontend/src/features/analyze/pages/Translation.test.tsx` (5 tests)
- [x] Full frontend Vitest suite: **17 tests passing with 0 failures**
- [x] Production build clean: `npm --prefix frontend run build` succeeds in ~1.5s
- [x] Add experimental benchmark script `scripts/benchmark_multilingual.py`

### Documentation & Architecture
- [x] Add `ADR-016: Gradient × Input Token Attribution for Model Explainability` to `docs/10_TECHNICAL_DECISIONS.md`
- [x] Add `ADR-017: Presentation-Only Multilingual Translation Architecture and Deterministic Language Detection` to `docs/10_TECHNICAL_DECISIONS.md`
- [x] Update `docs/09_PROGRESS_LOG.md`
- [x] Update `docs/12_CHANGELOG.md`
- [x] Update `docs/prompts/ai_context.md`

