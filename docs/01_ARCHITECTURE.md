# 01 — System Architecture

> **VerifAI — Multilingual Fake News Detection and Sentiment Analysis**
>
> Architecture Design Document

---

## 1. Architecture Overview

VerifAI follows a **Modular Monolith** architecture with clearly defined domain boundaries, enabling future extraction into microservices without rewrites. The system is organized into three major tiers — **Presentation**, **Application**, and **Infrastructure** — aligned with Clean Architecture principles.

### 1.1 Architecture Style Decision

| Option | Pros | Cons | Verdict |
|---|---|---|---|
| Pure Monolith | Simple, fast to build | Tight coupling, hard to scale | ❌ |
| Microservices | Independent scaling, fault isolation | Overkill for solo dev, operational complexity | ❌ |
| **Modular Monolith** | Clean boundaries, single deployment, easy to extract later | Requires discipline | ✅ Chosen |

> **Rationale:** A solo developer building within a 16-week timeline cannot operate multiple services. A modular monolith gives us domain isolation (microservice-ready boundaries) with the simplicity of a single deployment unit.

---

## 2. High-Level System Architecture

```
                            ┌─────────────────┐
                            │   Web Browser    │
                            └────────┬────────┘
                                     │ HTTPS
                            ┌────────▼────────┐
                            │  Reverse Proxy   │
                            │  (Nginx/Caddy)   │
                            └────────┬────────┘
                      ┌──────────────┴──────────────┐
                      │                             │
              ┌───────▼───────┐            ┌────────▼────────┐
              │   Frontend    │            │    Backend API   │
              │   React+Vite  │            │    FastAPI       │
              │   (Static)    │            │    (Dynamic)     │
              └───────────────┘            └────────┬────────┘
                                                    │
                                    ┌───────────────┼───────────────┐
                                    │               │               │
                            ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
                            │  AI/ML       │ │  Database   │ │   Cache    │
                            │  Pipeline    │ │  PostgreSQL │ │   Redis    │
                            │  (Transformers)│ │            │ │            │
                            └──────────────┘ └─────────────┘ └────────────┘
```

---

## 3. Clean Architecture Layers

The backend follows a strict **four-layer Clean Architecture** with an inward dependency rule: outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (API Routes, Request/Response DTOs, Middleware)            │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│  (Use Cases, Services, Orchestration, DTOs)                 │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                            │
│  (Entities, Value Objects, Domain Events, Interfaces)       │
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                       │
│  (Database, External APIs, ML Models, File Storage, Cache)  │
└─────────────────────────────────────────────────────────────┘

         ▲ Dependency Direction: Always Inward ▲
```

### 3.1 Layer Responsibilities

| Layer | Responsibility | May Depend On | Never Depends On |
|---|---|---|---|
| **Domain** | Core business entities and rules | Nothing (innermost) | Any outer layer |
| **Application** | Use case orchestration, service interfaces | Domain | Presentation, Infrastructure |
| **Infrastructure** | Concrete implementations (DB, ML, APIs) | Domain, Application | Presentation |
| **Presentation** | HTTP routing, serialization, middleware | Application, Domain | Infrastructure (directly) |

### 3.2 Dependency Inversion

Infrastructure implementations are injected into Application services via **interfaces defined in the Domain/Application layer**:

```
Application Layer                Infrastructure Layer
┌─────────────────┐              ┌─────────────────────┐
│ AnalysisService │─depends on──▶│ IAnalysisRepository  │ ← Interface
│                 │              │        (abstract)     │
└─────────────────┘              └─────────┬───────────┘
                                           │ implements
                                 ┌─────────▼───────────┐
                                 │ PostgresAnalysisRepo │ ← Concrete
                                 └─────────────────────┘
```

---

## 4. Domain Modules

The backend is decomposed into **bounded contexts** (domain modules). Each module owns its entities, use cases, repositories, and routes.

```
backend/
├── modules/
│   ├── auth/           ← Authentication & Authorization
│   ├── analysis/       ← Core analysis orchestration
│   ├── ai/             ← ML model inference & explainability
│   ├── history/        ← User analysis history
│   ├── analytics/      ← Dashboard & trend analytics
│   └── admin/          ← Admin operations
├── core/               ← Shared kernel (config, errors, middleware)
└── infrastructure/     ← Cross-cutting infra (DB, cache, storage)
```

### 4.1 Module Boundary Rules

1. Modules communicate **only through well-defined interfaces** (service contracts or domain events).
2. No module may directly import another module's internal implementation.
3. Each module exposes a **public API surface** via its `__init__.py` or a dedicated `api.py`.
4. Shared types live in `core/` — never in a specific module.
5. Database models are **per-module**; cross-module joins are prohibited.

### 4.2 Module Dependency Graph

```
                    ┌──────────┐
                    │   core   │ ◀── Every module depends on core
                    └──────────┘
                         ▲
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐
    │  auth   │    │ analysis  │   │ analytics │
    └─────────┘    └─────┬─────┘   └───────────┘
                         │
                    ┌────┴────┐
                    │   ai    │
                    └────┬────┘
                         │
                    ┌────┴────┐
                    │ history │
                    └─────────┘
```

| Module | Depends On | Depended On By |
|---|---|---|
| `core` | — | All modules |
| `auth` | `core` | `analysis`, `history`, `analytics`, `admin` |
| `ai` | `core` | `analysis` |
| `analysis` | `core`, `ai`, `auth` | `history`, `analytics` |
| `history` | `core`, `auth`, `analysis` | `analytics` |
| `analytics` | `core`, `auth`, `history` | `admin` |
| `admin` | `core`, `auth`, `analytics` | — |

---

## 5. Component Architecture

### 5.1 Frontend Architecture

```
frontend/
├── public/                     ← Static assets
├── src/
│   ├── app/                    ← App shell, routing, providers
│   ├── features/               ← Feature-based modules
│   │   ├── auth/               ← Login, Register, AuthContext
│   │   ├── analysis/           ← Analysis form, results, XAI
│   │   ├── history/            ← Analysis history list
│   │   ├── dashboard/          ← Analytics dashboard
│   │   └── settings/           ← User settings
│   ├── shared/                 ← Shared components, hooks, utils
│   │   ├── components/         ← Button, Card, Modal, Layout
│   │   ├── hooks/              ← useAuth, useApi, useDebounce
│   │   ├── utils/              ← Formatters, validators
│   │   └── types/              ← TypeScript interfaces
│   ├── services/               ← API client layer
│   └── styles/                 ← Global styles, design tokens
├── index.html
└── vite.config.ts
```

**Frontend Design Principles:**

- **Feature-based organization** — each feature is self-contained with its own components, hooks, and types.
- **Shared layer** — only truly reusable code lives in `shared/`.
- **Service layer** — all API calls go through `services/`, never directly from components.
- **No prop drilling** — use React Context or a lightweight state manager for cross-cutting state.

### 5.2 Backend Architecture (Per Module)

Each backend module follows a consistent internal structure:

```
modules/<module_name>/
├── __init__.py                 ← Public API surface
├── router.py                   ← FastAPI route definitions
├── schemas.py                  ← Pydantic request/response models
├── service.py                  ← Business logic / use cases
├── models.py                   ← SQLAlchemy ORM models
├── repository.py               ← Data access layer
├── dependencies.py             ← FastAPI dependency injection
├── exceptions.py               ← Module-specific exceptions
└── tests/
    ├── test_service.py
    ├── test_router.py
    └── test_repository.py
```

### 5.3 AI Pipeline Architecture

```
modules/ai/
├── __init__.py
├── router.py                   ← AI-specific endpoints (if any)
├── schemas.py                  ← AI input/output schemas
├── service.py                  ← Orchestrator: calls individual pipelines
├── pipelines/
│   ├── __init__.py
│   ├── base.py                 ← Abstract pipeline interface
│   ├── fake_news.py            ← Fake news classification pipeline
│   ├── sentiment.py            ← Sentiment & emotion analysis
│   ├── language_detect.py      ← Language detection
│   ├── translation.py          ← Translation pipeline
│   ├── summarization.py        ← Text summarization
│   ├── ocr.py                  ← Image-to-text extraction
│   └── explainability.py       ← LIME/SHAP/Attention XAI
├── models/                     ← Model loading & caching
│   ├── __init__.py
│   ├── model_registry.py       ← Central model registry
│   └── model_loader.py         ← Lazy loading with caching
├── config.py                   ← Model paths, thresholds, settings
└── tests/
```

**Pipeline Design:**

Every AI pipeline implements a common interface:

```
┌─────────────────────────────────┐
│        BasePipeline (ABC)       │
├─────────────────────────────────┤
│ + load_model()                  │
│ + predict(input) → output       │
│ + explain(input) → explanation  │
│ + get_model_info() → metadata   │
└─────────────────────────────────┘
         ▲           ▲           ▲
         │           │           │
   FakeNewsPipeline  SentimentPipeline  ...
```

---

## 6. Data Flow Architecture

### 6.1 Primary Analysis Flow

```
User Input (Text / URL / Image)
         │
         ▼
┌──────────────────┐
│ Presentation     │  POST /api/v1/analyze
│ (Router)         │  Validate request, extract auth
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Application      │  AnalysisService.analyze()
│ (Service)        │  Orchestrate pipeline steps
└────────┬─────────┘
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
┌──────────────────┐                   ┌──────────────────┐
│ Input Processing │                   │ AI Pipeline       │
│                  │                   │                   │
│ • URL Scraping   │                   │ 1. Language Detect│
│ • OCR Extraction │──────────────────▶│ 2. Translation    │
│ • Text Cleaning  │  cleaned text     │ 3. Fake News Det. │
└──────────────────┘                   │ 4. Sentiment Anal.│
                                       │ 5. Summarization  │
                                       │ 6. Explainability │
                                       └────────┬─────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │ Result Assembly   │
                                       │                   │
                                       │ • Aggregate       │
                                       │ • Format response │
                                       │ • Store in DB     │
                                       │ • Return to user  │
                                       └──────────────────┘
```

### 6.2 Analysis Pipeline Sequence

```
┌──────┐  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│Input │─▶│Language │─▶│Translate │─▶│FakeNews  │─▶│Sentiment │─▶│Summarize │
│Parse │  │Detect  │  │(if needed)│  │Classify  │  │Analyze   │  │          │
└──────┘  └────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
                                         │               │
                                         ▼               ▼
                                    ┌──────────┐   ┌──────────┐
                                    │XAI       │   │XAI       │
                                    │Explain   │   │Explain   │
                                    └──────────┘   └──────────┘
```

**Pipeline execution is sequential** within a single request. Each step produces a typed output that feeds the next step. The orchestrator (`AnalysisService`) manages the pipeline graph and handles partial failures gracefully.

### 6.3 Authentication Flow

```
┌────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client │────▶│ /auth/   │────▶│ Auth     │────▶│ Database │
│        │     │ login    │     │ Service  │     │ (users)  │
│        │◀────│          │◀────│          │◀────│          │
│        │ JWT │          │token│          │user │          │
└────────┘     └──────────┘     └──────────┘     └──────────┘

Subsequent Requests:
┌────────┐     ┌──────────┐     ┌──────────┐
│ Client │────▶│ Auth     │────▶│ Protected│
│        │     │ Middleware│     │ Route    │
│ Bearer │     │ (JWT     │     │          │
│ Token  │     │  verify) │     │          │
└────────┘     └──────────┘     └──────────┘
```

---

## 7. Infrastructure Architecture

### 7.1 Development Environment

```
┌──────────────────────────────────────────────────┐
│                  Developer Machine                │
│                                                   │
│  ┌───────────┐  ┌───────────┐  ┌──────────────┐ │
│  │ Frontend  │  │ Backend   │  │ PostgreSQL   │ │
│  │ Vite Dev  │  │ Uvicorn   │  │ (Docker)     │ │
│  │ :5173     │  │ :8000     │  │ :5432        │ │
│  └───────────┘  └───────────┘  └──────────────┘ │
│                                                   │
│  ┌───────────┐  ┌───────────────────────────────┐ │
│  │ Redis     │  │ HuggingFace Models            │ │
│  │ (Docker)  │  │ (cached in ~/.cache/hf/)      │ │
│  │ :6379     │  │                               │ │
│  └───────────┘  └───────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

### 7.2 Production Environment

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Provider (Render / Railway)          │
│                                                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐   │
│  │ Static CDN  │   │ API Server  │   │ Managed Postgres │   │
│  │ (Frontend)  │   │ (FastAPI)   │   │                  │   │
│  └─────────────┘   └──────┬──────┘   └─────────────────┘   │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ Redis       │                           │
│                    │ (Managed)   │                           │
│                    └─────────────┘                           │
│                                                              │
│  External:                                                   │
│  ┌──────────────────────┐                                   │
│  │ HuggingFace Inference│                                   │
│  │ API (free tier)      │                                   │
│  └──────────────────────┘                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. API Architecture

### 8.1 REST API Design

All endpoints follow a consistent structure:

```
Base URL:  /api/v1

Versioning: URL-based (/api/v1/, /api/v2/)
Format:     JSON (application/json)
Auth:       Bearer token (JWT) in Authorization header
```

### 8.2 Endpoint Namespace Map

| Namespace | Module | Description |
|---|---|---|
| `/api/v1/auth/*` | auth | Registration, login, token refresh, profile |
| `/api/v1/analyze` | analysis | Submit text/URL/image for analysis |
| `/api/v1/history/*` | history | Retrieve past analyses |
| `/api/v1/analytics/*` | analytics | Dashboard data and trend queries |
| `/api/v1/admin/*` | admin | User management, system health |
| `/api/v1/health` | core | Health check and readiness probe |

### 8.3 Standard Response Envelope

Every API response follows a consistent envelope:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO-8601",
    "version": "1.0.0"
  }
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable message",
    "details": [ ]
  },
  "meta": { }
}
```

---

## 9. Cross-Cutting Concerns

### 9.1 Middleware Stack

```
Request
  │
  ▼
┌──────────────────┐
│ CORS Middleware   │  ← Allow frontend origin
├──────────────────┤
│ Request ID       │  ← Generate unique request ID
├──────────────────┤
│ Logging          │  ← Structured request/response logging
├──────────────────┤
│ Rate Limiter     │  ← Per-user and per-IP throttling
├──────────────────┤
│ Auth Middleware   │  ← JWT validation (optional per route)
├──────────────────┤
│ Error Handler    │  ← Global exception → standard error response
├──────────────────┤
│ Route Handler    │  ← Actual endpoint logic
└──────────────────┘
```

### 9.2 Error Handling Strategy

| Layer | Strategy |
|---|---|
| **Domain** | Raise domain-specific exceptions (e.g., `AnalysisNotFoundError`) |
| **Application** | Catch domain exceptions, wrap in application errors |
| **Presentation** | Global exception handler maps all errors to HTTP status codes |
| **AI Pipeline** | Errors in individual pipelines produce partial results, never crash the request |

### 9.3 Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|---|---|---|---|
| JWT blocklist | Redis | Token expiry | On logout |
| Model inference results | Redis | 1 hour | On model update |
| User session data | Redis | 30 minutes | On logout / expiry |
| Static model metadata | In-memory | App lifetime | On restart |
| HuggingFace models | Filesystem | Indefinite | Manual update |

### 9.4 Logging & Observability

```
┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
│ Application  │────▶│ Structured Logger│────▶│ stdout / file │
│ (any layer)  │     │ (JSON format)    │     │ (collected by │
└──────────────┘     └──────────────────┘     │  platform)    │
                                               └───────────────┘

Log Fields:
  - timestamp (ISO-8601)
  - level (DEBUG | INFO | WARNING | ERROR | CRITICAL)
  - request_id
  - module
  - message
  - extra (context-specific data)
```

---

## 10. Security Architecture

> *Detailed in `15_SECURITY_PLAN.md`*

### 10.1 Security Layers

```
┌─────────────────────────────────────────┐
│           Transport Security             │
│           (HTTPS / TLS)                  │
├─────────────────────────────────────────┤
│           Rate Limiting                  │
│           (per-IP, per-user)             │
├─────────────────────────────────────────┤
│           Authentication                 │
│           (JWT + Bcrypt)                 │
├─────────────────────────────────────────┤
│           Authorization                  │
│           (Role-based: user / admin)     │
├─────────────────────────────────────────┤
│           Input Validation               │
│           (Pydantic schemas)             │
├─────────────────────────────────────────┤
│           Output Sanitization            │
│           (No raw tracebacks in prod)    │
└─────────────────────────────────────────┘
```

### 10.2 Authentication Design

- **Method:** JWT (JSON Web Tokens) with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)
- **Password Storage:** Bcrypt with salt rounds ≥ 12
- **Token Storage:** Access token in memory (frontend), refresh token in httpOnly cookie
- **Optional:** OAuth 2.0 via Google (future phase)

---

## 11. Scalability Considerations

While v1.0 is a modular monolith, the architecture supports future scaling:

| Concern | Current (v1.0) | Future Path |
|---|---|---|
| **Compute** | Single process, CPU inference | Separate AI worker process, GPU inference |
| **Database** | Single PostgreSQL instance | Read replicas, connection pooling |
| **Cache** | Single Redis instance | Redis Cluster |
| **AI Models** | In-process loading | Dedicated model serving (TorchServe, Triton) |
| **Frontend** | CDN-served static build | Edge deployment (Vercel/Cloudflare) |
| **API** | Single FastAPI instance | Multiple instances behind load balancer |
| **Module Extraction** | In-process modules | Independent services with message bus |

### 11.1 Module Extraction Path

When a module needs to become an independent service:

```
Step 1: Module already has clean interfaces → No code change needed
Step 2: Replace in-process calls with HTTP/gRPC client
Step 3: Deploy module as separate service
Step 4: Add service discovery and circuit breakers
```

---

## 12. Technology Boundaries

> *Detailed in `02_TECH_STACK.md`*

| Boundary | Technology |
|---|---|
| Frontend Framework | React 18+ with Vite |
| Backend Framework | FastAPI (Python 3.11+) |
| ORM | SQLAlchemy 2.0 (async) |
| Database | PostgreSQL 15+ |
| Cache | Redis 7+ |
| ML Runtime | HuggingFace Transformers + PyTorch |
| Auth | python-jose (JWT) + passlib (bcrypt) |
| API Documentation | Auto-generated OpenAPI (Swagger) |
| Containerization | Docker + Docker Compose |

---

## 13. Architecture Decision Records (Preview)

> *Full log in `10_TECHNICAL_DECISIONS.md`*

| ADR # | Decision | Status |
|---|---|---|
| ADR-001 | Modular Monolith over Microservices | ✅ Accepted |
| ADR-002 | FastAPI over Django/Flask | ✅ Accepted |
| ADR-003 | PostgreSQL over MongoDB | ✅ Accepted |
| ADR-004 | Feature-based frontend structure | ✅ Accepted |
| ADR-005 | HuggingFace Inference API as GPU fallback | ✅ Accepted |
| ADR-006 | XLM-RoBERTa as Backbone NLP Model | ✅ Accepted |
| ADR-007 | React + Vite + TypeScript Frontend | ✅ Accepted |
| ADR-008 | PostgreSQL + SQLAlchemy Async + Alembic | ✅ Accepted |
| ADR-009 | Redis for Caching & Rate Limiting | ✅ Accepted |
| ADR-010 | Docker Multi-Stage Builds | ✅ Accepted |
| ADR-011 | Server-Side Aggregations for Analytics Dashboard | ✅ Accepted |
| ADR-012 | Zero-Knowledge Fallback Engine with Deterministic Pseudo-Probabilities | ✅ Accepted |
| ADR-013 | Stateful Refresh-Token Rotation with Asymmetric HttpOnly Security | ✅ Accepted |
| ADR-014 | Multi-Layer SSRF Defense for URL Scraping | ✅ Accepted |
| ADR-015 | In-Memory Bounded Streams & Dynamic Discovery for OCR Processing | ✅ Accepted |
| ADR-016 | Single-Pass Gradient × Input Token Attribution for Explainability | ✅ Accepted |
| ADR-017 | Deterministic Language Detection & Presentation-Layer Translation | ✅ Accepted |

---

## 14. Diagram Legend

| Symbol | Meaning |
|---|---|
| `──▶` | Data flow / dependency direction |
| `◀──` | Response / return path |
| `───` | Bidirectional communication |
| `┌─┐` | Component / service boundary |
| `▲` | Dependency points inward (Clean Architecture) |

---

*Document Version: 1.1.0*
*Created: 2026-08-05*
*Last Updated: 2026-09-11*
*Author: Vikas (Principal Architect)*
*Status: Active*
*Depends On: 00_PROJECT_VISION.md (Active)*
