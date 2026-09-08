# 10 — Technical Decisions

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-10                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## Decision Log

---

### ADR-001: Modular Monolith over Microservices

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | How should the backend be structured — as microservices or a monolith? |
| **Options Considered** | 1. Microservices with API Gateway 2. Modular Monolith 3. Traditional MVC Monolith |
| **Chosen Solution**    | Modular Monolith                                                    |
| **Reason**             | Solo developer; microservices add operational overhead (service discovery, inter-service communication, distributed tracing) without proportional benefit at current scale. A modular monolith with well-defined module boundaries provides clean architecture while remaining simple to develop, test, and deploy. |
| **Impact**             | Simpler deployment (single container); faster development; clear extraction path to microservices if needed. |
| **Future Considerations** | If any module becomes a bottleneck (e.g., AI inference), it can be extracted into a standalone service by replacing in-process calls with HTTP/gRPC. |

---

### ADR-002: FastAPI over Django / Flask

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which Python web framework should we use?                           |
| **Options Considered** | 1. Django + DRF 2. Flask + extensions 3. FastAPI                    |
| **Chosen Solution**    | FastAPI                                                             |
| **Reason**             | Native async support (critical for concurrent AI inference); automatic OpenAPI documentation; Pydantic-first validation; lighter than Django; type hints throughout. Flask lacks async support and requires many extensions. Django is too opinionated and heavy for an AI-focused API. |
| **Impact**             | Async endpoints, auto-generated API docs at `/docs`, Pydantic V2 validation. |
| **Future Considerations** | Django's admin panel is lost; we build a custom lightweight admin. |

---

### ADR-003: React + Vite over Next.js

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which frontend framework and build tool should we use?              |
| **Options Considered** | 1. Next.js 2. React + Vite 3. Vue + Vite 4. Svelte                 |
| **Chosen Solution**    | React + Vite                                                        |
| **Reason**             | No SSR requirement (SPA is sufficient); Vite is faster than Next.js dev server; simpler deployment (static files to any CDN); React has the largest ecosystem and best employability. Vue/Svelte have smaller ecosystems. |
| **Impact**             | Static SPA deployment; no server-side rendering; API calls from client. |
| **Future Considerations** | If SEO becomes important (public-facing pages), revisit Next.js. |

---

### ADR-004: PostgreSQL over MongoDB

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which database should we use for primary data storage?              |
| **Options Considered** | 1. PostgreSQL 2. MongoDB 3. MySQL 4. SQLite                        |
| **Chosen Solution**    | PostgreSQL                                                          |
| **Reason**             | Structured data with clear relationships (users → analyses → feedback); ACID compliance for transactional consistency; JSONB support for semi-structured AI output; excellent free-tier availability (Supabase, Render); superior aggregation queries for analytics. |
| **Impact**             | Relational schema; SQLAlchemy ORM; Alembic migrations; JSONB for flexible fields. |
| **Future Considerations** | MongoDB could be used for a future logging/analytics data store if needed. |

---

### ADR-005: Clean Architecture over Simple MVC

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | How should backend code be organized internally?                    |
| **Options Considered** | 1. Simple MVC (routes → controllers → models) 2. Clean Architecture (layered) 3. Hexagonal Architecture |
| **Chosen Solution**    | Clean Architecture                                                  |
| **Reason**             | Enforces dependency inversion; business logic independent of frameworks; highly testable (mock outer layers); aligns with SOLID principles. MVC tends to create fat controllers. Hexagonal is similar but Clean Architecture is more widely understood. |
| **Impact**             | Four layers: Domain → Application → Interface Adapters → Frameworks. Dependencies point inward only. |
| **Future Considerations** | Slightly more files and boilerplate than MVC, but pays off as codebase grows. |

---

### ADR-006: XLM-RoBERTa as Primary Model

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which pre-trained transformer should be the base for fine-tuning?   |
| **Options Considered** | 1. XLM-RoBERTa Base 2. mBERT 3. IndicBERT (Hindi-focused) 4. Language-specific models |
| **Chosen Solution**    | XLM-RoBERTa Base (primary), mBERT (fallback)                       |
| **Reason**             | XLM-R trained on 2.5 TB (vs Wikipedia for mBERT); superior cross-lingual transfer; better zero-shot performance on low-resource languages. mBERT kept as fallback for faster inference. Language-specific models would require managing many models. |
| **Impact**             | Single model handles all 5 languages; ~278M parameters; needs ONNX optimization for CPU. |
| **Future Considerations** | If a language-specific model significantly outperforms XLM-R, add it as an alternative in the Model Registry. |

---

### ADR-007: LIME over SHAP as Primary XAI

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which explainability method should be the default?                  |
| **Options Considered** | 1. LIME 2. SHAP 3. Integrated Gradients 4. Attention only          |
| **Chosen Solution**    | LIME (primary) + Attention visualization (secondary)                |
| **Reason**             | LIME is model-agnostic, intuitive for non-technical users, and has a mature text implementation. SHAP is more theoretically grounded but significantly slower. Attention alone is not a reliable explanation. Integrated Gradients requires model internals access. |
| **Impact**             | ~2s additional latency per explanation; 500 perturbations default.  |
| **Future Considerations** | Add SHAP as an opt-in alternative for researcher personas. |

---

### ADR-008: Zustand over Redux for State Management

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Which client-side state management solution should we use?          |
| **Options Considered** | 1. Redux Toolkit 2. Zustand 3. Jotai 4. React Context only         |
| **Chosen Solution**    | Zustand (client state) + TanStack Query (server state)              |
| **Reason**             | Zustand has minimal boilerplate, no providers/wrappers, tiny bundle (1KB), and is sufficient for our client state needs (auth, theme, UI). Server state is handled by TanStack Query (caching, deduplication, background refetch). Redux is overkill for this project. React Context alone causes unnecessary re-renders. |
| **Impact**             | Simple stores; no Redux devtools dependency; clean separation of client vs server state. |
| **Future Considerations** | None — Zustand scales well for this project size. |

---

### ADR-009: UUID v4 over Auto-Increment IDs

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | What primary key strategy should we use?                            |
| **Options Considered** | 1. Auto-increment integers 2. UUID v4 3. ULID 4. Snowflake IDs     |
| **Chosen Solution**    | UUID v4                                                             |
| **Reason**             | No sequential exposure (security); globally unique without coordination; portable across databases; generated client-side or server-side. ULID is sortable but less widely supported. Auto-increment exposes record count. |
| **Impact**             | Slightly larger index size; use `gen_random_uuid()` in PostgreSQL.  |
| **Future Considerations** | If UUID index performance becomes an issue, consider UUID v7 (time-ordered). |

---

### ADR-010: In-Process AI over Separate Model Server

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-08-13                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Should AI models be served in-process or via a separate model server (TorchServe, Triton)? |
| **Options Considered** | 1. In-process (loaded in FastAPI) 2. TorchServe 3. Triton Inference Server 4. Hugging Face Inference API |
| **Chosen Solution**    | In-process (models loaded directly in FastAPI workers)              |
| **Reason**             | Avoids inter-service latency and operational complexity; sufficient for demo-scale traffic; ONNX Runtime provides good CPU performance. Model servers add deployment complexity not justified for a solo-developer FYP. |
| **Impact**             | Models consume memory in the FastAPI process; ~2–4 GB RAM needed.   |
| **Future Considerations** | If scaling beyond a single server, extract into a dedicated model-serving container with gRPC. |

---

### ADR-011: 120s Frontend API Timeout for CPU Inference

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-09-08                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | XLM-RoBERTa CPU inference takes ~65–68 seconds per request. The default 30s Axios timeout causes premature request failures in the browser. |
| **Options Considered** | 1. Increase timeout to 120s 2. Add async job queue (submit → poll) 3. Optimize with ONNX Runtime first |
| **Chosen Solution**    | Increase Axios timeout to 120,000ms                                 |
| **Reason**             | Simplest solution for the current dev phase. Async job queue adds significant backend complexity. ONNX optimization is planned for Phase 5 but not yet implemented. 120s provides sufficient margin (~2× the actual inference time). |
| **Impact**             | Frontend waits up to 2 minutes; loading UI shows "This may take up to two minutes on CPU inference" to set user expectations. |
| **Future Considerations** | When ONNX optimization reduces inference to <5s, reduce timeout back to 30s. If concurrent users cause timeouts, implement async job queue pattern. |

---

### ADR-012: Dual Dev Origins (localhost & 127.0.0.1) and API Base URL Alignment

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | 2026-09-08                                                          |
| **Status**             | Accepted                                                            |
| **Problem**            | Browser considers `http://localhost` and `http://127.0.0.1` distinct cross-origin domains. With `withCredentials: true`, FastAPI's CORSMiddleware rejected requests from `http://127.0.0.1:5173` because only `localhost` was configured in allowed origins, resulting in Axios network errors displaying as "Unable to reach the server". |
| **Options Considered** | 1. Force users to only use `http://localhost:5173` 2. Add both `localhost` and `127.0.0.1` variants (ports 3000 and 5173) to backend default CORS origins and align frontend default `API_BASE_URL` to `http://127.0.0.1:8000` |
| **Chosen Solution**    | Option 2: Support both `localhost` and `127.0.0.1` on ports 3000 and 5173 in backend settings, and standardize frontend local API base URL to `http://127.0.0.1:8000`. |
| **Reason**             | Eliminates origin mismatch friction regardless of whether the developer navigates to `127.0.0.1` or `localhost`, while adhering to strict origin matching required by credentialed CORS requests. |
| **Impact**             | Frontend seamlessly connects to FastAPI whether accessed via `http://127.0.0.1:5173` or `http://localhost:5173`. No runtime errors or CORS preflight failures. |
| **Future Considerations** | Production deployment uses reverse proxy (nginx) serving both frontend and backend under the same origin, eliminating CORS entirely in production. |

---

## Template for New Decisions

```markdown
### ADR-NNN: Title

| Field                  | Detail                                                              |
| ---------------------- | ------------------------------------------------------------------- |
| **Date**               | YYYY-MM-DD                                                          |
| **Status**             | Proposed / Accepted / Deprecated / Superseded                       |
| **Problem**            | What problem are we solving?                                        |
| **Options Considered** | 1. Option A  2. Option B  3. Option C                               |
| **Chosen Solution**    | Option X                                                            |
| **Reason**             | Why this option was selected.                                       |
| **Impact**             | What changes as a result.                                           |
| **Future Considerations** | What to watch out for.                                          |
```

---

## Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*Every major technical decision is logged here with full context. This document enables any developer (or AI assistant) to understand why a choice was made without re-debating it.*
