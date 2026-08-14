# 17 — Folder Structure

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-17                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Monorepo Root

```
veritasai/
├── backend/                    # Python FastAPI backend
├── frontend/                   # React + Vite frontend
├── models/                     # Trained AI model files (Git LFS / .gitignore)
├── notebooks/                  # Jupyter notebooks for training & evaluation
├── e2e/                        # End-to-end Playwright tests
├── docs/                       # Project documentation
├── scripts/                    # Utility scripts (setup, seed, deploy)
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
│   │   │           └── 001_create_users.py
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
│   ├── modules/                        # Feature modules (bounded contexts)
│   │   ├── __init__.py
│   │   │
│   │   ├── auth/                       # Authentication & Authorization
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # Auth API endpoints
│   │   │   ├── service.py             # Auth business logic
│   │   │   ├── repository.py          # User CRUD (SQLAlchemy)
│   │   │   ├── schemas.py             # Request/response Pydantic models
│   │   │   ├── models.py              # SQLAlchemy User, RefreshToken models
│   │   │   ├── dependencies.py        # get_current_user, require_admin
│   │   │   └── exceptions.py          # Auth-specific exceptions
│   │   │
│   │   ├── analysis/                   # Analysis orchestration
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /analyze/* endpoints
│   │   │   ├── service.py             # AnalysisOrchestrator
│   │   │   ├── schemas.py             # AnalysisRequest, AnalysisResponse
│   │   │   └── exceptions.py
│   │   │
│   │   ├── detection/                  # Fake news detection (AI)
│   │   │   ├── __init__.py
│   │   │   ├── service.py             # FakeNewsDetector
│   │   │   ├── model_wrapper.py       # Model loading, tokenization, inference
│   │   │   ├── schemas.py             # DetectionResult
│   │   │   └── config.py              # Model-specific configuration
│   │   │
│   │   ├── sentiment/                  # Sentiment analysis (AI)
│   │   │   ├── __init__.py
│   │   │   ├── service.py             # SentimentAnalyzer
│   │   │   ├── model_wrapper.py       # Model loading, tokenization, inference
│   │   │   ├── schemas.py             # SentimentResult
│   │   │   └── config.py
│   │   │
│   │   ├── explainability/             # XAI (LIME, SHAP, attention)
│   │   │   ├── __init__.py
│   │   │   ├── service.py             # ExplainerService
│   │   │   ├── lime_explainer.py      # LIME wrapper
│   │   │   ├── attention_extractor.py # Attention weight extraction
│   │   │   └── schemas.py             # ExplanationResult
│   │   │
│   │   ├── language/                   # Language detection, translation, summarization
│   │   │   ├── __init__.py
│   │   │   ├── detector.py            # Language detection (langdetect)
│   │   │   ├── translator.py          # Translation service (OPUS-MT)
│   │   │   ├── summarizer.py          # Summarization service
│   │   │   ├── router.py              # /translate, /summarize endpoints
│   │   │   └── schemas.py
│   │   │
│   │   ├── input_processing/           # Input ingestion (OCR, URL, text cleaning)
│   │   │   ├── __init__.py
│   │   │   ├── text_cleaner.py        # Text normalization pipeline
│   │   │   ├── url_scraper.py         # Article extraction from URLs
│   │   │   ├── ocr_processor.py       # Tesseract OCR wrapper
│   │   │   └── schemas.py
│   │   │
│   │   ├── history/                    # Analysis history
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /history endpoints
│   │   │   ├── service.py             # History CRUD
│   │   │   ├── repository.py          # Analysis result queries
│   │   │   ├── models.py              # AnalysisResult SQLAlchemy model
│   │   │   └── schemas.py
│   │   │
│   │   ├── analytics/                  # Dashboard analytics
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /analytics endpoints
│   │   │   ├── service.py             # Aggregation logic
│   │   │   └── schemas.py
│   │   │
│   │   ├── admin/                      # Admin panel
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /admin endpoints
│   │   │   ├── service.py             # Admin operations
│   │   │   └── schemas.py
│   │   │
│   │   ├── export/                     # PDF / JSON export
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # /export endpoints
│   │   │   ├── pdf_generator.py       # ReportLab PDF builder
│   │   │   ├── json_exporter.py       # JSON file builder
│   │   │   └── templates/             # Jinja2 templates for PDF
│   │   │       └── report.html
│   │   │
│   │   ├── feedback/                   # User feedback
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── service.py
│   │   │   ├── models.py
│   │   │   └── schemas.py
│   │   │
│   │   └── model_registry/            # AI model management
│   │       ├── __init__.py
│   │       ├── registry.py            # ModelRegistry singleton
│   │       ├── models.py              # ModelMetadata SQLAlchemy model
│   │       └── schemas.py
│   │
│   └── middleware/                     # FastAPI middleware
│       ├── __init__.py
│       ├── error_handler.py           # Global exception → response mapper
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
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   └── hooks/
│   │   │       └── useAuth.ts
│   │   │
│   │   ├── analyze/
│   │   │   ├── pages/
│   │   │   │   └── AnalyzePage.tsx
│   │   │   ├── components/
│   │   │   │   ├── TextInputTab.tsx
│   │   │   │   ├── UrlInputTab.tsx
│   │   │   │   ├── ImageInputTab.tsx
│   │   │   │   ├── ResultsDisplay.tsx
│   │   │   │   ├── CredibilityCard.tsx
│   │   │   │   ├── SentimentCard.tsx
│   │   │   │   ├── XaiExplanation.tsx
│   │   │   │   ├── AttentionHeatmap.tsx
│   │   │   │   └── ConfidenceGauge.tsx
│   │   │   └── hooks/
│   │   │       └── useAnalysis.ts
│   │   │
│   │   ├── history/
│   │   │   ├── pages/
│   │   │   │   ├── HistoryPage.tsx
│   │   │   │   └── AnalysisDetailPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── HistoryTable.tsx
│   │   │   │   └── HistoryFilters.tsx
│   │   │   └── hooks/
│   │   │       └── useHistory.ts
│   │   │
│   │   ├── dashboard/
│   │   │   ├── pages/
│   │   │   │   └── DashboardPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── StatCard.tsx
│   │   │   │   ├── TrendChart.tsx
│   │   │   │   ├── LanguagePieChart.tsx
│   │   │   │   └── CredibilityBarChart.tsx
│   │   │   └── hooks/
│   │   │       └── useAnalytics.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── pages/
│   │   │   │   └── AdminPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── UserTable.tsx
│   │   │   │   └── SystemStats.tsx
│   │   │   └── hooks/
│   │   │       └── useAdmin.ts
│   │   │
│   │   └── profile/
│   │       ├── pages/
│   │       │   └── ProfilePage.tsx
│   │       └── components/
│   │           └── ProfileForm.tsx
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
