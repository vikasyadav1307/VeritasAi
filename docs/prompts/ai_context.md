# AI Context — VeritasAI

> Read this file first. It contains everything needed to continue development.

## Project

Multilingual Fake News Detection + Sentiment Analysis web app.
Codename: **VeritasAI**. Solo-developer FYP. 16-week timeline.

## Architecture

- **Pattern**: Modular Monolith (Clean Architecture, 4 layers)
- **Backend**: FastAPI (Python 3.11+), SQLAlchemy 2 (async), PostgreSQL 16, Redis 7
- **Frontend**: React 18 + TypeScript + Vite 5, Zustand, TanStack Query
- **AI**: XLM-RoBERTa (fake news + sentiment), ONNX Runtime, LIME/SHAP
- **Deploy**: Docker Compose (local), Render + Vercel + Supabase + Upstash (cloud)

## Current State

- **Phase**: 4 — Platform Features (Phases 0–3 Complete & Committed)
- **Milestone**: 4.1 — Platform & Operational Hardening (In Progress; Dashboard Complete)
- **Status**: Phase 0 through Phase 3 fully completed and committed (`eb7a3bd`). Full Phase 3 capabilities active: Real XLM-RoBERTa inference, history persistence, analytics dashboard (Milestone 3.2), JWT authentication & IDOR defenses, SSRF-protected URL analysis, bounded in-memory OCR image analysis, token-level Gradient × Input explainability, and deterministic language detection with on-demand presentation translation. Full test suites passing: 133/133 backend integration tests and 17/17 frontend Vitest tests.
- **Next**: Phase 4 platform features (Export, Rate Limiting, Admin User Management) followed by Phase 5 (ONNX runtime optimization)

## Completed Work

### Phase 0 — Foundation (Sprint 1)
- Monorepo structure, FastAPI + React scaffolding, Docker Compose, CI/CD, pre-commit

### Phase 1 — AI Inference Pipeline (Sprint 2-3)
- Models trained on Colab (Fake News: 98.39%, Sentiment: 97.95%) and integrated into backend
- `POST /api/v1/analyze/text` running real XLM-RoBERTa inference

### Phase 2 — Frontend Integration (Sprint 4)
- React text analysis page connected end-to-end with real predictions, confidence scores, and latency display

### Phase 3 — Core Platform Features
- **Milestone 3.1 (History)**: `AnalysisResult` SQLAlchemy model, Alembic migration, `history_router` with pagination & soft deletion, interactive `HistoryPage.tsx` with modal & delete. (Committed & pushed: `2cd5bcd`)
- **Milestone 3.2 (Dashboard)**: `dashboard_router` with `GET /api/v1/dashboard/summary`, SQL aggregations, `DashboardPage.tsx` with KPI cards, dual-segment credibility ratio bar, three-segment sentiment spectrum bar, language breakdown, recent analyses, inspection modal. (Implemented & verified)
- **Milestone 3.3 (Authentication)**: `User` model, Alembic migration with FK to `analysis_results`, `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, JWT + bcrypt security, `get_current_user` and `get_optional_user` dependencies, strict IDOR prevention on history & dashboard, React auth store with auto-refresh/interceptors, protected routes (`/analyze`, `/history`, `/dashboard`), guest routes (`/login`, `/register`), user badge & logout dropdown. (Implemented & verified)
- **Milestone 3.4 (URL Analysis)**: `backend/app/modules/url_analysis/` module with `POST /api/v1/analyze/url`, multi-layer SSRF defenses (`security.py`), safe HTTP streaming fetcher with independent redirect hop validation, BeautifulSoup article extraction, Alembic migration adding `source_url` and `title`, user-scoped history integration, frontend Analyze URL tab with metadata banner, 45 unit/integration tests (84 total suite). (Implemented & verified)
- **Milestone 3.5 (Image Analysis / OCR)**: `backend/app/modules/image_analysis/` module with `POST /api/v1/analyze/image`, in-memory stream bounds (10 MB), strict magic byte verification, decompression bomb protection, EXIF transpose, grayscale, contrast enhancement, Lanczos upscaling, dynamic Tesseract binary discovery with graceful 503 fallback, text cleaning, language detection, XLM-RoBERTa model inference, user-scoped DB persistence (`input_type="image"`), frontend Image tab with dropzone, thumbnail preview, and copyable OCR text card, 24 unit/integration tests (108 total suite). (Implemented & verified)
- **Milestone 3.6 (Explainability)**: `backend/app/modules/explainability/` module with `POST /api/v1/explain/text`, Gradient × Input token attribution targeting predicted class logit, SentencePiece subword stitching into words, supporting/opposing sign interpretation, normalized importance magnitude [0.0, 1.0], educational non-causal disclaimer, reusable frontend `ExplainabilityPanel` integrated into `AnalyzePage` and `HistoryPage`, 9 backend tests (117 total suite) and 5 vitest frontend tests (12 total suite). (Implemented & verified)
- **Milestone 3.7 (Multilingual Translation)**: `backend/app/modules/translation/` module with `GET /api/v1/languages` and `POST /api/v1/translate`, deterministic `LanguageDetector` with strict non-fallback to English, 14-language registry, decoupled `TranslationService` with MyMemory provider, LRU caching, and graceful 503 fallback, reusable frontend `TranslationPanel` integrated into `AnalyzePage` and `HistoryPage`, 16 backend integration tests (133 total suite) and 5 vitest frontend tests (17 total suite). (Implemented & verified)

## Folder Structure

```
veritasai/
├── backend/app/           # FastAPI (modules/, core/, infrastructure/, middleware/)
├── frontend/src/          # React (features/, components/, services/, store/)
├── models/                # AI model weights (gitignored)
├── notebooks/             # Training notebooks
├── datasets/              # Training data (fake_news + sentiment CSVs)
├── docs/                  # Documentation (20+ files)
├── docs/phases/phase-01/  # Current phase sprint docs
├── docker/                # Dockerfiles, nginx configs
├── .github/workflows/     # CI/CD
└── docker-compose.yml
```

## Key Endpoints

| Method | Path                      | Auth    | Status |
| ------ | ------------------------- | ------- | ------ |
| GET    | /health                   | Public  | ✅ Working |
| GET    | /health/ready             | Public  | ✅ Working |
| POST   | /api/v1/auth/register     | Public  | ✅ Working (201) |
| POST   | /api/v1/auth/login        | Public  | ✅ Working (200) |
| POST   | /api/v1/auth/refresh      | Public  | ✅ Working (200) |
| POST   | /api/v1/auth/logout       | Bearer  | ✅ Working (200) |
| GET    | /api/v1/auth/me           | Bearer  | ✅ Working (200) |
| POST   | /api/v1/analyze/text      | Optional| ✅ Working (real model) |
| POST   | /api/v1/analyze/url       | Bearer  | ✅ Working (SSRF-protected) |
| POST   | /api/v1/analyze/image     | Bearer  | ✅ Working (OCR + NLP) |
| POST   | /api/v1/explain/text      | Bearer  | ✅ Working (Grad × Input) |
| GET    | /api/v1/languages         | Public  | ✅ Working (14 languages) |
| POST   | /api/v1/translate         | Public  | ✅ Working (presentation-only) |
| GET    | /api/v1/history           | Bearer  | ✅ Working (user-scoped) |
| GET    | /api/v1/history/{id}      | Bearer  | ✅ Working (ownership check) |
| DELETE | /api/v1/history/{id}      | Bearer  | ✅ Working (ownership check) |
| GET    | /api/v1/dashboard/summary | Bearer  | ✅ Working (user-scoped) |

## Rules

- Clean Architecture: dependencies point inward only
- SOLID principles in all modules
- No cross-module direct imports (use service protocols)
- Pydantic V2 for all schemas
- Async everywhere (FastAPI, SQLAlchemy, httpx)
- All endpoints need `response_model` + `status_code`
- Structured logging (structlog) — never `print()`
- No secrets in code — `.env` only
- Commit format: `type(scope): subject`

## Important Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Modular Monolith | Solo dev; extract to microservices later |
| 2 | FastAPI | Async-native; auto OpenAPI; Pydantic-first |
| 3 | React + Vite | No SSR needed; faster DX than Next.js |
| 4 | PostgreSQL | Relational + JSONB; free tier on Supabase |
| 5 | XLM-RoBERTa | Best cross-lingual transfer; 100 languages |
| 6 | LIME (primary XAI) | Model-agnostic; intuitive for users |
| 7 | Mock fallback | Models return mock data if uninstantiated — `is_mock` flag in API response |
| 8 | Server-Side Dashboard Aggregations | Perform counts & averages via SQL in PostgreSQL rather than sending raw rows to client |
| 9 | JWT + IDOR Prevention | Stateless access tokens (15m), refresh tokens (7d), strict server-side `user_id` filtering |

## Known Issues

- First request is slow (~30s cold start) due to PyTorch/transformers model weight initialization
- No git tags yet (v0.1.0-foundation not created)
- Docker Compose not verified end-to-end with local GPU/CPU model mounts

## Documentation Map

Level 1 (Stable): `00`–`08`, `15` | Level 2 (Read every session): This file, `AI_RULES.md`, `START_HERE.md` | Level 3 (Updated often): `09`, `10`, `11`, `12`
