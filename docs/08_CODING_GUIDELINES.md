# 08 — Coding Guidelines

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-08                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Folder Naming

| Rule                              | Example                               |
| --------------------------------- | ------------------------------------- |
| All lowercase                     | `input_processing/`, `fake_news/`     |
| Snake_case for multi-word          | `input_processing/`, `model_registry/`|
| Feature-based grouping (frontend) | `features/analyze/`, `features/auth/` |
| Module-based grouping (backend)   | `modules/detection/`, `modules/auth/` |
| No abbreviations unless universal | `auth/` ✅, `inp_proc/` ❌             |

---

## 2. File Naming

### 2.1 Python (Backend)

| Type               | Convention                | Example                           |
| ------------------ | ------------------------- | --------------------------------- |
| Modules            | `snake_case.py`           | `fake_news_detector.py`          |
| Classes            | Inside `snake_case.py`    | `class FakeNewsDetector:`         |
| Tests              | `test_<module>.py`        | `test_fake_news_detector.py`      |
| Config             | `config.py`               | `config.py`                       |
| Constants          | `constants.py`            | `constants.py`                    |
| Schemas            | `schemas.py`              | `schemas.py`                      |
| Models (DB)        | `models.py`               | `models.py`                       |
| Router             | `router.py`               | `router.py`                       |
| Service            | `service.py`              | `service.py`                      |
| Repository         | `repository.py`           | `repository.py`                   |
| Exceptions         | `exceptions.py`           | `exceptions.py`                   |

### 2.2 TypeScript (Frontend)

| Type               | Convention                  | Example                           |
| ------------------ | --------------------------- | --------------------------------- |
| Components         | `PascalCase.tsx`            | `ConfidenceGauge.tsx`             |
| Hooks              | `use<Name>.ts`              | `useAnalysis.ts`                  |
| Services           | `<name>.service.ts`         | `analysis.service.ts`             |
| Types              | `<name>.types.ts`           | `analysis.types.ts`               |
| Utils              | `<name>.util.ts`            | `format.util.ts`                  |
| Styles (CSS Module)| `<ComponentName>.module.css` | `ConfidenceGauge.module.css`     |
| Tests              | `<name>.test.tsx`           | `ConfidenceGauge.test.tsx`        |
| Constants          | `constants.ts`              | `constants.ts`                    |
| Store              | `<name>.store.ts`           | `auth.store.ts`                   |

---

## 3. Git Conventions

### 3.1 Branch Naming

```
<type>/<short-description>

Types:
  feature/    — new feature
  fix/        — bug fix
  refactor/   — code refactor (no feature change)
  docs/       — documentation only
  test/       — adding or updating tests
  chore/      — tooling, CI, dependencies
  hotfix/     — urgent production fix

Examples:
  feature/text-analysis-endpoint
  fix/jwt-refresh-race-condition
  refactor/model-registry-singleton
  docs/api-specification-update
  test/auth-flow-e2e
  chore/upgrade-fastapi-0.111
```

### 3.2 Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`, `ci`, `build`

**Scopes:** `auth`, `analysis`, `detection`, `sentiment`, `xai`, `ocr`, `history`, `analytics`, `admin`, `export`, `ui`, `api`, `db`, `ci`, `docker`

**Rules:**
- Subject: imperative mood, lowercase, no period, max 72 chars
- Body: explain *what* and *why*, not *how*
- Footer: reference issues (`Closes #123`)

**Examples:**
```
feat(analysis): add text analysis endpoint with caching

Implement POST /api/v1/analyze/text with Redis caching.
Cache key is SHA-256 hash of cleaned input text.
TTL set to 24 hours.

Closes #15

---

fix(auth): prevent refresh token reuse after logout

Revoked tokens were not being checked during refresh.
Added token_hash lookup in refresh_tokens table.

Closes #42

---

perf(detection): convert fake news model to ONNX INT8

Reduces inference time from 2.0s to 0.6s on CPU.
Accuracy regression: -0.3% F1 (within acceptable range).
```

### 3.3 Pull Request Format

```markdown
## Summary
Brief description of what this PR does.

## Changes
- [ ] List of specific changes
- [ ] Another change

## Type
- [ ] Feature
- [ ] Bug Fix
- [ ] Refactor
- [ ] Documentation
- [ ] Test
- [ ] Chore

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing done

## Screenshots (if UI change)
Before | After

## Checklist
- [ ] Code follows project coding guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console.log / print statements left
- [ ] No hardcoded secrets
```

---

## 4. Documentation Format

### 4.1 Python Docstrings (Google Style)

```python
async def predict(self, text: str, language: str) -> DetectionResult:
    """Predict the credibility of the given text.

    Runs the fake news detection model on preprocessed text and
    returns a credibility label with confidence score.

    Args:
        text: Cleaned input text (min 20 characters).
        language: ISO 639-1 language code.

    Returns:
        DetectionResult with label, score, and confidence.

    Raises:
        UnsupportedLanguageError: If language is not supported.
        ModelInferenceError: If the model fails during prediction.
    """
```

### 4.2 TypeScript JSDoc

```typescript
/**
 * Submit text for analysis and return detection + sentiment results.
 *
 * @param text - The raw text to analyze (20-50,000 chars)
 * @param options - Analysis options (explanation, translation, summary)
 * @returns Promise resolving to the full AnalysisResult
 * @throws {ApiError} If the request fails or is rate-limited
 */
```

### 4.3 Inline Comments

- Explain **why**, not **what**.
- Use `TODO:` for planned improvements.
- Use `FIXME:` for known issues.
- Use `HACK:` for intentional workarounds (with justification).
- Never commit `console.log` or `print()` debug statements.

---

## 5. API Conventions

| Convention                    | Rule                                           | Example                         |
| ----------------------------- | ---------------------------------------------- | ------------------------------- |
| URL structure                 | `/api/v1/<resource>`                           | `/api/v1/analyze`               |
| Resource naming               | Plural nouns, lowercase                        | `/users`, `/history`            |
| Action naming                 | Verb only when not CRUD                        | `/analyze`, `/translate`        |
| Nested resources              | Max 1 level deep                               | `/history/{id}/export`          |
| Query params (filters)        | `snake_case`                                   | `?input_type=url`               |
| Query params (pagination)     | `page`, `per_page`                             | `?page=2&per_page=20`           |
| Query params (sorting)        | `sort` with `-` prefix for desc                | `?sort=-created_at`             |
| Request body                  | `camelCase` (JSON standard)                    | `{ "sourceUrl": "..." }`        |
| Response body                 | `snake_case` (Python convention)               | `{ "source_url": "..." }`       |
| Timestamps                    | ISO 8601 with timezone                         | `2026-08-13T12:00:00Z`          |
| IDs                           | UUID v4 strings                                | `"550e8400-e29b-41d4-..."`      |

> **Note on casing**: Request bodies use `camelCase` for JavaScript convenience. Response bodies use `snake_case` for Python convention. Pydantic aliases handle the conversion.

---

## 6. Database Conventions

| Convention              | Rule                                     | Example                         |
| ----------------------- | ---------------------------------------- | ------------------------------- |
| Table names             | Plural, `snake_case`                     | `analysis_results`              |
| Column names            | Singular, `snake_case`                   | `credibility_score`             |
| Primary keys            | `id` (UUID)                              | `id UUID PRIMARY KEY`           |
| Foreign keys            | `<table_singular>_id`                    | `user_id`                       |
| Boolean columns         | `is_<adjective>` or `has_<noun>`         | `is_active`, `is_cached`        |
| Timestamp columns       | `<action>_at`                            | `created_at`, `deleted_at`      |
| Enum types              | `<name>_enum`                            | `credibility_enum`              |
| Indexes                 | `ix_<table>_<column>`                    | `ix_users_email`                |
| Unique constraints      | `uq_<table>_<column>`                   | `uq_users_email`               |
| Migrations              | `NNN_<description>.py`                   | `001_create_users_table.py`     |

---

## 7. React Conventions

| Convention                     | Rule                                                     |
| ------------------------------ | -------------------------------------------------------- |
| Components                     | Functional components only; no class components          |
| Component files                | One component per file; file name matches component name |
| Props                          | Destructured in function signature                       |
| State management               | `useState` for local; Zustand for global; TanStack Query for server |
| Side effects                   | `useEffect` with proper cleanup; custom hooks preferred  |
| Event handlers                 | `handle<Event>` naming: `handleSubmit`, `handleChange`   |
| Conditional rendering          | Early returns for guard clauses; ternary for inline      |
| Lists                          | Always use stable `key` prop (never array index unless static) |
| Memoization                    | `useMemo` / `useCallback` only when measurably needed    |
| Error boundaries               | Wrap feature-level route components                      |
| Imports order                  | 1) React, 2) Third-party, 3) Internal, 4) Styles        |

---

## 8. FastAPI Conventions

| Convention                     | Rule                                                     |
| ------------------------------ | -------------------------------------------------------- |
| Router files                   | One router per module; mounted in `main.py`              |
| Dependency injection           | Use `Depends()` for services, DB sessions, auth          |
| Request validation             | Pydantic models for all request bodies                   |
| Response models                | Pydantic models with `response_model` on every endpoint  |
| Status codes                   | Explicit `status_code=` on all routes                    |
| Background tasks               | Use `BackgroundTasks` for non-blocking operations        |
| Error handling                 | Raise custom exceptions; never catch-all silently        |
| Path parameters                | Type-annotated: `analysis_id: UUID`                      |
| Async                          | All endpoint functions are `async def`                   |
| Docstrings                     | Every endpoint has a docstring (appears in OpenAPI docs) |

---

## 9. Python Conventions

| Convention                     | Rule                                                     |
| ------------------------------ | -------------------------------------------------------- |
| Python version                 | 3.11+ features allowed                                   |
| Type hints                     | Required on all function signatures and class attributes |
| Formatter                      | Ruff (replaces Black)                                    |
| Linter                         | Ruff (replaces Flake8 + isort)                           |
| Line length                    | 88 characters (Ruff default)                             |
| Imports                        | Absolute imports only; no relative imports               |
| String formatting              | f-strings preferred                                      |
| Collections                    | Use `list`, `dict`, `tuple` lowercase (PEP 585)         |
| Optional                       | Use `X | None` syntax (PEP 604)                          |
| Dataclasses                    | Use Pydantic `BaseModel` instead of dataclasses          |
| Constants                      | `UPPER_SNAKE_CASE`                                       |
| Private methods                | Single underscore prefix: `_helper_method()`             |

---

## 10. Error Handling

### 10.1 Backend

```python
# Custom exception hierarchy (conceptual)
class VeritasError(Exception): ...           # Base
class ValidationError(VeritasError): ...     # 400
class AuthenticationError(VeritasError): ... # 401
class ForbiddenError(VeritasError): ...      # 403
class NotFoundError(VeritasError): ...       # 404
class ProcessingError(VeritasError): ...     # 422
class RateLimitError(VeritasError): ...      # 429
class InternalError(VeritasError): ...       # 500
```

- Every custom exception includes an `error_code` string.
- Global exception handler maps exceptions to HTTP responses.
- Never expose stack traces to clients.
- Always log the full exception server-side.

### 10.2 Frontend

- API errors caught by Axios interceptor.
- Display user-friendly messages via Toast.
- 401 errors trigger silent token refresh.
- Network errors show retry option.
- React Error Boundaries catch render errors.

---

## 11. Security Rules

| Rule                                    | Enforcement                              |
| --------------------------------------- | ---------------------------------------- |
| No secrets in code                      | `.env` files; `pre-commit` check         |
| No `eval()` or `exec()`                | Ruff rule                                |
| No `dangerouslySetInnerHTML`            | ESLint rule (exceptions require comment) |
| No `*` imports                          | Ruff rule                                |
| Parameterized queries only              | SQLAlchemy ORM enforced                  |
| Input validation on every endpoint      | Pydantic models required                 |
| Passwords never logged                  | structlog filter                         |
| JWT in memory only (not localStorage)   | Code review                              |
| Refresh token in HttpOnly cookie only   | Code review                              |

---

## 12. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*All code contributions must follow these guidelines. Violations will be caught by pre-commit hooks and CI checks.*
