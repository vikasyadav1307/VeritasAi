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

#### Milestone 3.1 — Analysis History Persistence & UI (2026-09-08)
- Created `AnalysisResult` SQLAlchemy model in `backend/app/models/analysis.py` with UUID, timestamp, soft-delete, and nullable `user_id`
- Created and executed Alembic migration `8a9aac35e684_create_analysis_results_table.py`
- Implemented history REST endpoints in `backend/app/modules/history/router.py`:
  - `GET /api/v1/history` (paginated list, sorted descending, excludes soft-deleted items)
  - `GET /api/v1/history/{id}` (single item lookup)
  - `DELETE /api/v1/history/{id}` (soft-delete returning 204 No Content)
- Mounted `history_router` under `/api/v1` in `backend/app/main.py`
- Added TypeScript types (`HistoryItem`, `PaginatedHistoryResponse`) and API methods (`getHistory`, `getHistoryById`, `deleteHistory`) to `frontend/src/services/api.ts`
- Implemented full interactive History page in `frontend/src/features/history/pages/HistoryPage.tsx` with list view, badges, detail modal, pagination, and soft deletion

#### Milestone 3.2 — Analytics Dashboard (2026-09-08)
- Created `backend/app/modules/dashboard/router.py` with `GET /api/v1/dashboard/summary` providing SQL-computed totals, credibility & sentiment distributions, average confidence %, average latency, language counts, and recent analyses
- Mounted `dashboard_router` under `/api/v1` in `backend/app/main.py`
- Added TypeScript types (`DashboardSummary`, `CredibilityDistribution`, `SentimentDistribution`, `LanguageCount`) and `getDashboardSummary()` API function in `frontend/src/services/api.ts`
- Implemented full interactive analytics dashboard in `frontend/src/features/dashboard/pages/DashboardPage.tsx` with 5 KPI cards, dual-color credibility ratio bar, three-segment sentiment spectrum bar, language distribution meter, recent analyses list, inspection modal, live refresh, and empty/loading/error handling
- Added `ADR-011: Server-Side Database Aggregations for Analytics Dashboard` to `docs/10_TECHNICAL_DECISIONS.md`

#### Milestone 3.3 — User Authentication & Access Control (2026-09-09)
- Created `User` SQLAlchemy model in `backend/app/models/user.py` with UUID, email, username, bcrypt-hashed password, is_active, soft-delete, and relationships
- Created Alembic migration `671939c98ccd_create_users_table.py` with `users` table creation, indexes, and safe foreign key `fk_analysis_results_user_id_users` on `analysis_results.user_id`
- Created `backend/app/modules/auth` with:
  - Pydantic V2 schemas (`RegisterRequest`, `LoginRequest`, `RefreshRequest`, `UserResponse`, `AuthResponse`)
  - Security module (`bcrypt` password hashing, HS256 JWT access and refresh token generation and decoding)
  - Dependencies (`get_current_user`, `get_optional_user`)
  - REST endpoints: `POST /api/v1/auth/register` (201), `POST /api/v1/auth/login` (200), `POST /api/v1/auth/refresh` (200), `POST /api/v1/auth/logout` (200), `GET /api/v1/auth/me` (200)
- Mounted `auth_router` under `/api/v1` in `backend/app/main.py`
- IDOR prevention and strict user data isolation:
  - Scoped `GET /api/v1/history`, `GET /api/v1/history/{id}`, and `DELETE /api/v1/history/{id}` to authenticated user (returns 403 Forbidden if accessed across users)
  - Scoped `GET /api/v1/dashboard/summary` strictly to `current_user.id`
  - Scoped `POST /api/v1/analyze/text` with `get_optional_user` to persist `user_id` when authenticated while preserving public API usage
- Added backend integration test suite in `backend/tests/integration/test_auth.py` (14 tests covering registration, duplicate handling, login, token refresh, logout, `/auth/me`, history IDOR, and dashboard user scoping)
- Frontend authentication state management & route guards:
  - Zustand auth store (`frontend/src/store/auth.store.ts`) with token persistence and initialization status
  - Axios interceptors in `frontend/src/services/api.ts` with automated Bearer injection and 401 retry queue
  - Route guards in `frontend/src/app/Router.tsx` (`ProtectedRoute` for `/analyze`, `/history`, `/dashboard`; `GuestRoute` for `/login`, `/register`)
  - `LoginPage.tsx` and `RegisterPage.tsx` with Zod validation, React Hook Form, and responsive styling
  - User profile badge and functional logout button in `Header.tsx`
  - Global `AuthInitializer` in `frontend/src/app/Providers.tsx` validating session on page load
- Added `ADR-013: JWT Authentication and IDOR Prevention Strategy` to `docs/10_TECHNICAL_DECISIONS.md`

#### Milestone 3.4 — Public Article URL Analysis & Multi-Layer SSRF Defense (2026-09-09)
- Created `backend/app/modules/url_analysis/` with:
  - Pydantic V2 schemas (`AnalyzeUrlRequest`, `AnalyzeUrlResponse`)
  - Multi-layer SSRF defense module (`security.py`) enforcing HTTP/HTTPS protocol validation, hostname format checks, asynchronous DNS resolution, and strict blocking of loopback, RFC 1918 private, link-local, carrier-grade NAT, and local TLD networks
  - Async fetching service (`UrlFetcherService`) with isolated `httpx.AsyncClient`, 15s overall timeout, 5 MB body size cap, HTML/XHTML MIME verification, and manual redirect hop inspection re-validating every redirect destination before connection
  - Article extraction service (`ArticleExtractorService`) using `BeautifulSoup` to strip scripts, styles, forms, and noisy boilerplate, extracting title, canonical link, clean body text, and detected language
  - URL analysis router (`router.py`) exposing `POST /api/v1/analyze/url` requiring authentication and persisting records with `source_url` and `title`
- Added Alembic migration `e1a47b892c01_add_source_url_and_title_to_analysis_results.py` adding nullable `source_url` (`VARCHAR(2048)`) and `title` (`VARCHAR(500)`) columns to `analysis_results`
- Added backend integration test suite `backend/tests/integration/test_url_analysis.py` (45 tests covering validation, SSRF blocking, private redirect hops, auth, timeouts, error status codes, and article extraction)
- Frontend URL analysis integration:
  - Enabled URL tab on `AnalyzePage.tsx` with responsive input field, URL validation, and clear button
  - Added article metadata display card showing extracted title, clickable source URL with truncation, detected language badge, and character count
  - Updated `HistoryPage.tsx` detail modal to render source URL and article title for URL analyses
  - Added `AnalyzeUrlRequest`, `AnalyzeUrlResponse`, and `analyzeUrl` API function in `frontend/src/services/api.ts`
- Added `ADR-014: Public URL Ingestion with Multi-Layer SSRF Defenses and HTML Article Extraction` to `docs/10_TECHNICAL_DECISIONS.md`

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

#### Milestone 3.1 — History Persistence (2026-09-08)
- `backend/app/modules/analysis/router.py` — automatically save analysis results into PostgreSQL and return `id`
- `backend/app/infrastructure/database/migrations/env.py` — import `app.models` so Alembic detects models metadata

#### Milestone 3.3 — Authentication (2026-09-09)
- `backend/app/models/analysis.py` — added foreign key reference to `users.id` on nullable `user_id` column
- `backend/app/modules/history/router.py` — enforced `get_current_user` and ownership verification (returns 403 on cross-user access)
- `backend/app/modules/dashboard/router.py` — enforced `get_current_user` and user-scoped aggregations
- `backend/app/modules/analysis/router.py` — injected `get_optional_user` to link user account when token is present
- `frontend/src/components/layout/Header.tsx` — updated with user profile dropdown, user email display, and sign out handler
- `frontend/src/app/App.test.tsx` — updated test assertions to accommodate authenticated router initialization

#### Milestone 3.4 — URL Analysis (2026-09-09)
- `backend/app/models/analysis.py` — added nullable `source_url` and `title` columns
- `backend/app/modules/history/router.py` — added `source_url` and `title` to `HistoryItem` schema
- `backend/app/main.py` — mounted `url_analysis_router` under `/api/v1`
- `frontend/src/services/api.ts` — added `source_url` and `title` to `HistoryItem` interface
- `frontend/src/features/analyze/pages/AnalyzePage.tsx` — enabled URL analysis tab with dual text/URL submission workflow
- `frontend/src/features/history/pages/HistoryPage.tsx` — enhanced detail inspection modal to display source URL and title

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
