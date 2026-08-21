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

- **Phase**: 1 — Core AI Pipeline
- **Sprint**: 2 (completed)
- **Status**: Foundation closed. Analysis API hardened. Models still mock-only.
- **Next**: Sprint 3 — Train or integrate real AI models

## Completed Work

### Phase 0 — Foundation (Sprint 1)
- Monorepo structure, FastAPI + React scaffolding, Docker Compose, CI/CD, pre-commit
- 1 git commit: `a2b462a chore(project): Initial commit with project scaffolding`

### Phase 1 — Sprint 2
- Created `docs/prompts/START_HERE.md` and `AI_RULES.md`
- Created `docs/phases/phase-01/CURRENT_SPRINT.md`
- Hardened `analysis/router.py` — proper Pydantic V2 models, `is_mock` flag, `processing_time_ms`, structured error handling
- Made `analysis/services.py` async with structlog logging and per-model timing
- Rewrote `detection/model.py` and `sentiment/model.py` — structlog, type annotations, `ModelStatus` enum, `PredictionResult` dataclass
- Expanded test suite: 20 tests (7 analysis + 8 validation + 5 health), all passing
- Verified backend starts and endpoint returns correct mock response
- Fixed documentation inconsistencies (state mismatch, missing files)

## Current Task

- **Sprint 3**: Train or integrate real AI models
  - Option A: Prepare notebooks for Colab/Kaggle GPU execution
  - Option B: Integrate pre-trained HuggingFace pipeline models for end-to-end verification

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

| Method | Path                      | Auth   | Status |
| ------ | ------------------------- | ------ | ------ |
| GET    | /health                   | Public | ✅ Working |
| GET    | /health/ready             | Public | ✅ Working |
| POST   | /api/v1/analyze/text      | Public | ✅ Working (mock) |

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
| 7 | Mock fallback | Models return mock data until trained — `is_mock` flag in API response |

## Known Issues

- No trained models — API returns mock predictions with `is_mock: true`
- First request is slow (~90s cold start) due to torch/transformers import
- No git tags yet (v0.1.0-foundation not created)
- Docker Compose not verified end-to-end

## Documentation Map

Level 1 (Stable): `00`–`08`, `15` | Level 2 (Read every session): This file, `AI_RULES.md`, `START_HERE.md` | Level 3 (Updated often): `09`, `10`, `11`, `12`
