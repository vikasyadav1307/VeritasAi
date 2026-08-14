# 11 — Backlog

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-11                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## Priority Legend

| Priority     | Meaning                                          | SLA               |
| ------------ | ------------------------------------------------ | ------------------ |
| 🔴 Critical  | Blocks all progress; must be resolved immediately | Current sprint     |
| 🟠 High      | Core feature; required for MVP                    | Next 1–2 sprints   |
| 🟡 Medium    | Important but not blocking                        | Next 2–4 sprints   |
| 🟢 Low       | Nice to have; can defer                           | Backlog            |

---

## Phase 0 — Foundation

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-001 | 🔴 Critical | Initialize Git repository and monorepo structure    | None         | 1h          | ⬜ Todo    |
| BL-002 | 🔴 Critical | Create FastAPI backend skeleton with health endpoint | BL-001       | 2h          | ⬜ Todo    |
| BL-003 | 🔴 Critical | Create React + Vite frontend skeleton               | BL-001       | 2h          | ⬜ Todo    |
| BL-004 | 🔴 Critical | Create Docker Compose (all services)                | BL-002, BL-003 | 3h        | ⬜ Todo    |
| BL-005 | 🟠 High     | Configure Alembic for database migrations           | BL-002       | 1h          | ⬜ Todo    |
| BL-006 | 🟠 High     | Set up structured logging (structlog)               | BL-002       | 1h          | ⬜ Todo    |
| BL-007 | 🟠 High     | Configure CORS middleware                           | BL-002       | 30m         | ⬜ Todo    |
| BL-008 | 🟠 High     | Create global error handler middleware              | BL-002       | 1h          | ⬜ Todo    |
| BL-009 | 🟠 High     | Create React app shell (router, layout)             | BL-003       | 2h          | ⬜ Todo    |
| BL-010 | 🟠 High     | Set up pre-commit hooks (Ruff, ESLint, Prettier)    | BL-001       | 1h          | ⬜ Todo    |
| BL-011 | 🟠 High     | Create GitHub Actions CI workflow                   | BL-001       | 2h          | ⬜ Todo    |
| BL-012 | 🟡 Medium   | Write backend smoke test (health endpoint)          | BL-002       | 30m         | ⬜ Todo    |
| BL-013 | 🟡 Medium   | Write frontend smoke test (app renders)             | BL-003       | 30m         | ⬜ Todo    |
| BL-014 | 🟡 Medium   | Configure Pydantic BaseSettings for .env loading    | BL-002       | 30m         | ⬜ Todo    |

---

## Phase 1 — Core AI Pipeline

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-020 | 🔴 Critical | Collect and clean fake news datasets (EN, HI)       | None         | 4h          | ⬜ Todo    |
| BL-021 | 🔴 Critical | Create dataset preprocessing pipeline               | BL-020       | 3h          | ⬜ Todo    |
| BL-022 | 🔴 Critical | Fine-tune XLM-RoBERTa for fake news detection       | BL-021       | 8h          | ⬜ Todo    |
| BL-023 | 🔴 Critical | Fine-tune XLM-RoBERTa for sentiment analysis        | BL-021       | 6h          | ⬜ Todo    |
| BL-024 | 🔴 Critical | Implement ModelRegistry (singleton, loading, caching) | BL-002      | 3h          | ⬜ Todo    |
| BL-025 | 🔴 Critical | Implement FakeNewsDetector service                   | BL-022, BL-024 | 3h       | ⬜ Todo    |
| BL-026 | 🔴 Critical | Implement SentimentAnalyzer service                  | BL-023, BL-024 | 3h       | ⬜ Todo    |
| BL-027 | 🟠 High     | Implement LanguageDetector service (langdetect)      | BL-002       | 1h          | ⬜ Todo    |
| BL-028 | 🟠 High     | Implement AnalysisOrchestrator                       | BL-025, BL-026, BL-027 | 3h | ⬜ Todo |
| BL-029 | 🟠 High     | Create POST /api/v1/analyze/text endpoint            | BL-028       | 2h          | ⬜ Todo    |
| BL-030 | 🟠 High     | Create analysis_results DB table + migration         | BL-005       | 1h          | ⬜ Todo    |
| BL-031 | 🟡 Medium   | Evaluate models and document results                 | BL-022, BL-023 | 2h       | ⬜ Todo    |
| BL-032 | 🟡 Medium   | Create GET /api/v1/languages endpoint                | BL-027       | 30m         | ⬜ Todo    |
| BL-033 | 🟡 Medium   | Create GET /api/v1/models endpoint                   | BL-024       | 30m         | ⬜ Todo    |
| BL-034 | 🟡 Medium   | Write AI module unit tests                           | BL-025, BL-026 | 3h       | ⬜ Todo    |
| BL-035 | 🟡 Medium   | Augment datasets for ES, FR, AR (translation)        | BL-020       | 4h          | ⬜ Todo    |

---

## Phase 2 — Web Application Core

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-040 | 🔴 Critical | Create users table + migration                      | BL-005       | 1h          | ⬜ Todo    |
| BL-041 | 🔴 Critical | Implement auth service (register, login, JWT)        | BL-040       | 4h          | ⬜ Todo    |
| BL-042 | 🔴 Critical | Implement refresh token rotation                     | BL-041       | 2h          | ⬜ Todo    |
| BL-043 | 🔴 Critical | Implement RBAC middleware                            | BL-041       | 2h          | ⬜ Todo    |
| BL-044 | 🔴 Critical | Create auth API endpoints (7 routes)                 | BL-041       | 3h          | ⬜ Todo    |
| BL-045 | 🔴 Critical | Build Login page                                     | BL-009       | 3h          | ⬜ Todo    |
| BL-046 | 🔴 Critical | Build Register page                                  | BL-009       | 2h          | ⬜ Todo    |
| BL-047 | 🔴 Critical | Build authenticated layout (sidebar, header)         | BL-009       | 3h          | ⬜ Todo    |
| BL-048 | 🔴 Critical | Build Analysis page (text input form)                | BL-047       | 4h          | ⬜ Todo    |
| BL-049 | 🔴 Critical | Build Results display component                      | BL-048       | 4h          | ⬜ Todo    |
| BL-050 | 🟠 High     | Build History page (paginated table)                 | BL-047       | 3h          | ⬜ Todo    |
| BL-051 | 🟠 High     | Implement Redis caching for analysis results         | BL-029       | 2h          | ⬜ Todo    |
| BL-052 | 🟠 High     | Build User Profile page                              | BL-047       | 2h          | ⬜ Todo    |
| BL-053 | 🟠 High     | Create history API endpoints (3 routes)              | BL-030       | 2h          | ⬜ Todo    |
| BL-054 | 🟠 High     | Connect frontend to all backend endpoints            | BL-044, BL-048 | 3h       | ⬜ Todo    |
| BL-055 | 🟡 Medium   | Implement Axios interceptor for JWT refresh          | BL-054       | 1h          | ⬜ Todo    |
| BL-056 | 🟡 Medium   | Write auth flow tests (backend)                      | BL-044       | 3h          | ⬜ Todo    |
| BL-057 | 🟡 Medium   | Write frontend component tests                      | BL-048, BL-049 | 3h       | ⬜ Todo    |

---

## Phase 3 — Advanced AI Features

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-060 | 🔴 Critical | Implement LIME wrapper for fake news model           | BL-025       | 4h          | ⬜ Todo    |
| BL-061 | 🔴 Critical | Implement attention weight extraction                | BL-025       | 2h          | ⬜ Todo    |
| BL-062 | 🟠 High     | Implement Tesseract OCR wrapper                      | BL-002       | 3h          | ⬜ Todo    |
| BL-063 | 🟠 High     | Implement image preprocessing pipeline               | BL-062       | 2h          | ⬜ Todo    |
| BL-064 | 🟠 High     | Implement URL scraper (newspaper3k + BS4)            | BL-002       | 3h          | ⬜ Todo    |
| BL-065 | 🟠 High     | Implement text cleaner / normalizer                  | BL-002       | 2h          | ⬜ Todo    |
| BL-066 | 🟠 High     | Implement translation service (OPUS-MT)              | BL-024       | 4h          | ⬜ Todo    |
| BL-067 | 🟠 High     | Implement summarization service                      | BL-024       | 3h          | ⬜ Todo    |
| BL-068 | 🟠 High     | Create URL and image analysis API endpoints          | BL-064, BL-062 | 3h       | ⬜ Todo    |
| BL-069 | 🟠 High     | Build tabbed input UI (Text / URL / Image)           | BL-048       | 3h          | ⬜ Todo    |
| BL-070 | 🟠 High     | Build XAI visualization (word highlighting)          | BL-049       | 4h          | ⬜ Todo    |
| BL-071 | 🟡 Medium   | Build image upload with drag-and-drop                | BL-069       | 2h          | ⬜ Todo    |
| BL-072 | 🟡 Medium   | Build attention heatmap display                      | BL-070       | 3h          | ⬜ Todo    |
| BL-073 | 🟡 Medium   | Build confidence meter (gauge component)             | BL-049       | 2h          | ⬜ Todo    |

---

## Phase 4 — Platform Features

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-080 | 🟠 High     | Implement analytics aggregation queries              | BL-030       | 3h          | ⬜ Todo    |
| BL-081 | 🟠 High     | Create analytics API endpoints (3 routes)            | BL-080       | 2h          | ⬜ Todo    |
| BL-082 | 🟠 High     | Build analytics dashboard (Recharts)                 | BL-081       | 6h          | ⬜ Todo    |
| BL-083 | 🟠 High     | Implement admin user management service              | BL-043       | 3h          | ⬜ Todo    |
| BL-084 | 🟠 High     | Create admin API endpoints (4 routes)                | BL-083       | 2h          | ⬜ Todo    |
| BL-085 | 🟠 High     | Build admin panel UI                                 | BL-084       | 4h          | ⬜ Todo    |
| BL-086 | 🟡 Medium   | Implement PDF report generator (ReportLab)           | BL-029       | 4h          | ⬜ Todo    |
| BL-087 | 🟡 Medium   | Implement JSON export                                | BL-029       | 1h          | ⬜ Todo    |
| BL-088 | 🟡 Medium   | Implement rate limiting middleware                   | BL-002       | 3h          | ⬜ Todo    |
| BL-089 | 🟡 Medium   | Create feedback API endpoint                         | BL-030       | 1h          | ⬜ Todo    |

---

## Phase 5 — Polish & Optimization

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-090 | 🟠 High     | Export models to ONNX format                         | BL-022, BL-023 | 3h       | ⬜ Todo    |
| BL-091 | 🟠 High     | Apply INT8 dynamic quantization                      | BL-090       | 2h          | ⬜ Todo    |
| BL-092 | 🟠 High     | Implement responsive design for all pages            | BL-047       | 4h          | ⬜ Todo    |
| BL-093 | 🟡 Medium   | Add Framer Motion animations                         | BL-047       | 3h          | ⬜ Todo    |
| BL-094 | 🟡 Medium   | Add skeleton loaders everywhere                      | BL-047       | 2h          | ⬜ Todo    |
| BL-095 | 🟡 Medium   | Implement lazy route loading                         | BL-009       | 1h          | ⬜ Todo    |
| BL-096 | 🟡 Medium   | Run Lighthouse audit and fix issues                  | BL-092       | 3h          | ⬜ Todo    |
| BL-097 | 🟢 Low      | Add error boundaries with retry                      | BL-047       | 2h          | ⬜ Todo    |

---

## Phase 6 — Testing & Security

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-100 | 🟠 High     | Write missing backend tests (target 80% coverage)   | All backend  | 6h          | ⬜ Todo    |
| BL-101 | 🟠 High     | Write missing frontend tests (target 70% coverage)  | All frontend | 6h          | ⬜ Todo    |
| BL-102 | 🟠 High     | Write 5+ E2E tests in Playwright                    | All          | 4h          | ⬜ Todo    |
| BL-103 | 🟠 High     | Run OWASP ZAP scan and fix findings                 | All          | 3h          | ⬜ Todo    |
| BL-104 | 🟠 High     | Implement security headers middleware                | BL-002       | 1h          | ⬜ Todo    |
| BL-105 | 🟡 Medium   | Run pip-audit and npm audit                          | All          | 1h          | ⬜ Todo    |
| BL-106 | 🟡 Medium   | Review and tighten input validation                  | All          | 2h          | ⬜ Todo    |

---

## Phase 7 — Deployment & Demo

| ID     | Priority    | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ----------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-110 | 🔴 Critical | Deploy backend to Render                             | All          | 3h          | ⬜ Todo    |
| BL-111 | 🔴 Critical | Deploy frontend to Vercel                            | All          | 2h          | ⬜ Todo    |
| BL-112 | 🔴 Critical | Configure production database (Supabase)             | All          | 2h          | ⬜ Todo    |
| BL-113 | 🔴 Critical | Configure production Redis (Upstash)                 | All          | 1h          | ⬜ Todo    |
| BL-114 | 🔴 Critical | Create demo script and test flow                     | All          | 3h          | ⬜ Todo    |
| BL-115 | 🟠 High     | Record demo video                                    | BL-114       | 2h          | ⬜ Todo    |
| BL-116 | 🟠 High     | Write final README.md                                | All          | 3h          | ⬜ Todo    |
| BL-117 | 🟠 High     | Finalize all documentation                           | All          | 3h          | ⬜ Todo    |
| BL-118 | 🟡 Medium   | Create seed data for demo                            | BL-112       | 2h          | ⬜ Todo    |
| BL-119 | 🟡 Medium   | Run load test on production                          | BL-110       | 2h          | ⬜ Todo    |

---

## Stretch Goals (Post-v1)

| ID     | Priority   | Description                                         | Dependencies | Est. Effort | Status     |
| ------ | ---------- | --------------------------------------------------- | ------------ | ----------- | ---------- |
| BL-200 | 🟢 Low    | Browser extension (Chrome)                           | v1.0         | 20h         | ⬜ Todo    |
| BL-201 | 🟢 Low    | Real-time news feed monitoring (WebSocket)           | v1.0         | 15h         | ⬜ Todo    |
| BL-202 | 🟢 Low    | Emotion detection (beyond 3-class sentiment)         | v1.0         | 8h          | ⬜ Todo    |
| BL-203 | 🟢 Low    | Comparative model benchmarking dashboard             | v1.0         | 10h         | ⬜ Todo    |
| BL-204 | 🟢 Low    | API key management UI                                | v1.0         | 6h          | ⬜ Todo    |
| BL-205 | 🟢 Low    | Community fact-check submissions                     | v1.0         | 15h         | ⬜ Todo    |

---

## Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This backlog is the authoritative task list. Items move from here into sprint planning. Update status as work progresses.*
