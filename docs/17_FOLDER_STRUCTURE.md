# 17 — Folder Structure

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-17                                                             |
| **Version**        | 1.1.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-09-11                                                         |

---

## 1. Monorepo Root

```
veritasai/
├── backend/                    # Python FastAPI backend
├── frontend/                   # React + Vite frontend
├── models/                     # Trained AI model files (Git LFS / .gitignore)
├── notebooks/                  # Jupyter notebooks for training & evaluation
├── e2e/                        # End-to-end Playwright tests (Phase 6)
├── docs/                       # Project documentation
├── scripts/                    # Utility scripts (benchmark, setup, init)
├── docker/                     # Dockerfiles and compose configs
├── .github/                    # GitHub Actions workflows
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── .pre-commit-config.yaml     # Pre-commit hooks configuration
├── docker-compose.yml          # Development compose file
├── docker-compose.prod.yml     # Production compose file
├── Makefile                    # Common commands (make dev, make test, etc.)
├── LICENSE                     # Project license
└── README.md                   # Project overview and setup instructions
```

---

## 2. Backend Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                         # FastAPI app factory, CORS, middleware, router mounting
│   ├── config.py                       # Pydantic BaseSettings (loads .env)
│   ├── dependencies.py                 # Shared FastAPI Depends() providers
│   │
│   ├── core/                           # Shared domain layer
│   │   ├── __init__.py
│   │   ├── exceptions.py              # Custom exception hierarchy
│   │   ├── constants.py               # App-wide constants
│   │   ├── security.py                # JWT utils, password hashing
│   │   ├── schemas.py                 # Base response schemas (envelope, pagination, error)
│   │   └── types.py                   # Shared type aliases and enums
│   │
│   ├── infrastructure/                 # External service adapters
│   │   ├── __init__.py
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   ├── session.py             # SQLAlchemy async engine & session factory
│   │   │   ├── base.py                # Declarative base + mixins (timestamps, UUID PK)
│   │   │   └── migrations/            # Alembic directory
│   │   │       ├── env.py
│   │   │       ├── alembic.ini
│   │   │       └── versions/
│   │   │           ├── 8a9aac35e684_create_analysis_results_table.py
│   │   │           ├── 671939c98ccd_create_users_table.py
│   │   │           └── e1a47b892c01_add_auth_fields_to_analysis_results.py
│   │   ├── cache/
│   │   │   ├── __init__.py
│   │   │   ├── redis_client.py        # Redis connection + helpers
│   │   │   └── cache_service.py       # Cache get/set/invalidate
│   │   ├── storage/
│   │   │   ├── __init__.py
│   │   │   └── file_storage.py        # Local / S3 file storage abstraction
│   │   └── logging/
│   │       ├── __init__.py
│   │       └── setup.py               # structlog configuration
│   │
│   ├── models/                         # SQLAlchemy declarative models
│   │   ├── __init__.py
│   │   ├── analysis.py                # AnalysisResult ORM model
│   │   └── user.py                    # User ORM model
│   │
│   ├── modules/                        # Feature modules (bounded contexts)
│   │   ├── __init__.py
│   │   │
│   │   ├── auth/                       # Authentication & Authorization
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # Auth API endpoints (/register, /login, /refresh, /logout, /me)
│   │   │   ├── service.py             # Auth business logic
│   │   │   ├── schemas.py             # Request/response Pydantic models
│   │   │   ├── security.py            # Password hashing & JWT token handling
│   │   │   └── dependencies.py        # get_current_user, get_optional_user
│   │   │
│   │   ├── analysis/                   # Analysis orchestration
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # POST /api/v1/analyze/text
│   │   │   ├── services.py            # AnalysisService orchestration
│   │   │   └── schemas.py             # TextAnalysisRequest, AnalysisResponse
│   │   │
│   │   ├── detection/                  # Fake news detection (AI)
│   │   │   ├── __init__.py
│   │   │   └── model.py               # XLM-RoBERTa FakeNewsModel wrapper
│   │   │
│   │   ├── sentiment/                  # Sentiment analysis (AI)
│   │   │   ├── __init__.py
│   │   │   └── model.py               # XLM-RoBERTa SentimentModel wrapper
│   │   │
│   │   ├── explainability/             # Gradient × Input token attribution (XAI)
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # POST /api/v1/explain/text
│   │   │   ├── services.py            # TokenAttributionEngine (Grad×Input)
│   │   │   └── schemas.py             # ExplainRequest, ExplainResponse, AttributedToken
│   │   │
│   │   ├── image_analysis/             # In-memory OCR & preprocessing
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # POST /api/v1/analyze/image
│   │   │   ├── security.py            # Bounded stream reader, magic bytes, Pillow bomb protection
│   │   │   ├── services.py            # ImagePreprocessor, OcrEngine (dynamic Tesseract discovery)
│   │   │   └── schemas.py             # ImageAnalysisResponse
│   │   │
│   │   ├── url_analysis/               # Safe URL scraping & analysis
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # POST /api/v1/analyze/url
│   │   │   ├── services.py            # Multi-layer SSRF defense & content extraction
│   │   │   └── schemas.py             # UrlAnalysisRequest, UrlAnalysisResponse
│   │   │
│   │   ├── translation/                # Multilingual detection & presentation translation
│   │   │   ├── __init__.py
│   │   │   ├── detector.py            # Deterministic LanguageDetector (langdetect, seed=0)
│   │   │   ├── languages.py           # 14-language ISO-639 registry
│   │   │   ├── router.py              # GET /languages, POST /translate
│   │   │   ├── services.py            # TranslationService, MyMemory provider, LRU caching
│   │   │   └── schemas.py             # TranslateRequest, TranslateResponse, LanguagesResponse
│   │   │
│   │   ├── history/                    # Analysis history with IDOR prevention
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # GET /history, GET /history/{id}, DELETE /history/{id}
│   │   │   ├── service.py             # History CRUD logic
│   │   │   └── schemas.py             # HistoryResponse, HistoryItem
│   │   │
│   │   └── dashboard/                  # Analytics dashboard
│   │       ├── __init__.py
│   │       ├── router.py              # GET /dashboard/summary
│   │       ├── service.py             # Server-side SQL aggregation queries
│   │       └── schemas.py             # DashboardSummaryResponse, TrendPoint, DistributionItem
│       ├── rate_limiter.py            # Token bucket rate limiting
│       ├── request_id.py              # X-Request-ID injection
│       └── security_headers.py        # HTTP security headers
│
├── tests/                              # Test directory (mirrors app/ structure)
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   ├── ai/
│   └── factories/
│
├── scripts/                            # Utility scripts
│   ├── seed_dev.py                    # Development seed data
│   ├── seed_demo.py                   # Demo seed data
│   └── export_onnx.py                # Model ONNX export script
│
├── pyproject.toml                      # Python project config (deps, tools)
├── requirements.lock                   # Locked dependencies
├── Dockerfile                          # Backend Docker image
└── .env.example                        # Backend env template
```

---

## 3. Frontend Structure

```
frontend/
├── src/
│   ├── app/                            # App-level setup
│   │   ├── App.tsx                     # Root component
│   │   ├── Router.tsx                  # Route definitions
│   │   ├── Providers.tsx              # Context providers wrapper
│   │   └── main.tsx                   # Entry point (ReactDOM.createRoot)
│   │
│   ├── features/                       # Feature-based modules
│   │   ├── auth/
│   │   │   └── pages/
│   │   │       ├── LoginPage.tsx
│   │   │       └── RegisterPage.tsx
│   │   │
│   │   ├── analyze/
│   │   │   ├── pages/
│   │   │   │   ├── AnalyzePage.tsx        # Tabbed analysis (Text, URL, Image)
│   │   │   │   ├── AnalyzePage.test.tsx   # Vitest unit & interaction tests
│   │   │   │   ├── Explainability.test.tsx
│   │   │   │   └── Translation.test.tsx
│   │   │   └── components/
│   │   │       ├── ExplainabilityPanel.tsx # Interactive token attribution & sentiment
│   │   │       └── TranslationPanel.tsx    # Presentation translation across 14 languages
│   │   │
│   │   ├── history/
│   │   │   └── pages/
│   │   │       └── HistoryPage.tsx        # Interactive history table, modal, delete
│   │   │
│   │   └── dashboard/
│   │       └── pages/
│   │           └── DashboardPage.tsx      # Analytics dashboard with Recharts
│   │
│   ├── components/                     # Shared UI components
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   ├── Input.tsx
│   │   │   ├── TextArea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── layout/
│   │   │   ├── AuthLayout.tsx          # Layout for login/register
│   │   │   ├── AppLayout.tsx           # Layout for authenticated pages
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── charts/
│   │       ├── LineChart.tsx           # Recharts wrapper
│   │       ├── PieChart.tsx
│   │       ├── BarChart.tsx
│   │       └── HeatmapChart.tsx
│   │
│   ├── hooks/                          # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useMediaQuery.ts
│   │   ├── useLocalStorage.ts
│   │   └── useTheme.ts
│   │
│   ├── services/                       # API client layer
│   │   ├── api.ts                     # Axios instance + interceptors
│   │   ├── auth.service.ts
│   │   ├── analysis.service.ts
│   │   ├── history.service.ts
│   │   ├── analytics.service.ts
│   │   ├── admin.service.ts
│   │   └── export.service.ts
│   │
│   ├── store/                          # Zustand stores
│   │   ├── auth.store.ts
│   │   ├── theme.store.ts
│   │   └── ui.store.ts
│   │
│   ├── types/                          # TypeScript type definitions
│   │   ├── api.types.ts               # API response/request types
│   │   ├── analysis.types.ts
│   │   ├── auth.types.ts
│   │   └── common.types.ts
│   │
│   ├── utils/                          # Utility functions
│   │   ├── format.util.ts             # Date, number formatting
│   │   ├── validation.util.ts         # Zod schemas
│   │   └── constants.ts               # App-wide constants
│   │
│   ├── assets/                         # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   │
│   └── styles/                         # Global styles
│       ├── index.css                  # CSS reset + global styles
│       ├── variables.css              # CSS custom properties (design tokens)
│       ├── typography.css             # Font imports + type scale
│       └── animations.css            # Shared keyframe animations
│
├── public/
│   ├── favicon.ico
│   └── robots.txt
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json
├── Dockerfile
├── .env.example
└── .eslintrc.cjs
```

---

## 4. Other Directories

### 4.1 Documentation

```
docs/
├── 00_PROJECT_VISION.md
├── 01_ARCHITECTURE.md
├── 02_TECH_STACK.md
├── 03_DEVELOPMENT_ROADMAP.md
├── 04_DATABASE_DESIGN.md
├── 05_API_SPECIFICATION.md
├── 06_AI_PIPELINE.md
├── 07_UI_UX_DESIGN.md
├── 08_CODING_GUIDELINES.md
├── 09_PROGRESS_LOG.md
├── 10_TECHNICAL_DECISIONS.md
├── 11_BACKLOG.md
├── 12_CHANGELOG.md
├── 13_DEPLOYMENT_PLAN.md
├── 14_TESTING_STRATEGY.md
├── 15_SECURITY_PLAN.md
├── 16_RISK_ANALYSIS.md
├── 17_FOLDER_STRUCTURE.md
├── 18_PROJECT_TIMELINE.md
└── prompts/
    └── ai_context.md
```

### 4.2 Docker

```
docker/
├── backend.Dockerfile
├── frontend.Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── nginx.prod.conf
└── .dockerignore
```

### 4.3 GitHub Actions

```
.github/
├── workflows/
│   ├── ci.yml                  # Lint + type-check + test on push/PR
│   ├── e2e.yml                 # E2E tests on push to main
│   └── deploy.yml              # Deploy to Render + Vercel (manual trigger)
└── PULL_REQUEST_TEMPLATE.md
```

### 4.4 Notebooks

```
notebooks/
├── 01_data_exploration.ipynb
├── 02_fake_news_training.ipynb
├── 03_sentiment_training.ipynb
├── 04_model_evaluation.ipynb
├── 05_onnx_export.ipynb
└── data/
    ├── raw/                    # Raw downloaded datasets
    ├── processed/              # Cleaned, split datasets
    └── augmented/              # Translation-augmented datasets
```

### 4.5 E2E Tests

```
e2e/
├── tests/
│   ├── auth.spec.ts
│   ├── analysis.spec.ts
│   ├── history.spec.ts
│   ├── dashboard.spec.ts
│   └── admin.spec.ts
├── fixtures/
│   └── test-data.ts
├── pages/                      # Page Object Model
│   ├── login.page.ts
│   ├── analyze.page.ts
│   └── history.page.ts
└── playwright.config.ts
```

---

## 5. Key .gitignore Rules

```gitignore
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.pyc
.venv/
*.egg-info/

# Node
node_modules/
dist/

# AI Models (too large for Git)
models/**/*.bin
models/**/*.onnx
models/**/*.pt
!models/**/.gitkeep

# Data
notebooks/data/raw/
notebooks/data/processed/

# IDE
.vscode/
.idea/

# Docker
*.log

# OS
.DS_Store
Thumbs.db
```

---

## 6. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This document defines the file and folder structure for VeritasAI. All new files must be placed according to this structure.*
