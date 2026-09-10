# 03 — Development Roadmap

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-03                                                             |
| **Version**        | 1.1.0                                                              |
| **Status**         | Active (Phases 0–3 Complete; Phase 4 in Progress)                 |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-09-11                                                         |
| **Parent**         | `00_PROJECT_VISION.md`, `01_ARCHITECTURE.md`                       |
| **Total Duration** | 16 weeks (Aug 2026 – Nov 2026)                                    |

---

## 1. Roadmap Overview

```
Week  1──2──3──4──5──6──7──8──9──10──11──12──13──14──15──16
      ├────────┤                                              Phase 0: Foundation
         ├──────────┤                                         Phase 1: Core AI
               ├──────────┤                                   Phase 2: Web App
                     ├──────────┤                             Phase 3: Advanced Features
                           ├──────────┤                       Phase 4: Platform
                                 ├──────────┤                 Phase 5: Polish & Optimize
                                       ├──────────┤           Phase 6: Testing & Security
                                             ├────────┤       Phase 7: Deployment & Demo
```

### 1.1 Phase Summary Table

| Phase | Name                      | Weeks   | Duration | Key Deliverable                              | Git Milestone         | Status      |
| ----- | ------------------------- | ------- | -------- | -------------------------------------------- | --------------------- | ----------- |
| 0     | Foundation & Setup        | 1–2     | 2 weeks  | Project scaffold, CI/CD, dev environment     | `v0.1.0-foundation`   | ✅ Complete |
| 1     | Core AI Pipeline          | 2–4     | 3 weeks  | Fake news + sentiment models trained & served| `v0.2.0-ai-core`      | ✅ Complete |
| 2     | Web Application Core      | 4–6     | 3 weeks  | Auth + Analysis page + History (full-stack)   | `v0.3.0-webapp`       | ✅ Complete |
| 3     | Advanced AI Features      | 6–8     | 3 weeks  | XAI, OCR, URL scraping, translation          | `v0.4.0-advanced-ai`  | ✅ Complete |
| 4     | Platform Features          | 8–10    | 2 weeks  | Analytics dashboard, admin panel, export      | `v0.5.0-platform`     | 🔄 In Progress (Dashboard Complete) |
| 5     | Polish & Optimization     | 10–12   | 2 weeks  | Performance tuning, UX polish, ONNX          | `v0.6.0-polish`       | ⬜ Planned  |
| 6     | Testing & Security        | 12–14   | 2 weeks  | Full test suite, security hardening          | `v0.7.0-hardened`     | ⬜ Planned  |
| 7     | Deployment & Demo          | 14–16   | 2 weeks  | Production deploy, demo prep, documentation  | `v1.0.0-release`      | ⬜ Planned  |

---

## 2. Phase 0 — Foundation & Setup

### Phase Summary

Establish the project skeleton, development environment, CI/CD pipeline, and documentation framework. No feature code — pure infrastructure and scaffolding.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 1–2                                                          |
| **Duration**         | 2 weeks                                                      |
| **Objective**        | Zero-to-running dev environment with CI/CD green              |
| **Git Milestone**    | `v0.1.0-foundation`                                          |
| **Dependencies**     | None (starting phase)                                        |

### Objectives

1. Initialize monorepo with backend + frontend + docs structure
2. Configure Docker Compose for local development (backend, frontend, Postgres, Redis)
3. Set up CI pipeline (lint, type-check, test) on GitHub Actions
4. Create base FastAPI app with health endpoint
5. Create base React + Vite app with routing shell
6. Configure database connection, Alembic migrations (empty)
7. Set up pre-commit hooks (Ruff, mypy, ESLint, Prettier)
8. Complete all Level 1 documentation

### Deliverables

| Deliverable                          | Type           | Acceptance Criteria                                    |
| ------------------------------------ | -------------- | ------------------------------------------------------ |
| Monorepo with folder structure       | Code           | Matches `17_FOLDER_STRUCTURE.md`                       |
| Docker Compose (dev)                 | Config         | `docker-compose up` starts all services                |
| FastAPI skeleton                     | Code           | `GET /health` returns `200 OK`                         |
| React SPA skeleton                   | Code           | Renders landing page; router configured                |
| GitHub Actions CI                    | Config         | Lint + type-check + test all pass on push              |
| Alembic setup                        | Config         | `alembic upgrade head` runs without error              |
| Pre-commit hooks                     | Config         | Hooks run on `git commit`                              |
| Documentation (DOC-00 through DOC-18)| Docs           | All documents created and reviewed                     |

### Architecture Changes

- Initial folder structure created per `17_FOLDER_STRUCTURE.md`
- Docker Compose topology established (5 services)
- CI/CD pipeline YAML created

### Database Changes

- PostgreSQL container configured
- Alembic initialized (no tables yet)
- Connection pooling configured in SQLAlchemy

### API Changes

- `GET /health` — shallow health check
- `GET /health/ready` — deep health check (DB + Redis)
- OpenAPI docs available at `/docs`

### Frontend Changes

- Vite + React + TypeScript initialized
- React Router configured with placeholder pages
- Base layout (Header, Sidebar, Content area) scaffolded
- Dark theme CSS variables defined
- Axios client configured with base URL and interceptors

### Backend Changes

- FastAPI app factory pattern established
- Config loaded from `.env` via Pydantic `BaseSettings`
- Structured logging configured (structlog)
- CORS middleware configured
- Error handler middleware registered

### AI Changes

- None (Phase 1)

### Testing

- Backend: `pytest` configured; 1 smoke test for health endpoint
- Frontend: `vitest` configured; 1 smoke test for app render
- CI: All tests run on push to `main` and on PRs

### Deployment Impact

- Local development only (Docker Compose)
- No cloud deployment yet

### Documentation Updates

- All 19 documents created (DOC-00 through DOC-18 + ai_context.md)
- `09_PROGRESS_LOG.md` initialized with Phase 0 status

### Checklist

- [x] Initialize Git repository
- [x] Create monorepo folder structure
- [x] Initialize backend (FastAPI, pyproject.toml)
- [x] Initialize frontend (Vite, React, TypeScript)
- [x] Create Docker Compose (backend, frontend, postgres, redis, nginx)
- [x] Create Dockerfiles (backend, frontend)
- [x] Configure Alembic
- [x] Create health endpoints
- [x] Configure CORS, logging, error handling
- [x] Create React app shell with router
- [x] Set up pre-commit hooks
- [x] Create GitHub Actions CI workflow
- [x] Write smoke tests (backend + frontend)
- [x] Verify `docker-compose up` runs clean
- [x] Verify CI pipeline passes
- [x] Complete all documentation
- [x] Tag `v0.1.0-foundation`

### Definition of Done

- [x] `docker-compose up` brings up all 5 services without errors
- [x] `GET /health` returns 200
- [x] React app loads in browser at `localhost:3000`
- [x] CI pipeline passes on GitHub
- [x] All 19 documents exist and are reviewed
- [x] Git milestone `v0.1.0-foundation` tagged


---

## 3. Phase 1 — Core AI Pipeline

### Phase Summary

Train and serve the two core AI models: fake news detection and sentiment analysis. This phase is backend/AI-only — no frontend integration yet.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 2–4                                                          |
| **Duration**         | 3 weeks                                                      |
| **Objective**        | Trained models with ≥ 85% F1 (detection) and ≥ 80% accuracy (sentiment), served via API |
| **Git Milestone**    | `v0.2.0-ai-core`                                             |
| **Dependencies**     | Phase 0 complete                                             |

### Objectives

1. Collect, clean, and prepare multilingual fake news datasets
2. Fine-tune XLM-RoBERTa for fake news classification (English + Hindi minimum)
3. Fine-tune XLM-RoBERTa for sentiment analysis
4. Implement model registry (loading, versioning, caching)
5. Create inference API endpoints
6. Implement language detection service
7. Evaluate models; document results

### Deliverables

| Deliverable                              | Type    | Acceptance Criteria                                        |
| ---------------------------------------- | ------- | ---------------------------------------------------------- |
| Fake news detection model (fine-tuned)   | Model   | ≥ 85% F1 on English test set; ≥ 80% F1 on Hindi test set  |
| Sentiment analysis model (fine-tuned)    | Model   | ≥ 80% accuracy on benchmark test set                       |
| Training notebooks / scripts             | Code    | Reproducible; documented; metrics logged                   |
| Dataset documentation                    | Docs    | Sources, sizes, splits, preprocessing steps documented     |
| `POST /api/v1/analyze/text`              | API     | Returns detection + sentiment scores for plain text        |
| Language detection                       | Code    | Correctly detects 5+ languages                             |
| Model evaluation report                  | Docs    | Precision, Recall, F1, confusion matrix per language       |

### Architecture Changes

- AI Engine layer modules created: `detection/`, `sentiment/`, `language/`
- Model Registry pattern implemented (singleton model loading)
- Analysis Orchestrator created (coordinates detection + sentiment)

### Database Changes

- `analysis_results` table created (stores inference results)
- `models_metadata` table created (tracks model versions)
- Alembic migration for initial AI-related tables

### API Changes

- `POST /api/v1/analyze/text` — submit text for analysis
- `GET /api/v1/languages` — list supported languages
- `GET /api/v1/models` — list loaded models and versions

### Frontend Changes

- None (Phase 2)

### Backend Changes

- `modules/detection/` — FakeNewsDetector service + model wrapper
- `modules/sentiment/` — SentimentAnalyzer service + model wrapper
- `modules/language/` — LanguageDetector service (langdetect)
- `modules/analysis/` — AnalysisOrchestrator (coordinates pipeline)
- `core/ml/` — ModelRegistry, ModelConfig, base model class

### AI Changes

- Dataset collection: LIAR, FakeNewsNet, IFND (Hindi), translated augmentation
- Fine-tuning scripts: XLM-RoBERTa with HuggingFace Trainer
- Evaluation scripts: per-language metrics
- Hyperparameter configuration documented
- Model checkpoints saved and versioned

### Testing

- Unit tests for each AI module (mock model, test service logic)
- Integration test for analysis endpoint (real model, sample text)
- Model evaluation metrics logged and documented
- Test for language detection accuracy

### Deployment Impact

- Model files (~500 MB–1 GB) need to be managed (Git LFS or external storage)
- Inference time baseline established (target: ≤ 2s on CPU)

### Documentation Updates

- `06_AI_PIPELINE.md` — update with actual training results
- `09_PROGRESS_LOG.md` — update Phase 1 status
- `10_TECHNICAL_DECISIONS.md` — log model selection decisions

### Checklist

- [x] Collect fake news datasets (English, Hindi, Spanish minimum)
- [x] Preprocess and clean datasets
- [x] Create dataset splits (train/val/test)
- [x] Fine-tune XLM-RoBERTa for fake news detection (98.39% F1)
- [x] Evaluate fake news model per language
- [x] Fine-tune XLM-RoBERTa for sentiment analysis (97.95% accuracy)
- [x] Evaluate sentiment model
- [x] Implement ModelRegistry
- [x] Implement FakeNewsDetector service
- [x] Implement SentimentAnalyzer service
- [x] Implement LanguageDetector service
- [x] Implement AnalysisOrchestrator
- [x] Create analysis API endpoint (`POST /api/v1/analyze/text`)
- [x] Create database tables + migrations
- [x] Write unit tests for AI modules
- [x] Write integration tests for analysis endpoint
- [x] Document model training results
- [x] Tag `v0.2.0-ai-core`

### Definition of Done

- [x] Fake news model F1 ≥ 85% on English test set (Achieved: 98.39%)
- [x] Fake news model F1 ≥ 80% on Hindi test set
- [x] Sentiment model accuracy ≥ 80% (Achieved: 97.95%)
- [x] `POST /api/v1/analyze/text` returns correct JSON structure with real inference
- [x] Language detection works across languages
- [x] All AI module tests pass
- [x] Integration test passes end-to-end
- [x] Model evaluation report documented in `06_AI_PIPELINE.md`
- [x] CI pipeline passes


---

## 4. Phase 2 — Web Application Core

### Phase Summary

Build the full-stack web application with authentication, the main analysis page, and analysis history. First end-to-end user experience.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 4–6                                                          |
| **Duration**         | 3 weeks                                                      |
| **Objective**        | User can register, log in, analyze text, and view history    |
| **Git Milestone**    | `v0.3.0-webapp`                                              |
| **Dependencies**     | Phase 1 complete                                             |

### Objectives

1. Implement JWT authentication (register, login, refresh, logout)
2. Build the main analysis page (text input → results display)
3. Build analysis history page
4. Implement user profile management
5. Connect frontend to backend API
6. Implement result caching (Redis)

### Deliverables

| Deliverable                             | Type       | Acceptance Criteria                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------- |
| Auth system (register/login/logout)     | Full-stack | JWT flow works; refresh token in HttpOnly cookie        |
| Analysis page                           | Frontend   | Text input, submit, loading state, results display      |
| Results display component               | Frontend   | Shows credibility score, sentiment, confidence, language|
| History page                            | Full-stack | Paginated list of past analyses                         |
| User profile page                       | Full-stack | View/edit profile; change password                      |
| Redis caching for results               | Backend    | Duplicate inputs return cached results                  |

### Architecture Changes

- Auth module fully implemented (JWT + RBAC)
- Redis cache layer integrated
- Frontend API client with JWT interceptor

### Database Changes

- `users` table created
- `refresh_tokens` table created
- `analysis_results` table updated (add `user_id` foreign key)
- Alembic migrations for auth + relationship tables

### API Changes

- `POST /api/v1/auth/register` — create account
- `POST /api/v1/auth/login` — obtain JWT tokens
- `POST /api/v1/auth/refresh` — refresh access token
- `POST /api/v1/auth/logout` — blacklist refresh token
- `GET /api/v1/auth/me` — get current user profile
- `PUT /api/v1/auth/me` — update profile
- `PUT /api/v1/auth/password` — change password
- `GET /api/v1/history` — paginated analysis history
- `GET /api/v1/history/{id}` — single analysis detail

### Frontend Changes

- **Auth feature**: Login, Register, Forgot Password pages
- **Analyze feature**: Text input form, results display, loading skeleton
- **History feature**: Paginated table with filters
- **Layout**: Authenticated layout with sidebar navigation
- **Components**: Button, Input, Card, Modal, Toast, Skeleton loaders
- **Services**: AuthService, AnalysisService, HistoryService (Axios)
- **Store**: AuthStore (Zustand) — user, tokens, login/logout actions

### Backend Changes

- `modules/auth/` — full auth service, JWT utils, password hashing
- `modules/history/` — CRUD for analysis history
- `infrastructure/cache/` — Redis client, cache decorator
- RBAC middleware for protected routes

### AI Changes

- None (models from Phase 1 used as-is)

### Testing

- Auth flow tests (register → login → access → refresh → logout)
- Analysis endpoint integration tests (with auth)
- History CRUD tests
- Frontend component tests (Login form, Analysis form, Results display)
- E2E test: register → login → analyze → view history

### Deployment Impact

- No cloud deployment yet (still local Docker Compose)
- Redis now required for development

### Documentation Updates

- `05_API_SPECIFICATION.md` — update with auth + history endpoints
- `09_PROGRESS_LOG.md` — update Phase 2 status
- `07_UI_UX_DESIGN.md` — document implemented screens

### Checklist

- [x] Implement User model + migration
- [x] Implement auth service (register, login, JWT)
- [x] Implement refresh token rotation
- [x] Implement strict IDOR prevention & user-scoped access
- [x] Create auth API endpoints (`/register`, `/login`, `/refresh`, `/logout`, `/me`)
- [x] Build Login page with Zod validation
- [x] Build Register page with Zod validation
- [x] Build authenticated layout (header with profile & logout)
- [x] Build Analysis page (input form, results cards)
- [x] Build Results display component (credibility + sentiment meters)
- [x] Build History page (paginated list, detail modal, soft deletion)
- [x] Build Analytics Dashboard (KPIs, credibility ratio, sentiment spectrum, language distribution)
- [x] Connect frontend to all backend endpoints with Axios interceptors
- [x] Write auth flow tests (14 tests in `test_auth.py`)
- [x] Write history CRUD tests
- [x] Write frontend component & router tests
- [x] Run E2E tests & browser verification
- [x] Tag `v0.3.0-webapp`

### Definition of Done

- [x] User can register, login, and logout
- [x] JWT refresh works with Axios interceptor queue
- [x] User can submit text and see real analysis results
- [x] Results show credibility score + sentiment + confidence
- [x] History page shows past analyses with pagination and inspection modal
- [x] Dashboard provides real PostgreSQL aggregations
- [x] All unit, integration, and frontend tests pass
- [x] No console errors in browser


---

## 5. Phase 3 — Advanced AI Features

### Phase Summary

Add explainable AI, OCR input, URL scraping, translation, and summarization. Significantly expands the input and output capabilities.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 6–8                                                          |
| **Duration**         | 3 weeks                                                      |
| **Objective**        | XAI explanations on every result; OCR + URL + translate + summarize working |
| **Git Milestone**    | `v0.4.0-advanced-ai`                                         |
| **Dependencies**     | Phase 2 complete                                             |

### Objectives

1. Implement LIME explanations for fake news predictions
2. Implement attention visualization
3. Add OCR input (image → text → analysis)
4. Add URL input (scrape → text → analysis)
5. Add translation service (auto-translate to English for models)
6. Add summarization service
7. Update frontend to support all input types and XAI display

### Deliverables

| Deliverable                             | Type       | Acceptance Criteria                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------- |
| LIME explanations                       | AI/Backend | Top-5 contributing words highlighted per prediction     |
| Attention heatmap data                  | AI/Backend | Token-level attention weights returned in API response  |
| OCR pipeline                            | Backend    | Image upload → extracted text → analysis                |
| URL scraper                             | Backend    | URL → article body → analysis                           |
| Translation service                     | Backend    | Auto-translate non-English text to English              |
| Summarization service                   | Backend    | Generate summary of input text                          |
| Multi-input analysis page               | Frontend   | Tabs for Text / URL / Image input                       |
| XAI visualization component             | Frontend   | Highlighted words, attention chart, confidence bar      |

### Architecture Changes

- `modules/explainability/` fully implemented
- `modules/input_processing/` fully implemented (OCR + scraper + cleaner)
- `modules/language/` extended with translation and summarization
- Analysis Orchestrator updated to handle all input types

### Database Changes

- `analysis_results` table extended: `input_type` enum (text, url, image), `original_url`, `ocr_image_path`, `summary`, `translation`
- Alembic migration for new columns

### API Changes

- `POST /api/v1/analyze/url` — analyze article from URL
- `POST /api/v1/analyze/image` — analyze text in image (OCR)
- `POST /api/v1/translate` — translate text
- `POST /api/v1/summarize` — summarize text
- All analysis responses now include `explanation` object (LIME + attention)

### Frontend Changes

- Analysis page: tabbed input (Text | URL | Image upload)
- Image upload with drag-and-drop + preview
- XAI display: word highlighting with color-coded importance
- Attention heatmap visualization (simple bar chart or heatmap)
- Confidence meter (visual gauge)
- Summary and translation displayed in results
- Loading states for each pipeline step

### Backend Changes

- `modules/explainability/` — LIME wrapper, attention extractor
- `modules/input_processing/ocr/` — Tesseract wrapper, image preprocessing
- `modules/input_processing/scraper/` — newspaper3k + BeautifulSoup wrapper
- `modules/input_processing/cleaner/` — text normalization pipeline
- `modules/language/translator/` — OPUS-MT or mBART wrapper
- `modules/language/summarizer/` — mBART summarization wrapper

### AI Changes

- LIME configured for text classification
- Attention weights extracted from transformer layers
- Tesseract OCR configured for multilingual text
- Translation models loaded (OPUS-MT per language pair)
- Summarization model loaded (mBART-50)
- Model Registry updated with new model entries

### Testing

- LIME explanation output format tests
- OCR accuracy test (sample images → expected text)
- URL scraper tests (mock HTML → extracted article)
- Translation accuracy tests (sample texts)
- Summarization output tests
- Updated E2E test: analyze via URL → view XAI results

### Deployment Impact

- Additional model weights (~1–2 GB) increase container size
- OCR requires Tesseract system package in Docker image
- Consider lazy-loading models to reduce startup time

### Documentation Updates

- `06_AI_PIPELINE.md` — update with XAI, OCR, translation, summarization
- `09_PROGRESS_LOG.md` — update Phase 3 status
- `10_TECHNICAL_DECISIONS.md` — log XAI approach decisions

### Checklist

- [x] Implement Gradient × Input token attribution for fake news and sentiment models (ADR-016)
- [x] Implement SentencePiece subword stitching, supporting/opposing sign attribution, and score normalization
- [x] Implement Tesseract OCR wrapper with dynamic binary discovery and graceful 503 fallback (ADR-015)
- [x] Implement in-memory image preprocessing pipeline with bounded streams and magic bytes security
- [x] Implement URL fetcher with multi-layer SSRF defenses and BeautifulSoup article extractor (ADR-014)
- [x] Implement deterministic LanguageDetector with strict non-fallback to English
- [x] Implement presentation-only translation service with MyMemory provider & LRU caching (ADR-017)
- [x] Update analysis pipeline and router for URL, image, explainability, and translation inputs
- [x] Extend `analysis_results` table with `source_url`, `title`, and `input_type`
- [x] Create URL (`POST /analyze/url`), Image (`POST /analyze/image`), Explain (`POST /explain/text`), and Translation (`POST /translate`, `GET /languages`) endpoints
- [x] Build tabbed input UI (Text / URL / Image) on `AnalyzePage.tsx`
- [x] Build image upload with drag-and-drop, format validation, and thumbnail preview
- [x] Build interactive XAI visualization (`ExplainabilityPanel.tsx`) with token heatmap cloud and influence breakdown
- [x] Build on-demand translation UI (`TranslationPanel.tsx`) with side-by-side original and translated cards
- [x] Embed explainability and translation in both `AnalyzePage.tsx` and `HistoryPage.tsx` modal
- [x] Write tests for all modules (133 backend tests, 17 frontend Vitest tests)
- [x] Tag `v0.4.0-advanced-ai`

### Definition of Done

- [x] On-demand token attribution explains model sensitivity without altering inference latency
- [x] OCR extracts text in-memory from JPEG/PNG/WEBP without temp files or disk leaks
- [x] URL analyzer extracts article bodies while blocking loopback/private/cloud metadata SSRF targets
- [x] Deterministic language detection identifies 14 supported languages with strict "unknown" handling
- [x] On-demand translation provides verified presentation translations without mutating model input
- [x] Frontend displays interactive XAI heatmaps and dual translation cards
- [x] All 133 backend tests and 17 frontend tests pass; build compiles cleanly in 1.5s


---

## 6. Phase 4 — Platform Features

### Phase Summary

Add analytics dashboard, admin panel, and report export. Transform the application from a tool into a platform.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 8–10                                                         |
| **Duration**         | 2 weeks                                                      |
| **Objective**        | Analytics dashboard live; admin can manage users; PDF/JSON export working |
| **Git Milestone**    | `v0.5.0-platform`                                            |
| **Dependencies**     | Phase 3 complete                                             |

### Objectives

1. Build analytics dashboard (charts, trends, statistics)
2. Build admin panel (user management, system stats)
3. Implement PDF report generation
4. Implement JSON export
5. Add rate limiting (per-user, Redis-backed)

### Deliverables

| Deliverable                             | Type       | Acceptance Criteria                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------- |
| Analytics dashboard                     | Full-stack | Charts showing analysis trends, language distribution   |
| Admin panel                             | Full-stack | Admin can view/search/deactivate users                  |
| PDF report export                       | Backend    | Download analysis result as formatted PDF               |
| JSON export                             | Backend    | Download analysis result as JSON                        |
| Rate limiting                           | Backend    | 429 returned when limit exceeded; configurable          |

### Architecture Changes

- `modules/analytics/` implemented
- `modules/admin/` implemented
- `modules/export/` implemented
- Rate limiting middleware added (Redis token bucket)

### Database Changes

- Aggregation queries / views for analytics
- Admin audit log table (optional)

### API Changes

- `GET /api/v1/analytics/summary` — aggregate statistics
- `GET /api/v1/analytics/trends` — time-series data
- `GET /api/v1/analytics/languages` — analysis count by language
- `GET /api/v1/admin/users` — list users (admin only)
- `PUT /api/v1/admin/users/{id}/status` — activate/deactivate user
- `GET /api/v1/admin/stats` — system-level statistics
- `GET /api/v1/export/{analysis_id}/pdf` — download PDF report
- `GET /api/v1/export/{analysis_id}/json` — download JSON export

### Frontend Changes

- **Dashboard feature**: Recharts-based charts (line, bar, pie)
- **Admin feature**: User table with search, sort, pagination; status toggle
- **Export buttons**: PDF and JSON download buttons on results page
- **Rate limit UI**: Toast notification when limit approached/exceeded

### Backend Changes

- `modules/analytics/` — aggregation queries, trend calculations
- `modules/admin/` — user management service (admin-only)
- `modules/export/` — ReportLab PDF generator, JSON serializer
- `middleware/rate_limiter.py` — token bucket with Redis backend

### AI Changes

- None

### Testing

- Analytics endpoint tests (verify aggregation logic)
- Admin endpoint tests (verify RBAC — non-admin rejected)
- PDF generation tests (output is valid PDF)
- Rate limiting tests (verify 429 after limit exceeded)

### Deployment Impact

- Rate limiting configuration needs environment variables
- PDF generation may need additional fonts in Docker image

### Documentation Updates

- `05_API_SPECIFICATION.md` — update with analytics, admin, export endpoints
- `09_PROGRESS_LOG.md` — update Phase 4 status

### Checklist

- [x] Implement analytics aggregation queries (server-side SQL in `modules/dashboard/service.py`)
- [x] Create analytics API endpoints (`GET /api/v1/dashboard/summary`)
- [x] Build analytics dashboard (charts with Recharts in `DashboardPage.tsx`)
- [ ] Implement admin user management service
- [ ] Create admin API endpoints
- [ ] Build admin panel UI
- [ ] Implement PDF report generator
- [ ] Implement JSON export
- [ ] Add export buttons to results page
- [ ] Implement rate limiting middleware
- [ ] Write tests for all new features
- [ ] Tag `v0.5.0-platform`

### Definition of Done

- [x] Dashboard shows analysis trends over time
- [ ] Admin can view and deactivate users
- [ ] PDF downloads as a formatted report
- [ ] JSON export contains all analysis data
- [ ] Rate limiting returns 429 when exceeded
- [ ] All tests pass; CI green

---

## 7. Phase 5 — Polish & Optimization

### Phase Summary

Optimize AI inference speed, polish the UI/UX, add responsive design, and improve overall application quality.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 10–12                                                        |
| **Duration**         | 2 weeks                                                      |
| **Objective**        | API p95 latency ≤ 3s; Lighthouse ≥ 85; mobile-responsive    |
| **Git Milestone**    | `v0.6.0-polish`                                              |
| **Dependencies**     | Phase 4 complete                                             |

### Objectives

1. Convert models to ONNX format for faster CPU inference
2. Implement model quantization (INT8)
3. Polish all UI components (animations, transitions, micro-interactions)
4. Implement responsive design for mobile
5. Optimize frontend bundle size
6. Add loading skeletons and error states everywhere
7. Accessibility audit and fixes

### Deliverables

| Deliverable                             | Type       | Acceptance Criteria                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------- |
| ONNX-converted models                   | AI         | ≤ 2s inference on CPU; accuracy within 1% of original   |
| Responsive UI                           | Frontend   | Usable on 375px–1920px viewports                        |
| Polished animations                     | Frontend   | Smooth page transitions, hover effects, loading states  |
| Lighthouse audit                        | QA         | ≥ 85 on Performance, Accessibility, SEO                 |
| Bundle optimization                     | Frontend   | Code splitting; lazy routes; tree shaking verified      |

### Architecture Changes

- ONNX Runtime replaces PyTorch for inference
- Model loading strategy updated (lazy loading with warm-up)

### Database Changes

- Index optimization based on slow query analysis
- Query performance review

### API Changes

- No new endpoints
- Response times improved

### Frontend Changes

- CSS responsive breakpoints applied to all pages
- Framer Motion animations on page transitions and interactions
- Skeleton loaders on all async-loaded content
- Error boundary components with retry
- Lazy-loaded routes via `React.lazy`
- Bundle analysis and chunk optimization

### Backend Changes

- ONNX model export scripts
- Quantization scripts (INT8 dynamic quantization)
- Model warm-up on startup (prevent cold-start latency)
- Response compression (gzip middleware)

### AI Changes

- PyTorch models exported to ONNX format
- INT8 quantization applied
- Inference benchmarking (PyTorch vs ONNX vs quantized)
- Accuracy regression testing post-optimization

### Testing

- Inference latency benchmarks (before/after ONNX)
- Accuracy regression tests (ONNX vs PyTorch)
- Lighthouse CI automated scoring
- Mobile responsiveness visual testing
- Accessibility testing (axe-core)

### Deployment Impact

- ONNX Runtime dependency added to Docker image
- Model files replaced with optimized versions (smaller)
- Faster cold start expected

### Documentation Updates

- `06_AI_PIPELINE.md` — update with ONNX optimization results
- `09_PROGRESS_LOG.md` — update Phase 5 status
- `10_TECHNICAL_DECISIONS.md` — log ONNX conversion decision

### Checklist

- [ ] Export models to ONNX format
- [ ] Apply INT8 quantization
- [ ] Benchmark inference speed (before/after)
- [ ] Verify accuracy regression ≤ 1%
- [ ] Implement responsive design for all pages
- [ ] Add Framer Motion animations
- [ ] Add skeleton loaders everywhere
- [ ] Add error boundaries with retry
- [ ] Implement lazy route loading
- [ ] Run Lighthouse audit; fix issues
- [ ] Run accessibility audit; fix issues
- [ ] Optimize frontend bundle
- [ ] Tag `v0.6.0-polish`

### Definition of Done

- [ ] Text analysis API p95 latency ≤ 3s
- [ ] ONNX accuracy within 1% of original PyTorch
- [ ] Lighthouse scores ≥ 85 (Performance, Accessibility, SEO)
- [ ] UI works on mobile (375px viewport)
- [ ] No layout shifts or visual glitches
- [ ] All tests pass; CI green

---

## 8. Phase 6 — Testing & Security

### Phase Summary

Comprehensive testing, security hardening, and vulnerability scanning. Prepare the application for production readiness.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 12–14                                                        |
| **Duration**         | 2 weeks                                                      |
| **Objective**        | ≥ 80% backend coverage, ≥ 70% frontend coverage, 0 critical security findings |
| **Git Milestone**    | `v0.7.0-hardened`                                            |
| **Dependencies**     | Phase 5 complete                                             |

### Objectives

1. Achieve test coverage targets (80% backend, 70% frontend)
2. Write E2E tests for all critical user flows
3. Run OWASP ZAP security scan
4. Run dependency vulnerability audit
5. Implement CSP, HSTS, and security headers
6. Penetration testing on auth flows
7. Input sanitization review

### Deliverables

| Deliverable                             | Type    | Acceptance Criteria                                      |
| --------------------------------------- | ------- | -------------------------------------------------------- |
| Backend test suite                      | Tests   | ≥ 80% coverage; all critical paths covered               |
| Frontend test suite                     | Tests   | ≥ 70% coverage; component + integration tests           |
| E2E test suite                          | Tests   | 5+ critical flows automated in Playwright               |
| Security scan report                    | QA      | 0 Critical, 0 High findings                              |
| Dependency audit report                 | QA      | 0 known critical vulnerabilities                          |
| Security headers                        | Config  | CSP, HSTS, X-Content-Type-Options, X-Frame-Options set  |

### Architecture Changes

- Security headers middleware added
- Rate limiting fine-tuned
- Input validation tightened

### Database Changes

- SQL injection review (all queries parameterized)
- Database user permissions restricted (least privilege)

### API Changes

- No new endpoints
- Input validation strengthened on all endpoints
- Error messages reviewed (no information leakage)

### Frontend Changes

- CSP meta tag or header configured
- XSS review (no `dangerouslySetInnerHTML` without sanitization)

### Backend Changes

- Security headers middleware
- Input sanitization utilities
- Rate limiting configuration finalized
- Secrets validation (ensure no hardcoded secrets)

### AI Changes

- Adversarial input testing (malformed text, injection attempts)

### Testing

- Fill coverage gaps identified by pytest-cov / vitest coverage
- E2E tests: register → analyze → history → export → logout
- E2E tests: admin login → user management
- E2E tests: URL analysis → XAI results
- OWASP ZAP automated scan
- `pip-audit` + `npm audit`
- Manual penetration testing on auth endpoints

### Deployment Impact

- Nginx security headers configured
- TLS configuration prepared (for cloud deployment)

### Documentation Updates

- `14_TESTING_STRATEGY.md` — update with actual coverage numbers
- `15_SECURITY_PLAN.md` — update with scan results
- `09_PROGRESS_LOG.md` — update Phase 6 status

### Checklist

- [ ] Write missing backend unit tests (target 80%)
- [ ] Write missing frontend component tests (target 70%)
- [ ] Write 5+ E2E tests in Playwright
- [ ] Run OWASP ZAP scan
- [ ] Run `pip-audit` and `npm audit`
- [ ] Fix all critical and high findings
- [ ] Implement security headers
- [ ] Review and tighten input validation
- [ ] Review error messages for information leakage
- [ ] Test adversarial AI inputs
- [ ] Document test results
- [ ] Tag `v0.7.0-hardened`

### Definition of Done

- [ ] Backend coverage ≥ 80%
- [ ] Frontend coverage ≥ 70%
- [ ] All E2E tests pass
- [ ] 0 Critical / 0 High security findings
- [ ] All dependency vulnerabilities resolved
- [ ] Security headers verified in response
- [ ] CI pipeline passes

---

## 9. Phase 7 — Deployment & Demo

### Phase Summary

Deploy to cloud, prepare the academic demo, finalize documentation, and cut the v1.0.0 release.

| Attribute            | Detail                                                       |
| -------------------- | ------------------------------------------------------------ |
| **Weeks**            | 14–16                                                        |
| **Duration**         | 2 weeks                                                      |
| **Objective**        | Application live on cloud; demo-ready; all docs finalized    |
| **Git Milestone**    | `v1.0.0-release`                                             |
| **Dependencies**     | Phase 6 complete                                             |

### Objectives

1. Deploy backend to Render
2. Deploy frontend to Vercel
3. Configure PostgreSQL on Supabase
4. Configure Redis on Upstash
5. Set up custom domain (optional)
6. Create demo script and presentation materials
7. Finalize all documentation
8. Record demo video
9. Performance testing on cloud deployment
10. Create README.md with setup instructions

### Deliverables

| Deliverable                             | Type       | Acceptance Criteria                                     |
| --------------------------------------- | ---------- | ------------------------------------------------------- |
| Live cloud deployment                   | Deployment | Application accessible via public URL                   |
| Demo script                             | Docs       | Step-by-step demo flow (5–10 minutes)                   |
| Demo video                              | Media      | Recorded walkthrough of all features                    |
| Final README.md                         | Docs       | Setup instructions, architecture overview, screenshots  |
| Academic project report                 | Docs       | Formatted per university requirements                   |
| Deployment runbook                      | Docs       | Step-by-step deployment instructions                    |

### Architecture Changes

- Production Docker Compose finalized
- Environment-specific configuration validated
- Nginx production config with SSL

### Database Changes

- Production database provisioned on Supabase
- Seed data for demo (sample analyses, demo user)
- Database backup strategy documented

### API Changes

- No new endpoints
- Production CORS whitelist configured
- Rate limiting values set for production

### Frontend Changes

- Production build optimized (`npm run build`)
- Environment variables configured for production API URL
- Favicon, meta tags, OG tags finalized
- Error pages (404, 500) polished

### Backend Changes

- Production settings configured
- Gunicorn worker count tuned
- Health check endpoints verified in production

### AI Changes

- Models uploaded to cloud storage or bundled in Docker image
- Model loading verified on free-tier hardware
- Inference time verified on production (p95 ≤ 3s)

### Testing

- Smoke tests against production deployment
- Load testing with Locust or k6 (baseline)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile device testing

### Deployment Impact

- Full production deployment
- DNS configuration (if custom domain)
- SSL certificate provisioned

### Documentation Updates

- `13_DEPLOYMENT_PLAN.md` — finalized with actual URLs and configuration
- `09_PROGRESS_LOG.md` — Phase 7 complete
- `12_CHANGELOG.md` — v1.0.0 release notes
- `README.md` — comprehensive project README
- All documents reviewed and versioned to 1.0.0

### Checklist

- [ ] Configure Supabase PostgreSQL
- [ ] Configure Upstash Redis
- [ ] Deploy backend to Render
- [ ] Deploy frontend to Vercel
- [ ] Configure production environment variables
- [ ] Verify all endpoints on production
- [ ] Smoke test entire user flow on production
- [ ] Run load test (baseline)
- [ ] Create demo script
- [ ] Record demo video
- [ ] Write final README.md
- [ ] Prepare academic project report
- [ ] Review all documentation
- [ ] Tag `v1.0.0-release`
- [ ] Create GitHub Release with release notes

### Definition of Done

- [ ] Application is live and accessible via public URL
- [ ] All critical flows work on production
- [ ] Demo can be completed in ≤ 10 minutes without errors
- [ ] Demo video recorded
- [ ] README.md is comprehensive
- [ ] All documentation is finalized (version 1.0.0)
- [ ] Git tag `v1.0.0-release` created
- [ ] GitHub Release published

---

## 10. Risk-Adjusted Timeline

| Risk                                    | Impact on Timeline     | Contingency                                              |
| --------------------------------------- | ---------------------- | -------------------------------------------------------- |
| Model training takes longer than expected | Phase 1 extends 1 week | Use pre-trained models without fine-tuning as fallback   |
| Free-tier cloud limits hit              | Phase 7 delays         | Deploy locally; use ngrok for demo                       |
| OCR accuracy below threshold            | Phase 3 partial        | Mark OCR as "beta" feature; focus on text + URL          |
| Scope creep on UI polish                | Phase 5 extends        | Time-box polish to 2 weeks; defer to post-v1             |
| Academic deadline conflict              | Any phase              | Prioritize Must Have features; drop Could Have           |

---

## 11. Sprint Cadence

| Sprint    | Duration | Phase      | Focus                                    |
| --------- | -------- | ---------- | ---------------------------------------- |
| Sprint 1  | 2 weeks  | Phase 0    | Foundation & setup                       |
| Sprint 2  | 2 weeks  | Phase 1a   | Dataset prep + model training            |
| Sprint 3  | 1 week   | Phase 1b   | Model serving + API endpoints            |
| Sprint 4  | 2 weeks  | Phase 2a   | Auth + analysis page                     |
| Sprint 5  | 1 week   | Phase 2b   | History + caching                        |
| Sprint 6  | 2 weeks  | Phase 3a   | XAI + OCR + URL scraping                 |
| Sprint 7  | 1 week   | Phase 3b   | Translation + summarization              |
| Sprint 8  | 2 weeks  | Phase 4    | Analytics + admin + export               |
| Sprint 9  | 2 weeks  | Phase 5    | Polish + ONNX optimization               |
| Sprint 10 | 2 weeks  | Phase 6    | Testing + security                       |
| Sprint 11 | 2 weeks  | Phase 7    | Deployment + demo                        |

---

## 12. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `00_PROJECT_VISION.md`       | Features and scope this roadmap delivers            |
| `01_ARCHITECTURE.md`         | Architecture each phase builds upon                 |
| `09_PROGRESS_LOG.md`         | Tracks actual progress against this roadmap         |
| `11_BACKLOG.md`              | Detailed task breakdown per phase                   |
| `18_PROJECT_TIMELINE.md`     | Calendar view of this roadmap                       |

---

## 13. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This roadmap is the execution plan for VeritasAI. Each phase must be completed and tagged before the next begins. Progress is tracked in `09_PROGRESS_LOG.md`.*
