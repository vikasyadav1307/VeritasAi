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

- **Phase**: 1 — Core AI
- **Sprint**: 2 (starting)
- **Completed**: Phase 0 scaffolding (Monorepo, FastAPI, React+Vite, Docker, CI/CD)
- **Next**: Data collection, fake news model training, sentiment model training

## Folder Structure

```
veritasai/
├── backend/app/           # FastAPI (modules/, core/, infrastructure/, middleware/)
├── frontend/src/          # React (features/, components/, services/, store/)
├── models/                # AI model weights (gitignored)
├── notebooks/             # Training notebooks
├── e2e/                   # Playwright E2E tests
├── docs/                  # Documentation (20 files)
├── docker/                # Dockerfiles, nginx configs
├── .github/workflows/     # CI/CD
└── docker-compose.yml
```

## Backend Modules

`auth` · `analysis` · `detection` · `sentiment` · `language` · `explainability` · `input_processing` · `history` · `analytics` · `admin` · `export` · `feedback` · `model_registry`

## Key Endpoints

| Method | Path                      | Auth   | Phase |
| ------ | ------------------------- | ------ | ----- |
| POST   | /api/v1/auth/register     | Public | 2     |
| POST   | /api/v1/auth/login        | Public | 2     |
| POST   | /api/v1/analyze/text      | JWT    | 1     |
| POST   | /api/v1/analyze/url       | JWT    | 3     |
| POST   | /api/v1/analyze/image     | JWT    | 3     |
| GET    | /api/v1/history           | JWT    | 2     |
| GET    | /api/v1/analytics/summary | JWT    | 4     |
| GET    | /health                   | Public | 0     |

## Database Tables

`users` · `analysis_results` · `refresh_tokens` · `api_keys` · `model_metadata` · `feedback` · `audit_logs`

PKs: UUID v4. Timestamps: `created_at`, `updated_at` (UTC). Soft deletes: `deleted_at`.

## Completed Features

- Monorepo scaffolded with Docker Compose and CI/CD
- Basic frontend shell (React + Vite) with design system
- Basic backend shell (FastAPI) with health checks
- Alembic database migration setup

## Pending Features (Ordered)

1. Fake news detection model training (Phase 1)
3. Sentiment analysis model training (Phase 1)
4. Analysis API endpoint (Phase 1)
5. Auth system — JWT + RBAC (Phase 2)
6. Analysis page — text input + results display (Phase 2)
7. History page (Phase 2)
8. XAI — LIME + attention visualization (Phase 3)
9. OCR + URL scraping + translation + summarization (Phase 3)
10. Analytics dashboard + admin panel + export (Phase 4)
11. ONNX optimization + UI polish (Phase 5)
12. Full test suite + security hardening (Phase 6)
13. Cloud deployment + demo (Phase 7)

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
- Branch format: `type/short-description`

## Important Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Modular Monolith | Solo dev; extract to microservices later |
| 2 | FastAPI | Async-native; auto OpenAPI; Pydantic-first |
| 3 | React + Vite | No SSR needed; faster DX than Next.js |
| 4 | PostgreSQL | Relational + JSONB; free tier on Supabase |
| 5 | XLM-RoBERTa | Best cross-lingual transfer; 100 languages |
| 6 | LIME (primary XAI) | Model-agnostic; intuitive for users |

## Next Tasks

```
- [ ] Research dataset sources (Kaggle/HuggingFace) for multilingual fake news
- [ ] Create Jupyter notebook for data exploration and preprocessing
- [ ] Fine-tune XLM-RoBERTa for fake news detection
- [ ] Fine-tune XLM-RoBERTa for sentiment analysis
- [ ] Evaluate models (F1-score, accuracy) and save to models/
- [ ] Implement inference API endpoints (FastAPI)
```

## Documentation Map

Level 1 (Stable): `00`–`06`, `15` | Level 2 (Read every session): This file, `AI_RULES.md` | Level 3 (Updated often): `09`, `10`, `11`, `12`
