# 02 — Technology Stack

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-02                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |
| **Parent**         | `01_ARCHITECTURE.md`                                               |

---

## 1. Stack Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     VeritasAI Tech Stack                     │
├──────────────┬──────────────┬───────────────┬───────────────┤
│   Frontend   │   Backend    │   AI / ML     │   DevOps      │
├──────────────┼──────────────┼───────────────┼───────────────┤
│ React 18     │ FastAPI      │ PyTorch       │ Docker        │
│ TypeScript   │ Python 3.11+ │ Transformers  │ Docker Compose│
│ Vite 5       │ SQLAlchemy 2 │ XLM-RoBERTa   │ GitHub Actions│
│ Zustand      │ Alembic      │ mBERT         │ Nginx         │
│ TanStack Qry │ Pydantic V2  │ LIME / SHAP   │ Prometheus    │
│ React Router │ PostgreSQL   │ ONNX Runtime  │ Grafana (opt) │
│ Recharts     │ Redis        │ Tesseract OCR │               │
│ Axios        │ Celery (opt) │ langdetect    │               │
│ React Hook   │ structlog    │ BeautifulSoup │               │
│  Form + Zod  │ pytest       │ newspaper3k   │               │
└──────────────┴──────────────┴───────────────┴───────────────┘
```

---

## 2. Frontend Stack

### 2.1 Core

| Technology        | Version  | Purpose                                      | Rationale                                                        |
| ----------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **React**         | 18.x     | UI library                                   | Component model; massive ecosystem; industry standard            |
| **TypeScript**    | 5.x      | Type-safe JavaScript                         | Catches bugs at compile time; better DX with autocompletion      |
| **Vite**          | 5.x      | Build tool / dev server                      | Sub-second HMR; native ESM; faster than Webpack/CRA              |

### 2.2 State & Data

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **TanStack Query**      | 5.x     | Server state management          | Caching, deduplication, background refetch out of the box      |
| **Zustand**             | 4.x     | Client state management          | Minimal boilerplate; no providers; tiny bundle                 |
| **React Hook Form**     | 7.x     | Form handling                    | Uncontrolled inputs (performant); integrates with Zod          |
| **Zod**                 | 3.x     | Schema validation                | TypeScript-first; shared validation logic with backend DTOs    |

### 2.3 Routing & Navigation

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **React Router**        | 6.x     | Client-side routing              | De facto standard; nested routes; lazy loading support          |

### 2.4 UI & Styling

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **Vanilla CSS**         | —       | Styling                          | Maximum control; CSS custom properties for theming; no bloat   |
| **CSS Modules**         | —       | Scoped styles                    | Prevents class name collisions; co-located with components     |
| **Framer Motion**       | 11.x    | Animations                       | Declarative; spring physics; gesture support                   |
| **Lucide React**        | Latest  | Icon library                     | Tree-shakeable; consistent design; open source                 |

### 2.5 Data Visualization

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **Recharts**            | 2.x     | Charts and graphs                | React-native; composable; good for dashboards                  |

### 2.6 HTTP & Communication

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **Axios**               | 1.x     | HTTP client                      | Interceptors for JWT refresh; request/response transforms      |

### 2.7 Testing (Frontend)

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **Vitest**              | 1.x     | Unit / integration tests         | Vite-native; Jest-compatible API; fast                         |
| **React Testing Library** | 14.x  | Component testing                | Tests user behavior, not implementation details                |
| **Playwright**          | 1.x     | E2E testing                      | Cross-browser; auto-wait; reliable                             |

### 2.8 Developer Experience

| Technology              | Version | Purpose                          | Rationale                                                      |
| ----------------------- | ------- | -------------------------------- | -------------------------------------------------------------- |
| **ESLint**              | 9.x     | Linting                          | Catch errors and enforce conventions                           |
| **Prettier**            | 3.x     | Code formatting                  | Consistent style; no debates                                   |

---

## 3. Backend Stack

### 3.1 Core

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Python**        | 3.11+     | Backend language                            | AI/ML ecosystem (PyTorch, HF); async support; readability        |
| **FastAPI**       | 0.110+    | Web framework                               | Async-native; auto OpenAPI docs; Pydantic integration; type hints|
| **Uvicorn**       | 0.29+     | ASGI server                                 | Production-grade; HTTP/1.1 + WebSocket; works with Gunicorn      |
| **Gunicorn**      | 22.x      | Process manager                             | Multi-worker; graceful restarts; production deployment           |

### 3.2 Database & ORM

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **PostgreSQL**    | 16.x      | Primary database                            | ACID; JSON support; full-text search; free-tier on Supabase/Render|
| **SQLAlchemy**    | 2.0+      | ORM / query builder                         | Async support; mature; supports raw SQL when needed              |
| **Alembic**       | 1.13+     | Database migrations                         | Version-controlled schema changes; auto-generate from models     |

### 3.3 Caching & Task Queue

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Redis**         | 7.x       | Cache + session store                       | Sub-ms latency; TTL support; pub/sub for future features         |
| **Celery**        | 5.x       | Async task queue (optional)                 | Background processing for heavy AI tasks; can start with FastAPI BackgroundTasks |

### 3.4 Validation & Serialization

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Pydantic**      | 2.x       | Data validation / serialization             | Built into FastAPI; V2 is 5-50x faster; strict mode available    |

### 3.5 Authentication

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **python-jose**   | 3.x       | JWT encoding / decoding                     | Supports RS256 and HS256; well-maintained                        |
| **passlib[bcrypt]** | 1.7+    | Password hashing                            | bcrypt with automatic salt; industry standard                    |

### 3.6 Logging & Monitoring

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **structlog**     | 24.x      | Structured logging                          | JSON output; context binding; integrates with stdlib logging     |
| **prometheus-fastapi-instrumentator** | 6.x | Metrics (optional)        | Auto-instrument all endpoints; Prometheus-compatible             |

### 3.7 Testing (Backend)

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **pytest**        | 8.x       | Test framework                              | De facto Python standard; fixtures; plugins                      |
| **pytest-asyncio** | 0.23+    | Async test support                          | Required for testing async FastAPI endpoints                     |
| **pytest-cov**    | 5.x       | Coverage reporting                          | Enforce coverage thresholds in CI                                |
| **httpx**         | 0.27+     | Async HTTP test client                      | FastAPI's recommended test client; async support                 |
| **factory-boy**   | 3.x       | Test data factories                         | Declarative fixtures; reduces test setup boilerplate             |

### 3.8 Developer Experience

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Ruff**          | 0.4+      | Linter + formatter                          | 10-100x faster than flake8 + black; single tool                  |
| **mypy**          | 1.10+     | Static type checking                        | Catches type errors before runtime                               |
| **pre-commit**    | 3.x       | Git hook manager                            | Enforce linting/formatting before every commit                   |

---

## 4. AI / ML Stack

### 4.1 Core Frameworks

| Technology                | Version   | Purpose                                     | Rationale                                                        |
| ------------------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **PyTorch**               | 2.x       | Deep learning framework                     | Dynamic graphs; dominant in NLP research; HuggingFace built on it|
| **Hugging Face Transformers** | 4.40+  | Pre-trained model hub                       | State-of-the-art models; unified API; model sharing              |
| **Hugging Face Datasets** | 2.x       | Dataset loading                             | Streaming; memory-mapped; standardized format                    |
| **ONNX Runtime**          | 1.18+     | Optimized inference                         | 2-4x faster than native PyTorch on CPU; quantization support     |

### 4.2 Models

| Model                        | Task                          | Languages           | Parameters   | Inference Target |
| ---------------------------- | ----------------------------- | -------------------- | ------------ | ---------------- |
| **xlm-roberta-base**         | Fake news classification      | 100 languages        | 278M         | ONNX (quantized) |
| **bert-base-multilingual-cased** | Fake news classification (fallback) | 104 languages | 178M       | ONNX (quantized) |
| **xlm-roberta-base**         | Sentiment analysis            | 100 languages        | 278M         | ONNX (quantized) |
| **Helsinki-NLP/OPUS-MT**     | Translation                   | Per language pair    | ~77M each    | PyTorch / CT2    |
| **facebook/mbart-large-50**  | Summarization                 | 50 languages         | 611M         | ONNX (quantized) |

### 4.3 Explainability (XAI)

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **LIME**          | 0.2+      | Local feature importance                    | Model-agnostic; text-specific support; interpretable output      |
| **SHAP**          | 0.45+     | Shapley-value explanations                  | Theoretically grounded; transformer-compatible                   |
| **BertViz** (opt) | 1.x       | Attention visualization                     | Visual attention heatmaps for transformer layers                 |

### 4.4 NLP Utilities

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **langdetect**    | 1.0+      | Language detection                          | Lightweight; supports 55 languages; no model download needed     |
| **spacy**         | 3.7+      | Tokenization / NER (optional)               | Industrial-grade NLP; useful for keyword extraction              |
| **nltk**          | 3.8+      | Text preprocessing fallback                 | Stopwords, stemming; well-documented                             |

### 4.5 Input Processing

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Tesseract OCR** | 5.x       | Image-to-text                               | Open source; multilingual; well-maintained                       |
| **pytesseract**   | 0.3+      | Python wrapper for Tesseract                | Clean API over Tesseract CLI                                     |
| **Pillow**        | 10.x      | Image preprocessing                         | Resize, grayscale, threshold before OCR                          |
| **BeautifulSoup** | 4.x       | HTML parsing (URL scraping)                 | Robust; handles malformed HTML                                   |
| **newspaper3k**   | 0.2+      | Article extraction from URLs                | Auto-extracts title, body, images, publish date                  |
| **httpx**         | 0.27+     | HTTP client for scraping                    | Async; timeout control; follows redirects                        |

### 4.6 Report Generation

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **ReportLab**     | 4.x       | PDF generation                              | Programmatic PDF creation; tables, charts, text                  |
| **Jinja2**        | 3.x       | HTML template engine (for PDF)              | Templated reports; reusable layouts                              |

---

## 5. Infrastructure & DevOps Stack

### 5.1 Containerization

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Docker**        | 25.x      | Containerization                            | Reproducible environments; isolation; standard                   |
| **Docker Compose** | 2.x      | Multi-container orchestration               | Single-command local deployment; matches production topology     |

### 5.2 Reverse Proxy

| Technology        | Version   | Purpose                                     | Rationale                                                        |
| ----------------- | --------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Nginx**         | 1.25+     | Reverse proxy / static files / SSL          | Battle-tested; low resource usage; rich configuration            |

### 5.3 CI/CD

| Technology          | Purpose                                     | Rationale                                                        |
| ------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **GitHub Actions**  | CI/CD pipeline                              | Free for public repos; native GitHub integration; YAML config    |

### 5.4 Cloud Hosting (Free Tier)

| Service           | Component         | Free Tier Limits                               |
| ----------------- | ----------------- | ---------------------------------------------- |
| **Render**        | Backend + Worker  | 750 hours/month; auto-sleep after 15 min idle  |
| **Vercel**        | Frontend (SPA)    | Unlimited static deploys; 100 GB bandwidth     |
| **Supabase**      | PostgreSQL        | 500 MB storage; 2 GB bandwidth; unlimited API  |
| **Upstash**       | Redis             | 10K commands/day; 256 MB                       |
| **Hugging Face Spaces** | Model hosting (fallback) | Free CPU inference; 2 vCPU, 16 GB RAM |

### 5.5 Monitoring (Optional / Stretch)

| Technology        | Purpose                                     | Rationale                                                        |
| ----------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **Prometheus**    | Metrics collection                          | Pull-based; time-series DB; industry standard                    |
| **Grafana**       | Dashboards                                  | Rich visualizations; free tier; alerting                         |
| **Sentry**        | Error tracking                              | Real-time error reporting; stack traces; free tier (5K events)   |

---

## 6. Version Pinning Strategy

### 6.1 Philosophy

- **Pin major + minor versions** in requirements/lockfiles (e.g., `fastapi>=0.110,<0.112`).
- **Lock exact versions** in CI via `pip freeze` / `npm ci` for reproducibility.
- **Update monthly** — review changelogs; run full test suite before merging updates.

### 6.2 Dependency Files

| File                        | Scope          | Tool                |
| --------------------------- | -------------- | ------------------- |
| `backend/pyproject.toml`    | Backend deps   | pip / uv            |
| `backend/requirements.lock` | Locked versions| pip freeze / uv lock|
| `frontend/package.json`     | Frontend deps  | npm                 |
| `frontend/package-lock.json`| Locked versions| npm ci              |

---

## 7. Compatibility Matrix

| Component    | Minimum Python | Minimum Node | OS Support             |
| ------------ | -------------- | ------------ | ---------------------- |
| Backend      | 3.11           | —            | Linux, macOS, Windows  |
| Frontend     | —              | 18.x         | Any (browser-based)    |
| Docker       | —              | —            | Linux, macOS, Windows  |
| Tesseract    | —              | —            | Linux, macOS, Windows  |

---

## 8. Technology Alternatives Considered

| Category         | Chosen             | Alternatives Considered           | Why Not                                                          |
| ---------------- | ------------------ | --------------------------------- | ---------------------------------------------------------------- |
| Backend Framework | FastAPI            | Django, Flask, Express.js         | Django too heavy for AI workload; Flask lacks async; Express would split language stack |
| Frontend Framework | React + Vite      | Next.js, Vue, Svelte             | Next.js SSR unnecessary; Vue/Svelte smaller ecosystems; React maximizes employability |
| Database         | PostgreSQL          | MongoDB, MySQL, SQLite            | MongoDB poor for relational analytics; MySQL fewer features; SQLite not production-grade |
| ORM              | SQLAlchemy 2.0      | Tortoise ORM, Django ORM, Prisma  | SQLAlchemy most mature; async support; raw SQL escape hatch      |
| State Mgmt       | Zustand             | Redux, Jotai, MobX               | Redux too much boilerplate; Zustand minimal + sufficient         |
| AI Framework     | PyTorch + HF        | TensorFlow, JAX                   | HF Transformers built on PyTorch; dominant in NLP research       |
| CSS              | Vanilla CSS + Modules | Tailwind, Styled Components, Sass | Full control; no utility-class learning curve; smaller bundle   |
| Task Queue       | Celery / BGTasks    | RQ, Dramatiq, Arq                 | Celery most mature; BGTasks sufficient for v1; easy to swap      |
| Linter (Python)  | Ruff                | flake8 + black + isort            | Ruff replaces all three; 100x faster; single config              |

---

## 9. License Compliance

All selected technologies use permissive open-source licenses compatible with academic and commercial use:

| Technology        | License       | Commercial Use | Modification | Distribution |
| ----------------- | ------------- | -------------- | ------------ | ------------ |
| React             | MIT           | ✅              | ✅            | ✅            |
| FastAPI           | MIT           | ✅              | ✅            | ✅            |
| PyTorch           | BSD-3         | ✅              | ✅            | ✅            |
| Transformers      | Apache 2.0    | ✅              | ✅            | ✅            |
| PostgreSQL        | PostgreSQL    | ✅              | ✅            | ✅            |
| Redis             | BSD-3         | ✅              | ✅            | ✅            |
| Tesseract         | Apache 2.0    | ✅              | ✅            | ✅            |
| XLM-RoBERTa       | MIT           | ✅              | ✅            | ✅            |
| mBERT             | Apache 2.0    | ✅              | ✅            | ✅            |

---

## 10. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `01_ARCHITECTURE.md`         | Architecture these technologies implement           |
| `04_DATABASE_DESIGN.md`      | PostgreSQL + SQLAlchemy schema details              |
| `06_AI_PIPELINE.md`          | How AI models are trained, served, and optimized    |
| `08_CODING_GUIDELINES.md`    | Conventions for using each technology               |
| `13_DEPLOYMENT_PLAN.md`      | How these services are containerized and deployed   |

---

## 11. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document is the single source of truth for all technology choices. Any substitution must be logged as a Technical Decision in `10_TECHNICAL_DECISIONS.md`.*
