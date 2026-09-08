# 12 — Changelog

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-12                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

All notable changes to this project will be documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Complete documentation suite (19 documents + AI context file)
  - Project Vision, Architecture, Tech Stack, Development Roadmap
  - Database Design, API Specification, AI Pipeline, UI/UX Design
  - Coding Guidelines, Progress Log, Technical Decisions, Backlog
  - Changelog, Deployment Plan, Testing Strategy, Security Plan
  - Risk Analysis, Folder Structure, Project Timeline
  - AI Context (`docs/prompts/ai_context.md`)

#### Sprint 2b — API Hardening (2026-08-21)
- AI session quick-start guide (`docs/prompts/START_HERE.md`)
- AI coding/doc rules (`docs/prompts/AI_RULES.md`)
- Sprint definition document (`docs/phases/phase-01/CURRENT_SPRINT.md`)
- Input validation test suite (`test_analysis_validation.py`, 8 tests)

#### Sprint 3 — Model Training & Integration (2026-09-08)
- Trained XLM-RoBERTa fake news detection model on Google Colab (98.39% accuracy, 98.39% F1)
- Trained XLM-RoBERTa sentiment analysis model on Google Colab (97.95% accuracy, 97.94% F1)
- Model weights: `models/fake_news_model/`, `models/sentiment_model/`
- Colab training scripts: `notebooks/03_train_fake_news.py`, `notebooks/04_train_sentiment.py`

#### Sprint 4 — Frontend Text Analysis (2026-09-08)
- TypeScript API types: `AnalyzeRequest`, `CredibilityResult`, `SentimentResult`, `AnalyzeResponse`
- `analyzeText()` API function calling `POST /api/v1/analyze/text`
- Functional Analyze page with controlled textarea, validation, loading state, error handling
- Results dashboard with Credibility and Sentiment cards, confidence bars, mock badges
- Character count, Clear button, processing time display
- Configured FastAPI backend `cors_origins` to include `http://127.0.0.1:5173` and `http://127.0.0.1:3000`
- Aligned frontend default `API_BASE_URL` to `http://127.0.0.1:8000`
- Fixed `vite.config.ts` Vitest configuration typing via `vitest/config` import

### Changed

#### Sprint 2b — API Hardening (2026-08-21)
- `analysis/router.py` — Pydantic V2 models, `is_mock` flag, `processing_time_ms`, structured errors
- `analysis/services.py` — async with structlog logging and per-model timing telemetry
- `detection/model.py` — replaced `print()` with structlog, added `ModelStatus` enum, `PredictionResult` dataclass
- `sentiment/model.py` — same structlog/types improvements as detection model
- `ai_context.md` — complete rewrite to remove false state claims

#### Sprint 3 — Model Integration (2026-09-08)
- `detection/model.py` — fixed model path to resolve from project root (models now load as real, not mock)
- `sentiment/model.py` — fixed model path + corrected `CLASS_MAP` to match training labels
- `analysis/router.py` — minor adjustments for real model support

#### Sprint 4 — Connection & Config Alignment (2026-09-08)
- `backend/app/config.py` — added `http://127.0.0.1:5173` and `http://127.0.0.1:3000` to default `cors_origins`
- `frontend/src/services/api.ts` — updated fallback `API_BASE_URL` to `http://127.0.0.1:8000`
- `frontend/vite.config.ts` — updated dev proxy target to `http://127.0.0.1:8000` and imported `defineConfig` from `vitest/config`
- `.env.example` — updated `CORS_ORIGINS` and `VITE_API_BASE_URL` defaults

#### Sprint 4 — Frontend (2026-09-08)
- `api.ts` — Axios timeout increased from 30s to 120s for CPU inference (~68s)
- `AnalyzePage.tsx` — converted from static placeholder to functional component (123 → 686 lines)

### Fixed

- Sentiment label mapping mismatch between training and backend `CLASS_MAP`
- HuggingFace download delay on first request (resolved: models are now local)

---

## Version History Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Fixed
- Bug fixes

### Deprecated
- Features that will be removed in future versions

### Removed
- Features removed in this version

### Security
- Security fixes
```

---

## Planned Releases

| Version              | Target Date | Milestone                | Key Features                                |
| -------------------- | ----------- | ------------------------ | ------------------------------------------- |
| `v0.1.0-foundation`  | Week 2      | Phase 0 complete         | Project scaffold, Docker, CI/CD             |
| `v0.2.0-ai-core`     | Week 4      | Phase 1 complete         | Fake news + sentiment models, API           |
| `v0.3.0-webapp`      | Week 6      | Phase 2 complete         | Auth, analysis page, history                |
| `v0.4.0-advanced-ai` | Week 8      | Phase 3 complete         | XAI, OCR, URL, translation, summarization   |
| `v0.5.0-platform`    | Week 10     | Phase 4 complete         | Analytics, admin, export, rate limiting     |
| `v0.6.0-polish`      | Week 12     | Phase 5 complete         | ONNX, responsive UI, performance            |
| `v0.7.0-hardened`    | Week 14     | Phase 6 complete         | Tests, security, coverage targets           |
| `v1.0.0-release`     | Week 16     | Phase 7 complete         | Production deploy, demo, final docs         |

---

*This changelog is updated with every tagged release. Each entry describes user-facing changes.*
