# START HERE — VeritasAI

> Read this file at the start of every AI session. Then read `AI_RULES.md`, then `ai_context.md`.

## Project

**Multilingual Fake News Detection and Sentiment Analysis** web application.

- **Codename**: VeritasAI
- **Type**: B.Tech CSE Final Year Project
- **Developer**: Vikas (solo)
- **Timeline**: 16 weeks (Aug–Nov 2026)

## What It Does

1. Accepts text input (news article, social media post, etc.)
2. Detects if the content is potentially fake or real (credibility)
3. Performs sentiment analysis
4. Supports multilingual text (100+ languages via XLM-RoBERTa)
5. Provides confidence scores and explainability
6. Stores analysis history and provides analytics

## Architecture

```
React + TypeScript + Vite (Frontend)
        ↓ REST API
FastAPI + Python 3.11 (Backend)
        ↓
┌───────────────┬──────────────────┐
│ AI Pipeline   │ PostgreSQL + Redis│
│ (XLM-RoBERTa)│ (Storage + Cache) │
└───────────────┴──────────────────┘
```

- **Pattern**: Modular Monolith (Clean Architecture, 4 layers)
- **Backend**: FastAPI, SQLAlchemy 2 (async), Pydantic V2
- **Frontend**: React 18, TypeScript, Vite, Zustand, TanStack Query
- **AI**: XLM-RoBERTa (fake news + sentiment), future: ONNX, LIME/SHAP
- **Infra**: Docker Compose (local), GitHub Actions (CI)

## Session Workflow

1. Read this file (`START_HERE.md`)
2. Read `AI_RULES.md` for coding/documentation rules
3. Read `ai_context.md` for current state, phase, sprint, and next task
4. Read ONLY the current sprint document referenced in `ai_context.md`
5. Begin work on the identified task — do NOT scan the entire repo

## Key Directories

| Path | Purpose |
|------|---------|
| `backend/app/` | FastAPI application (modules, core, middleware, routers) |
| `frontend/src/` | React application (features, components, services) |
| `models/` | Trained model weights (gitignored) |
| `notebooks/` | Jupyter training notebooks |
| `datasets/` | Training data CSVs |
| `docs/` | All project documentation |
| `docs/prompts/` | AI session files (this file, AI_RULES, ai_context) |
| `docs/phases/` | Sprint documents by phase |

## Documentation Map

| Priority | Files | When to Read |
|----------|-------|-------------|
| **Always** | `START_HERE.md`, `AI_RULES.md`, `ai_context.md` | Every session |
| **Current sprint** | `docs/phases/<phase>/CURRENT_SPRINT.md` | Every session |
| **On demand** | `00`–`08` (architecture docs) | When modifying that area |
| **After work** | `09` (progress), `10` (decisions), `12` (changelog) | To update |

## Research Direction

> Does incorporating sentiment information improve multilingual fake-news detection, particularly for Indian-language, low-resource, code-mixed, or transliterated text?

This is a **research question**, not an established result. Do not claim results without experiments.
