# 01 — System Architecture

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-01                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |
| **Parent**         | `00_PROJECT_VISION.md`                                             |

---

## 1. Architecture Overview

VeritasAI follows a **Modular Monolith** architecture — a single deployable unit with clearly bounded internal modules that can be extracted into independent services if needed. This approach balances the simplicity required for a solo-developer FYP with the structural discipline of a production system.

### 1.1 Architecture Style

| Property                | Choice                              | Rationale                                                        |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------- |
| **Pattern**             | Modular Monolith                    | Solo developer; avoids operational overhead of microservices     |
| **API Style**           | REST (JSON over HTTP)               | Universal client support; tooling maturity                       |
| **Frontend Pattern**    | Single Page Application (SPA)       | Rich interactivity; decoupled from backend                       |
| **Backend Pattern**     | Clean Architecture (Layered)        | Testable, maintainable, dependency-inversion compliant           |
| **AI Serving**          | In-process (same backend)           | Avoids inter-service latency; can extract later via model server |
| **Communication**       | Synchronous (REST) + async tasks    | Background tasks for heavy inference; REST for CRUD              |
| **Deployment**          | Docker Compose (single host)        | Matches budget and demo constraints                              |

### 1.2 Microservice Readiness

Although deployed as a monolith, every module communicates through **internal service interfaces** (Python protocols / abstract base classes). This means any module can be extracted into a standalone service by:

1. Replacing the in-process call with an HTTP/gRPC client.
2. Deploying the module behind its own API gateway route.
3. Adding a message queue for async communication.

No module directly imports another module's internal implementation.

---

## 2. High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
│                                                                          │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────────────────┐    │
│   │  React SPA   │   │  REST Client │   │  Browser Extension (v2)  │    │
│   │  (Vite)      │   │  (Postman/   │   │  (Stretch Goal)          │    │
│   │              │   │   cURL)      │   │                          │    │
│   └──────┬───────┘   └──────┬───────┘   └────────────┬─────────────┘    │
│          │                  │                         │                   │
└──────────┼──────────────────┼─────────────────────────┼──────────────────┘
           │                  │                         │
           ▼                  ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                              │
│                                                                          │
│   ┌─────────────────────────────────────────────────────────────────┐    │
│   │                    Nginx / Traefik Reverse Proxy                │    │
│   │         (SSL termination, rate limiting, static files)          │    │
│   └─────────────────────────────┬───────────────────────────────────┘    │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                                │
│                         (FastAPI Backend)                                 │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                      API Router Layer                            │   │
│   │  /api/v1/auth  /api/v1/analyze  /api/v1/history  /api/v1/admin  │   │
│   └──────────────────────────┬───────────────────────────────────────┘   │
│                              │                                           │
│   ┌──────────────────────────▼───────────────────────────────────────┐   │
│   │                     Service Layer                                │   │
│   │                                                                  │   │
│   │  ┌────────────┐ ┌─────────────┐ ┌────────────┐ ┌─────────────┐ │   │
│   │  │ Auth       │ │ Analysis    │ │ History    │ │ Admin       │ │   │
│   │  │ Service    │ │ Orchestrator│ │ Service    │ │ Service     │ │   │
│   │  └────────────┘ └──────┬──────┘ └────────────┘ └─────────────┘ │   │
│   │                        │                                         │   │
│   └────────────────────────┼─────────────────────────────────────────┘   │
│                            │                                             │
│   ┌────────────────────────▼─────────────────────────────────────────┐   │
│   │                     AI Engine Layer                               │   │
│   │                                                                  │   │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │   │
│   │  │ Fake News  │ │ Sentiment  │ │ Language   │ │ Explainer    │ │   │
│   │  │ Detector   │ │ Analyzer   │ │ Services   │ │ (XAI)        │ │   │
│   │  │            │ │            │ │ • Detect   │ │ • LIME       │ │   │
│   │  │ • mBERT    │ │ • XLM-R    │ │ • Translate│ │ • SHAP       │ │   │
│   │  │ • XLM-R    │ │            │ │ • Summarize│ │ • Attention  │ │   │
│   │  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │   │
│   │                                                                  │   │
│   │  ┌────────────┐ ┌────────────┐                                  │   │
│   │  │ Input      │ │ Model      │                                  │   │
│   │  │ Processors │ │ Registry   │                                  │   │
│   │  │ • OCR      │ │ • Loading  │                                  │   │
│   │  │ • Scraper  │ │ • Caching  │                                  │   │
│   │  │ • Cleaner  │ │ • Versioning│                                 │   │
│   │  └────────────┘ └────────────┘                                  │   │
│   │                                                                  │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │                   Infrastructure Layer                           │   │
│   │                                                                  │   │
│   │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │   │
│   │  │ Database   │ │ Cache      │ │ Task Queue │ │ File Storage │ │   │
│   │  │ Repository │ │ (Redis)    │ │ (Celery/   │ │ (Local/S3)   │ │   │
│   │  │ (SQLAlchemy│ │            │ │  Background│ │              │ │   │
│   │  │  + Alembic)│ │            │ │  Tasks)    │ │              │ │   │
│   │  └────────────┘ └────────────┘ └────────────┘ └──────────────┘ │   │
│   │                                                                  │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│                                                                          │
│   ┌──────────────┐   ┌──────────────┐   ┌───────────────────────────┐   │
│   │  PostgreSQL  │   │  Redis       │   │  File System / Object     │   │
│   │  (Primary DB)│   │  (Cache +    │   │  Storage                  │   │
│   │              │   │   Sessions)  │   │  (Uploads, Model Weights) │   │
│   └──────────────┘   └──────────────┘   └───────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Architectural Layers (Clean Architecture)

The backend follows Clean Architecture with four concentric layers. Dependencies point **inward only** — outer layers depend on inner layers, never the reverse.

```
┌─────────────────────────────────────────────┐
│           Frameworks & Drivers              │  ← FastAPI, SQLAlchemy, Redis
│  ┌─────────────────────────────────────┐    │
│  │      Interface Adapters             │    │  ← Routers, Repositories, Presenters
│  │  ┌─────────────────────────────┐    │    │
│  │  │    Application Layer        │    │    │  ← Use Cases, Orchestrators
│  │  │  ┌─────────────────────┐    │    │    │
│  │  │  │   Domain Layer      │    │    │    │  ← Entities, Value Objects, Interfaces
│  │  │  │   (Core)            │    │    │    │
│  │  │  └─────────────────────┘    │    │    │
│  │  └─────────────────────────────┘    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 3.1 Layer Responsibilities

| Layer                    | Responsibility                                                                 | Contains                                                     |
| ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| **Domain (Core)**        | Business rules and entities; zero external dependencies                        | Entities, Value Objects, Domain Services, Repository Interfaces (ABCs) |
| **Application**          | Use cases / orchestration; coordinates domain objects and external services     | Use Cases, DTOs, Application Services, Port interfaces       |
| **Interface Adapters**   | Converts between external formats and internal representations                 | API Routers, Request/Response models, Repository implementations, Serializers |
| **Frameworks & Drivers** | External tools and libraries                                                   | FastAPI app, SQLAlchemy engine, Redis client, Celery worker  |

### 3.2 Dependency Rule

```
Domain  ←  Application  ←  Interface Adapters  ←  Frameworks & Drivers
  (inner)                                                (outer)

• Inner layers define INTERFACES (abstract base classes / protocols).
• Outer layers provide IMPLEMENTATIONS.
• Dependency Injection wires implementations to interfaces at startup.
```

---

## 4. Module Decomposition

The backend is decomposed into bounded modules. Each module owns its own routes, services, models, and schemas. Modules communicate only through defined service interfaces.

### 4.1 Module Map

```
backend/
├── modules/
│   ├── auth/              # Authentication & Authorization
│   ├── analysis/          # Core analysis orchestration
│   ├── detection/         # Fake news detection (AI)
│   ├── sentiment/         # Sentiment analysis (AI)
│   ├── language/          # Language detect, translate, summarize
│   ├── explainability/    # XAI (LIME, SHAP, attention)
│   ├── input_processing/  # OCR, URL scraping, text cleaning
│   ├── history/           # User analysis history
│   ├── analytics/         # Aggregated statistics & dashboards
│   ├── admin/             # Admin panel operations
│   └── export/            # PDF / JSON report generation
├── core/                  # Shared domain: config, exceptions, base models
├── infrastructure/        # DB, cache, storage, task queue adapters
└── main.py                # FastAPI app factory & DI wiring
```

### 4.2 Module Dependency Matrix

Arrows indicate "depends on." A module may only depend on modules to its left or on `core/`.

```
core ← infrastructure ← input_processing ← detection
                                          ← sentiment
                                          ← language
                       ← explainability   ← (detection, sentiment)
                       ← analysis         ← (all AI modules)
                       ← auth
                       ← history          ← (analysis)
                       ← analytics        ← (history)
                       ← export           ← (analysis, history)
                       ← admin            ← (auth, analytics)
```

### 4.3 Module Interface Contract

Every module exposes a **Service Protocol** (Python `Protocol` class) and a **concrete implementation**. Other modules depend only on the protocol.

```python
# Example: detection module interface (conceptual, not implementation code)
class FakeNewsDetectorProtocol(Protocol):
    async def predict(self, text: str, language: str) -> DetectionResult: ...
    async def predict_batch(self, texts: list[str], language: str) -> list[DetectionResult]: ...
    def supported_languages(self) -> list[str]: ...
```

---

## 5. Frontend Architecture

### 5.1 SPA Structure

The frontend is a React SPA built with Vite. It follows a feature-based folder structure with shared UI components.

```
frontend/
├── src/
│   ├── app/                  # App shell, providers, router
│   ├── features/
│   │   ├── auth/             # Login, Register, Forgot Password
│   │   ├── analyze/          # Main analysis page
│   │   ├── history/          # Analysis history
│   │   ├── dashboard/        # Analytics dashboard
│   │   └── admin/            # Admin panel
│   ├── components/           # Shared UI components
│   │   ├── ui/               # Buttons, Cards, Modals, Inputs
│   │   ├── layout/           # Header, Sidebar, Footer
│   │   └── charts/           # Chart wrappers
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API client layer (axios/fetch)
│   ├── store/                # State management (Zustand)
│   ├── utils/                # Helpers, formatters, validators
│   ├── types/                # TypeScript type definitions
│   └── assets/               # Static assets (icons, images)
├── public/
├── index.html
├── vite.config.ts
└── package.json
```

### 5.2 State Management Strategy

| State Type         | Solution                  | Examples                                     |
| ------------------ | ------------------------- | -------------------------------------------- |
| **Server State**   | TanStack Query (React Query) | API responses, analysis results, history  |
| **Client State**   | Zustand                   | Theme toggle, sidebar state, form drafts     |
| **Form State**     | React Hook Form + Zod     | Analysis input form, login/register forms    |
| **URL State**       | React Router v6           | Current page, query parameters, filters      |

### 5.3 Frontend-Backend Communication

```
React SPA  ──HTTP/REST──▶  FastAPI Backend
                            │
                            ├── JSON request/response
                            ├── JWT in Authorization header
                            ├── Multipart for file uploads
                            └── SSE for long-running analysis progress (optional)
```

---

## 6. Data Flow — Analysis Request

The core user journey: submitting content for analysis.

```
┌────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────────┐
│  User  │────▶│  React   │────▶│  FastAPI      │────▶│  Analysis     │
│        │     │  SPA     │     │  Router       │     │  Orchestrator │
└────────┘     └──────────┘     └──────────────┘     └───────┬───────┘
                                                             │
                    ┌────────────────────────────────────────┤
                    │                                        │
                    ▼                                        ▼
            ┌──────────────┐                      ┌──────────────────┐
            │  Input       │                      │  Cache Check     │
            │  Processor   │                      │  (Redis)         │
            │  • OCR       │                      │  Hit? Return     │
            │  • Scrape    │                      │  cached result   │
            │  • Clean     │                      └──────────────────┘
            └──────┬───────┘                               │ Miss
                   │                                       │
                   ▼                                       ▼
            ┌──────────────┐                      ┌──────────────────┐
            │  Language    │                      │  Parallel AI     │
            │  Detection   │                      │  Pipeline        │
            └──────┬───────┘                      │                  │
                   │                              │  ┌─────────────┐ │
                   │  detected_lang               │  │ Fake News   │ │
                   ▼                              │  │ Detector    │ │
            ┌──────────────┐                      │  └─────────────┘ │
            │  Translation │ (if needed)          │  ┌─────────────┐ │
            │  to English  │                      │  │ Sentiment   │ │
            └──────┬───────┘                      │  │ Analyzer    │ │
                   │                              │  └─────────────┘ │
                   │  cleaned_text                │  ┌─────────────┐ │
                   └─────────────────────────────▶│  │ Explainer   │ │
                                                  │  │ (XAI)       │ │
                                                  │  └─────────────┘ │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Result          │
                                                  │  Aggregator      │
                                                  │  • Compose       │
                                                  │  • Cache         │
                                                  │  • Persist       │
                                                  └────────┬─────────┘
                                                           │
                                                           ▼
                                                  ┌──────────────────┐
                                                  │  Response to     │
                                                  │  Client          │
                                                  │  (JSON)          │
                                                  └──────────────────┘
```

### 6.1 Data Flow Steps

| Step | Action                          | Module               | Notes                                           |
| ---- | ------------------------------- | -------------------- | ------------------------------------------------ |
| 1    | User submits text / URL / image | Frontend             | Form validation via Zod                          |
| 2    | POST `/api/v1/analyze`          | API Router           | JWT-authenticated                                |
| 3    | Input processing                | `input_processing`   | OCR → text, URL → scrape → text, text → clean   |
| 4    | Language detection              | `language`           | Auto-detect language; store original + detected  |
| 5    | Cache check                     | `infrastructure`     | Hash input text; check Redis                     |
| 6    | Parallel AI inference           | `detection`, `sentiment`, `explainability` | Run concurrently via `asyncio.gather` |
| 7    | Result aggregation              | `analysis`           | Compose unified `AnalysisResult`                 |
| 8    | Cache write + DB persist        | `infrastructure`, `history` | Store for history and caching            |
| 9    | Return response                 | API Router           | JSON with scores, explanation, metadata          |

---

## 7. Authentication & Authorization Architecture

### 7.1 Auth Flow

```
┌────────┐                    ┌──────────┐                    ┌──────────┐
│ Client │───── POST ────────▶│ /auth/   │───── Validate ───▶│ User DB  │
│        │      /login        │ login    │      credentials   │          │
│        │◀──── JWT ──────────│          │◀──── User row ─────│          │
│        │      (access +     └──────────┘                    └──────────┘
│        │       refresh)
│        │
│        │───── GET ─────────▶ /api/v1/* ───── Verify JWT ──▶ Proceed
│        │      Authorization:                    │
│        │      Bearer <token>                    ▼
│        │                                   Token expired?
│        │                                   401 Unauthorized
│        │
│        │───── POST ────────▶ /auth/refresh ──▶ Issue new access token
│        │      refresh_token
└────────┘
```

### 7.2 Role-Based Access Control (RBAC)

| Role       | Permissions                                                              |
| ---------- | ------------------------------------------------------------------------ |
| `guest`    | Public health-check endpoint only                                        |
| `user`     | Analyze, view own history, export own results, manage own profile        |
| `admin`    | All user permissions + view all users, view system analytics, manage users |

### 7.3 Token Strategy

| Token          | Lifetime | Storage             | Purpose                    |
| -------------- | -------- | ------------------- | -------------------------- |
| Access Token   | 15 min   | Memory (JS variable)| API authentication         |
| Refresh Token  | 7 days   | HttpOnly cookie     | Silent access token renewal|

---

## 8. Caching Strategy

### 8.1 Cache Layers

| Layer              | Tool   | TTL        | What Is Cached                                      |
| ------------------ | ------ | ---------- | --------------------------------------------------- |
| **Result Cache**   | Redis  | 24 hours   | Full analysis results keyed by `hash(input_text)`   |
| **Model Cache**    | Memory | App lifetime | Loaded model objects (singleton per process)       |
| **Session Cache**  | Redis  | 7 days     | Refresh token blacklist                              |
| **HTTP Cache**     | Nginx  | Varies     | Static frontend assets (immutable hashing)           |

### 8.2 Cache Invalidation

- **Result cache**: Time-based expiry (TTL). No manual invalidation needed — analysis results are immutable for a given input.
- **Model cache**: Invalidated on application restart or model version bump.
- **Session cache**: Invalidated on logout (refresh token added to blacklist).

---

## 9. Error Handling Architecture

### 9.1 Error Response Format

All API errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ANALYSIS_FAILED",
    "message": "The AI model could not process the input text.",
    "details": {
      "reason": "Input text is too short (minimum 20 characters).",
      "input_length": 12
    },
    "request_id": "req_abc123",
    "timestamp": "2026-08-13T12:00:00Z"
  }
}
```

### 9.2 Error Categories

| HTTP Status | Error Code Prefix | Example                              |
| ----------- | ------------------ | ------------------------------------ |
| 400         | `VALIDATION_*`     | `VALIDATION_TEXT_TOO_SHORT`          |
| 401         | `AUTH_*`           | `AUTH_TOKEN_EXPIRED`                 |
| 403         | `FORBIDDEN_*`      | `FORBIDDEN_ADMIN_ONLY`              |
| 404         | `NOT_FOUND_*`      | `NOT_FOUND_ANALYSIS`               |
| 422         | `PROCESSING_*`     | `PROCESSING_OCR_FAILED`            |
| 429         | `RATE_LIMIT_*`     | `RATE_LIMIT_EXCEEDED`              |
| 500         | `INTERNAL_*`       | `INTERNAL_MODEL_LOAD_FAILED`       |

### 9.3 Global Exception Handler

FastAPI middleware catches all exceptions and maps them to the standard error format. Unhandled exceptions return a 500 with a generic message (details logged server-side only — never leaked to clients).

---

## 10. Observability

### 10.1 Logging

| Aspect          | Choice                                                               |
| --------------- | -------------------------------------------------------------------- |
| **Library**     | Python `structlog` (structured JSON logging)                         |
| **Format**      | JSON lines — machine-parseable, human-readable with `rich` in dev   |
| **Levels**      | DEBUG (dev), INFO (prod), WARNING, ERROR, CRITICAL                  |
| **Correlation** | Every request gets a `request_id` propagated through all log entries |

### 10.2 Monitoring & Health

| Endpoint              | Purpose                                                          |
| --------------------- | ---------------------------------------------------------------- |
| `GET /health`         | Shallow health check (API is running)                            |
| `GET /health/ready`   | Deep health check (DB connected, Redis reachable, models loaded) |
| `GET /metrics`        | Prometheus-compatible metrics (optional, stretch)                |

### 10.3 Key Metrics to Track

- Request count and latency (p50, p95, p99) per endpoint
- AI inference latency per model
- Cache hit/miss ratio
- Error rate by category
- Active users (daily / weekly)
- Analysis count by language

---

## 11. Security Architecture

> Full details in `15_SECURITY_PLAN.md`.

### 11.1 Security Layers

```
Client ──▶ HTTPS (TLS 1.3) ──▶ Nginx ──▶ Rate Limiter ──▶ CORS ──▶ JWT Auth ──▶ RBAC ──▶ Input Validation ──▶ Handler
```

### 11.2 Key Security Controls

| Control                    | Implementation                                       |
| -------------------------- | ---------------------------------------------------- |
| Transport encryption       | TLS 1.3 via Nginx / cloud provider                  |
| Authentication             | JWT (RS256 or HS256)                                 |
| Authorization              | RBAC middleware on protected routes                  |
| Input validation           | Pydantic models with strict constraints              |
| SQL injection prevention   | SQLAlchemy ORM (parameterized queries only)          |
| XSS prevention             | React's built-in escaping + CSP headers              |
| CSRF prevention            | SameSite cookies + CORS whitelist                    |
| Rate limiting              | Token bucket per user (Redis-backed)                 |
| Dependency scanning        | `pip-audit` + `npm audit` in CI                      |
| Secrets management         | Environment variables; never committed to git        |

---

## 12. Deployment Architecture

### 12.1 Container Topology (Docker Compose)

```
┌──────────────────────────────────────────────────────┐
│                  Docker Compose                       │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  nginx   │  │  backend │  │ frontend │           │
│  │  :80/443 │  │  :8000   │  │  (build) │           │
│  │  Proxy   │──│  FastAPI  │  │  Vite    │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                      │                               │
│  ┌──────────┐  ┌─────┴────┐  ┌──────────┐           │
│  │  redis   │  │  postgres │  │  worker  │           │
│  │  :6379   │  │  :5432    │  │  (Celery/│           │
│  │          │  │           │  │  BGTasks)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 12.2 Environment Matrix

| Environment  | Purpose                  | Database        | AI Models        | Deployment       |
| ------------ | ------------------------ | --------------- | ---------------- | ---------------- |
| **Local**    | Development              | SQLite / Postgres | CPU (dev weights) | `docker-compose up` |
| **CI**       | Automated testing        | SQLite (in-memory) | Mock / tiny model | GitHub Actions  |
| **Staging**  | Pre-production demo      | Postgres (free tier) | Quantized (CPU) | Render / Railway |
| **Production** | Final demo / evaluation | Postgres (free tier) | Quantized (CPU) | Render / Railway |

---

## 13. Cross-Cutting Concerns

| Concern             | Strategy                                                           |
| ------------------- | ------------------------------------------------------------------ |
| **Configuration**   | Pydantic `BaseSettings` loading from `.env`; 12-factor app         |
| **Dependency Injection** | Manual DI via app factory; `Depends()` in FastAPI              |
| **Serialization**   | Pydantic V2 models for all request/response schemas                |
| **Pagination**      | Cursor-based for large lists; offset-based for simple queries      |
| **Versioning**      | URL-prefix versioning (`/api/v1/`); additive changes only in v1   |
| **CORS**            | Whitelist frontend origin only; credentials allowed                |
| **Idempotency**     | Analysis requests are naturally idempotent (same input → same result) |
| **Graceful Shutdown**| Signal handlers to finish in-flight requests; model cleanup        |

---

## 14. Scalability Considerations

Although v1 targets a single-host deployment, the architecture supports horizontal scaling:

| Bottleneck          | Scaling Strategy                                                       |
| ------------------- | ---------------------------------------------------------------------- |
| AI inference         | Extract into a separate model-serving container; add replicas          |
| Database             | Read replicas; connection pooling (PgBouncer)                          |
| Cache                | Redis Cluster (not needed for v1)                                      |
| API                  | Stateless backend; add replicas behind load balancer                   |
| File storage         | Swap local filesystem for S3-compatible object storage                 |

---

## 15. Architecture Decision Records (Summary)

> Full ADRs in `10_TECHNICAL_DECISIONS.md`.

| ADR # | Decision                               | Rationale                                                      |
| ----- | --------------------------------------- | -------------------------------------------------------------- |
| ADR-1 | Modular Monolith over Microservices     | Solo dev; reduce operational complexity; extract later if needed|
| ADR-2 | FastAPI over Django                     | Async-native; lighter; better for AI workloads; auto OpenAPI   |
| ADR-3 | React + Vite over Next.js              | No SSR needed; faster dev server; simpler deployment           |
| ADR-4 | PostgreSQL over MongoDB                 | Structured data; relational queries for analytics; ACID        |
| ADR-5 | Clean Architecture over MVC            | Testability; dependency inversion; framework independence      |
| ADR-6 | In-process AI over separate model server | Simplicity for v1; gRPC extraction path preserved            |

---

## 16. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `00_PROJECT_VISION.md`       | Vision this architecture serves                     |
| `02_TECH_STACK.md`           | Specific technology choices                         |
| `04_DATABASE_DESIGN.md`      | Schema design for the data layer                    |
| `05_API_SPECIFICATION.md`    | Detailed endpoint contracts                         |
| `06_AI_PIPELINE.md`          | AI engine layer details                             |
| `13_DEPLOYMENT_PLAN.md`      | Deployment procedures and runbooks                  |
| `17_FOLDER_STRUCTURE.md`     | Detailed file/folder layout                         |

---

## 17. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document defines the structural blueprint of VeritasAI. All implementation decisions must align with the architecture described here.*
