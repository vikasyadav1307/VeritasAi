# 14 — Testing Strategy

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-14                                                             |
| **Version**        | 1.1.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-09-11                                                         |

---

## 1. Testing Pyramid & Verification Status

```
            ╱╲
           ╱  ╲
          ╱ E2E ╲           Phase 6 Target (Playwright)
         ╱  Tests ╲
        ╱──────────╲
       ╱ Integration ╲      133 passing tests (pytest + httpx)
      ╱    Tests      ╲
     ╱──────────────────╲
    ╱    Unit / Vitest    ╲  17 passing tests (vitest + RTL)
   ╱________________________╲
```

| Level        | Tools                       | Implemented Count | Pass Rate | Run Command                                         |
| ------------ | --------------------------- | ----------------- | --------- | --------------------------------------------------- |
| Backend Int. | pytest + httpx.AsyncClient  | 133 tests         | 100%      | `pytest backend/tests/integration`                  |
| Frontend UI  | Vitest + RTL + jsdom        | 17 tests          | 100%      | `cd frontend && npx vitest run`                     |
| E2E          | Playwright                  | Planned (Phase 6) | —         | `npx playwright test`                               |
| Performance  | Locust / k6                 | Planned (Phase 7) | —         | Pre-release benchmark                               |
| Security     | OWASP ZAP, bandit           | Continuous        | Passed    | SSRF defenses, bounded streams, magic byte checks   |
| AI/ML        | Custom evaluation scripts   | F1 targets        | —         | Model changes                                       |

---

## 2. Backend Testing

### 2.1 Unit Tests

**Scope:** Individual functions, service methods, utility functions — isolated from database, Redis, and AI models.

**Framework:** `pytest` + `pytest-asyncio`

**Conventions:**
- File: `test_<module>.py` in a `tests/` directory mirroring source structure
- Function: `test_<what>_<condition>_<expected>()` or `test_<behavior>()`
- Fixtures: Use `conftest.py` for shared fixtures
- Mocking: `unittest.mock.patch` or `pytest-mock` for external dependencies

**What to test:**
- Service layer business logic
- Pydantic schema validation (valid + invalid inputs)
- Utility functions (text cleaning, hashing, formatting)
- Custom exception behavior
- Configuration loading

**What NOT to unit test:**
- Database queries (integration test)
- FastAPI route wiring (integration test)
- Third-party library internals

### 2.2 Integration Tests

**Scope:** API endpoints with real database (test DB), real validation, mocked AI models.

**Framework:** `pytest` + `httpx.AsyncClient` (FastAPI's TestClient)

**Setup:**
- Use a separate test PostgreSQL database (or SQLite for speed)
- Run migrations before test suite
- Rollback transactions after each test (or truncate tables)
- Mock AI model inference with deterministic outputs

**What to test:**
- Full request → response cycle for every endpoint
- Auth flow: register → login → access → refresh → logout
- Validation errors return correct status codes and error bodies
- RBAC: admin-only routes reject non-admin users
- Pagination, filtering, sorting on list endpoints
- File upload (image → OCR) with test images
- Cache behavior (first call misses, second hits)

### 2.3 Test Database Strategy

| Environment | Database                   | Setup                                   |
| ----------- | -------------------------- | --------------------------------------- |
| Local tests | PostgreSQL (Docker)        | `docker-compose --profile test up -d`   |
| CI tests    | SQLite (in-memory)         | Faster; no Docker needed in CI          |
| AI tests    | PostgreSQL (Docker)        | Need real schema for model metadata     |

### 2.4 Test Data Management

- **Factories:** Use `factory-boy` to generate test users, analyses, etc.
- **Fixtures:** Shared via `conftest.py`; scoped appropriately (`function`, `session`)
- **No external network calls:** All HTTP requests mocked; no real URL scraping in tests

---

## 3. Frontend Testing

### 3.1 Component Tests

**Framework:** `vitest` + `@testing-library/react`

**What to test:**
- Component renders correctly with given props
- User interactions trigger expected callbacks
- Form validation displays error messages
- Loading and error states render correctly
- Conditional rendering based on auth state

**Conventions:**
- Co-located: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Test user behavior, not implementation details
- Use `screen.getByRole()`, `screen.getByText()` — not CSS selectors
- Mock API calls with MSW (Mock Service Worker) or vitest mocks

### 3.2 Hook Tests

**Framework:** `vitest` + `@testing-library/react` (`renderHook`)

**What to test:**
- Custom hooks return expected values
- State transitions work correctly
- Side effects fire as expected

### 3.3 Frontend Integration Tests

**What to test:**
- Full page renders with mocked API data
- Navigation between routes
- Auth-protected route redirects to login
- Form submission → API call → result display

---

## 4. End-to-End Tests

**Framework:** Playwright

**Browser targets:** Chromium (primary), Firefox (secondary)

### 4.1 Critical User Flows

| Flow # | Description                                        | Priority   |
| ------ | -------------------------------------------------- | ---------- |
| E2E-01 | Register → Login → Analyze text → View result     | 🔴 Critical |
| E2E-02 | Login → Analyze URL → View XAI explanation         | 🟠 High    |
| E2E-03 | Login → View history → Filter by language          | 🟠 High    |
| E2E-04 | Login → Export PDF → Verify download               | 🟡 Medium  |
| E2E-05 | Admin login → View users → Deactivate user         | 🟡 Medium  |
| E2E-06 | Login → Upload image → OCR → Analyze              | 🟡 Medium  |
| E2E-07 | Login → View dashboard → Verify charts render      | 🟢 Low     |

### 4.2 E2E Configuration

- Run against a local Docker Compose environment
- Seed test data before suite
- Clean up after each test (dedicated test user)
- Screenshots on failure (saved as CI artifacts)
- Video recording for debugging (optional)

---

## 5. AI/ML Testing

### 5.1 Model Evaluation Tests

| Test                              | What It Verifies                                  | When to Run        |
| --------------------------------- | ------------------------------------------------- | ------------------- |
| F1-score per language             | Model meets accuracy targets                      | After training      |
| Accuracy regression test          | New model ≥ previous model - 1%                   | Before model deploy |
| ONNX parity test                  | ONNX output matches PyTorch within tolerance (ε=0.01) | After ONNX export  |
| Inference latency benchmark       | p95 latency within targets                        | After optimization  |
| Adversarial input test            | Model handles edge cases (empty, gibberish, injection) | Every release   |

### 5.2 Edge Cases to Test

| Input                          | Expected Behavior                              |
| ------------------------------ | ---------------------------------------------- |
| Empty string                   | Validation error (min 20 chars)                |
| Single word repeated 1000x     | Returns result (not crash); low confidence     |
| Mixed language text             | Detects dominant language; processes correctly  |
| SQL injection in text           | Treated as regular text; no DB impact          |
| XSS payload in text             | Treated as regular text; sanitized in output   |
| Very long text (50,000 chars)   | Truncated to 512 tokens; processes correctly   |
| Non-UTF8 characters             | Handled gracefully (NFKC normalization)        |
| Image with no text              | OCR returns low confidence; error returned     |
| URL returning 404               | Processing error with clear message            |
| URL pointing to non-article     | Processing error or low-quality extraction      |

---

## 6. Performance Testing

### 6.1 Load Testing

**Tool:** Locust or k6

**Scenarios:**

| Scenario                   | Virtual Users | Duration | Target                      |
| -------------------------- | ------------- | -------- | --------------------------- |
| Smoke test                 | 1             | 1 min    | All endpoints respond       |
| Average load               | 10            | 5 min    | p95 ≤ 3s (text analysis)   |
| Stress test                | 50            | 5 min    | Identify breaking point     |

### 6.2 Benchmarks to Track

| Metric                           | Target          |
| -------------------------------- | --------------- |
| Text analysis (p95)              | ≤ 3s            |
| URL analysis (p95)               | ≤ 8s            |
| Image analysis (p95)             | ≤ 5s            |
| Auth endpoints (p95)             | ≤ 500ms         |
| History list (p95)               | ≤ 500ms         |
| Health check (p95)               | ≤ 100ms         |

---

## 7. Coverage Requirements

| Component      | Target  | Tool                    | Enforcement               |
| -------------- | ------- | ----------------------- | ------------------------- |
| Backend        | ≥ 80%   | `pytest-cov`            | CI fails below threshold  |
| Frontend       | ≥ 70%   | `vitest --coverage`     | CI fails below threshold  |
| E2E            | Critical flows | Playwright         | Manual review             |
| AI models      | Per-language F1 | Custom scripts     | Training pipeline step    |

---

## 8. Test Organization

```
backend/
├── tests/
│   ├── conftest.py                     # Shared async fixtures, test DB session, test client
│   └── integration/
│       ├── test_health.py              # Health check endpoints
│       ├── test_auth.py                # Register, login, refresh, profile, logout (16 tests)
│       ├── test_analysis.py            # Text analysis pipeline, DB persistence, edge cases
│       ├── test_analysis_validation.py # Schema validation, min length, content checks
│       ├── test_url_analysis.py        # URL scraping, multi-layer SSRF defenses (15+ tests)
│       ├── test_image_analysis.py      # Multipart upload, OCR stream bounds, magic bytes (15+ tests)
│       ├── test_explainability.py      # Gradient × Input attribution, token weights (15+ tests)
│       └── test_translation.py         # MyMemory provider, caching, language detection (15+ tests)

frontend/
├── src/
│   ├── app/
│   │   └── App.test.tsx                # App shell, routing, smoke render
│   └── features/
│       └── analyze/
│           └── pages/
│               ├── AnalyzePage.test.tsx      # Tabbed inputs (Text/URL/Image), form validation
│               ├── Explainability.test.tsx   # Word attribution highlights, token inspection
│               └── Translation.test.tsx      # Language selector, target translation, cache hit

e2e/                                    # Target Phase 6
├── tests/
│   ├── auth.spec.ts
│   ├── analysis.spec.ts
│   ├── history.spec.ts
│   └── admin.spec.ts
├── fixtures/
│   └── test-data.ts
└── playwright.config.ts
```

---

## 9. CI Test Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Lint    │────▶│  Type    │────▶│  Unit    │────▶│  Build   │
│          │     │  Check   │     │  Tests   │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                       │
                                       ▼ (main only)
                                 ┌──────────┐
                                 │  E2E     │
                                 │  Tests   │
                                 └──────────┘
```

---

## 10. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This document defines the testing strategy for VeritasAI. All new features must include tests that meet the coverage targets before merge.*
