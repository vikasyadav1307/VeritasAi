# 04 — Database Design

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-04                                                             |
| **Version**        | 1.1.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-09-11                                                         |
| **Parent**         | `01_ARCHITECTURE.md`                                               |
| **Database**       | PostgreSQL 16                                                      |
| **ORM**            | SQLAlchemy 2.0 (async)                                             |
| **Migrations**     | Alembic 1.13+                                                      |

---

## 1. Design Principles

| Principle                    | Implementation                                                       |
| ---------------------------- | -------------------------------------------------------------------- |
| **Normalization**            | 3NF for transactional tables; denormalize only for read-heavy analytics |
| **Naming Convention**        | `snake_case` for tables and columns; plural table names              |
| **Primary Keys**             | UUID v4 (`uuid` type) — portable, no sequential exposure             |
| **Timestamps**               | Every table has `created_at` and `updated_at` (UTC, timezone-aware)  |
| **Soft Deletes**             | `deleted_at` column on user-facing tables (nullable timestamp)       |
| **Indexes**                  | On all foreign keys, frequently filtered/sorted columns              |
| **Constraints**              | NOT NULL by default; explicit NULLable only when semantically valid   |
| **Enums**                    | PostgreSQL native ENUMs for fixed value sets                         |
| **JSON Columns**             | `JSONB` for semi-structured AI output (explanation data, metadata)   |

---

## 2. Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────────────────┐
│       users         │       │       analysis_results          │
├─────────────────────┤       ├─────────────────────────────────┤
│ id (PK, UUID)       │──┐    │ id (PK, UUID)                   │
│ email (UNIQUE)      │  │    │ user_id (FK → users.id)         │
│ username (UNIQUE)   │  │    │ input_type (ENUM)               │
│ password_hash       │  │    │ original_text                   │
│ full_name           │  │    │ cleaned_text                    │
│ role (ENUM)         │  │    │ detected_language               │
│ is_active           │  │    │ source_url                      │
│ avatar_url          │  └───▶│ ocr_image_path                  │
│ created_at          │       │ translated_text                 │
│ updated_at          │       │ summary                         │
│ deleted_at          │       │ credibility_label (ENUM)        │
│ last_login_at       │       │ credibility_score               │
└─────────┬───────────┘       │ sentiment_label (ENUM)          │
          │                   │ sentiment_score                 │
          │                   │ confidence                      │
          │                   │ explanation_data (JSONB)        │
          │                   │ model_versions (JSONB)          │
          │                   │ processing_time_ms              │
          │                   │ input_hash                      │
          │                   │ is_cached                       │
          │                   │ created_at                      │
          │                   │ updated_at                      │
          │                   └─────────────────────────────────┘
          │
          │                   ┌─────────────────────────────────┐
          │                   │       refresh_tokens            │
          │                   ├─────────────────────────────────┤
          └──────────────────▶│ id (PK, UUID)                   │
                              │ user_id (FK → users.id)         │
                              │ token_hash (UNIQUE)             │
                              │ expires_at                      │
                              │ is_revoked                      │
                              │ device_info                     │
                              │ created_at                      │
                              └─────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────┐
│       api_keys                  │   │       model_metadata        │
├─────────────────────────────────┤   ├─────────────────────────────┤
│ id (PK, UUID)                   │   │ id (PK, UUID)               │
│ user_id (FK → users.id)         │   │ model_name                  │
│ key_hash (UNIQUE)               │   │ model_version               │
│ name                            │   │ task (ENUM)                 │
│ prefix (VARCHAR(8))             │   │ framework                   │
│ permissions (JSONB)             │   │ file_path                   │
│ rate_limit                      │   │ file_size_bytes             │
│ last_used_at                    │   │ metrics (JSONB)             │
│ expires_at                      │   │ is_active                   │
│ is_active                       │   │ loaded_at                   │
│ created_at                      │   │ created_at                  │
│ updated_at                      │   │ updated_at                  │
└─────────────────────────────────┘   └─────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────┐
│       feedback                  │   │       audit_logs            │
├─────────────────────────────────┤   ├─────────────────────────────┤
│ id (PK, UUID)                   │   │ id (PK, UUID)               │
│ analysis_id (FK → analysis_...) │   │ user_id (FK → users.id)     │
│ user_id (FK → users.id)         │   │ action (VARCHAR)            │
│ rating (SMALLINT, 1-5)          │   │ resource_type (VARCHAR)     │
│ is_correct (BOOLEAN)            │   │ resource_id (UUID)          │
│ comment                         │   │ details (JSONB)             │
│ created_at                      │   │ ip_address (INET)           │
│ updated_at                      │   │ user_agent                  │
└─────────────────────────────────┘   │ created_at                  │
                                      └─────────────────────────────┘
```

---

## 3. Table Specifications

### 3.1 `users`

Stores registered user accounts.

| Column          | Type                     | Nullable | Default            | Constraints         | Notes                              |
| --------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`            | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `email`         | `VARCHAR(255)`           | NO       |                    | UNIQUE, INDEX       | Lowercased before storage          |
| `username`      | `VARCHAR(50)`            | NO       |                    | UNIQUE, INDEX       | Alphanumeric + underscore only     |
| `password_hash` | `VARCHAR(255)`           | NO       |                    |                     | bcrypt hash                        |
| `full_name`     | `VARCHAR(100)`           | YES      | NULL               |                     |                                    |
| `role`          | `user_role_enum`         | NO       | `'user'`           |                     | Values: `user`, `admin`            |
| `is_active`     | `BOOLEAN`                | NO       | `TRUE`             |                     | Admin can deactivate               |
| `avatar_url`    | `VARCHAR(500)`           | YES      | NULL               |                     | URL to profile image               |
| `created_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |
| `updated_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     | Auto-updated via trigger           |
| `deleted_at`    | `TIMESTAMPTZ`            | YES      | NULL               | INDEX               | Soft delete                        |
| `last_login_at` | `TIMESTAMPTZ`            | YES      | NULL               |                     | Updated on each login              |

**Indexes:**
- `ix_users_email` — unique index on `email`
- `ix_users_username` — unique index on `username`
- `ix_users_deleted_at` — partial index `WHERE deleted_at IS NULL` (active users)

---

### 3.2 `analysis_results`

Stores every analysis performed by the system. Core data table.

| Column              | Type                     | Nullable | Default            | Constraints         | Notes                                      |
| ------------------- | ------------------------ | -------- | ------------------ | ------------------- | ------------------------------------------ |
| `id`                | `UUID`                   | NO       | `gen_random_uuid()`| PK                  | Primary Key                                |
| `user_id`           | `UUID`                   | YES      | NULL               | FK → `users.id`, INDEX | Nullable for anonymous/public requests; ondelete SET NULL |
| `input_type`        | `VARCHAR(20)`            | NO       | `'text'`           | INDEX               | Values: `text`, `url`, `image`             |
| `original_text`     | `TEXT`                   | NO       |                    |                     | Raw submitted text or extracted content    |
| `cleaned_text`      | `TEXT`                   | YES      | NULL               |                     | Cleaned / normalized text                  |
| `source_url`        | `VARCHAR(2048)`          | YES      | NULL               |                     | Populated for URL input analyses           |
| `title`             | `VARCHAR(500)`           | YES      | NULL               |                     | Article title or uploaded image filename   |
| `detected_language` | `VARCHAR(10)`            | NO       | `'auto'`           | INDEX               | Detected ISO 639-1 code (e.g. `en`, `hi`)  |
| `credibility_label` | `VARCHAR(20)`            | NO       |                    | INDEX               | Values: `real`, `fake`                     |
| `credibility_score` | `FLOAT`                  | NO       |                    |                     | 0.0000–1.0000 (probability score)          |
| `sentiment_label`   | `VARCHAR(20)`            | NO       |                    | INDEX               | Values: `positive`, `negative`, `neutral`  |
| `sentiment_score`   | `FLOAT`                  | NO       |                    |                     | 0.0000–1.0000                              |
| `confidence`        | `FLOAT`                  | NO       |                    |                     | Overall prediction confidence score        |
| `processing_time_ms`| `FLOAT`                  | NO       |                    |                     | Total inference/pipeline duration in ms    |
| `is_mock`           | `BOOLEAN`                | NO       | `FALSE`            |                     | Flag indicating mock fallback vs real model|
| `created_at`        | `TIMESTAMPTZ`            | NO       | `NOW()`            | INDEX               | Record creation timestamp                  |
| `updated_at`        | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     | Record update timestamp                    |
| `deleted_at`        | `TIMESTAMPTZ`            | YES      | NULL               | INDEX               | Soft-delete timestamp (excluded from UI)   |

**Indexes:**
- `ix_analysis_results_user_id` — on `user_id`
- `ix_analysis_results_input_type` — on `input_type`
- `ix_analysis_results_detected_language` — on `detected_language`
- `ix_analysis_results_credibility_label` — on `credibility_label`
- `ix_analysis_results_sentiment_label` — on `sentiment_label`
- `ix_analysis_results_created_at` — on `created_at DESC`


---

### 3.3 `refresh_tokens`

Stores hashed refresh tokens for JWT rotation.

| Column          | Type                     | Nullable | Default            | Constraints         | Notes                              |
| --------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`            | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `user_id`       | `UUID`                   | NO       |                    | FK → `users.id`, INDEX |                                 |
| `token_hash`    | `VARCHAR(255)`           | NO       |                    | UNIQUE              | SHA-256 of the raw token           |
| `expires_at`    | `TIMESTAMPTZ`            | NO       |                    | INDEX               |                                    |
| `is_revoked`    | `BOOLEAN`                | NO       | `FALSE`            |                     | Set to TRUE on logout              |
| `device_info`   | `VARCHAR(500)`           | YES      | NULL               |                     | User-Agent string                  |
| `created_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |

**Indexes:**
- `ix_refresh_tokens_user_id` — on `user_id`
- `ix_refresh_tokens_token_hash` — unique index on `token_hash`
- `ix_refresh_tokens_expires_at` — on `expires_at` (for cleanup job)

**Cleanup:** A scheduled job deletes rows where `expires_at < NOW()` or `is_revoked = TRUE` older than 30 days.

---

### 3.4 `api_keys`

API keys for programmatic access (researcher persona).

| Column          | Type                     | Nullable | Default            | Constraints         | Notes                              |
| --------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`            | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `user_id`       | `UUID`                   | NO       |                    | FK → `users.id`, INDEX |                                 |
| `key_hash`      | `VARCHAR(255)`           | NO       |                    | UNIQUE              | SHA-256 of the raw API key         |
| `name`          | `VARCHAR(100)`           | NO       |                    |                     | User-assigned label                |
| `prefix`        | `VARCHAR(8)`             | NO       |                    |                     | First 8 chars for identification   |
| `permissions`   | `JSONB`                  | NO       | `'["analyze"]'`    |                     | Allowed scopes                     |
| `rate_limit`    | `INTEGER`                | NO       | `100`              |                     | Requests per hour                  |
| `last_used_at`  | `TIMESTAMPTZ`            | YES      | NULL               |                     |                                    |
| `expires_at`    | `TIMESTAMPTZ`            | YES      | NULL               |                     | NULL = never expires               |
| `is_active`     | `BOOLEAN`                | NO       | `TRUE`             |                     |                                    |
| `created_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |
| `updated_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |

---

### 3.5 `model_metadata`

Tracks AI model versions loaded in the system.

| Column            | Type                     | Nullable | Default            | Constraints         | Notes                              |
| ----------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`              | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `model_name`      | `VARCHAR(100)`           | NO       |                    | INDEX               | e.g., `xlm-roberta-fakenews-v1`   |
| `model_version`   | `VARCHAR(20)`            | NO       |                    |                     | Semantic version                   |
| `task`            | `model_task_enum`        | NO       |                    |                     | Values: `detection`, `sentiment`, `translation`, `summarization` |
| `framework`       | `VARCHAR(50)`            | NO       |                    |                     | `pytorch`, `onnx`                  |
| `file_path`       | `VARCHAR(500)`           | NO       |                    |                     | Path to model files                |
| `file_size_bytes` | `BIGINT`                 | NO       |                    |                     |                                    |
| `metrics`         | `JSONB`                  | YES      | NULL               |                     | `{"f1": 0.87, "accuracy": 0.85}`  |
| `is_active`       | `BOOLEAN`                | NO       | `TRUE`             |                     | Only one active per task           |
| `loaded_at`       | `TIMESTAMPTZ`            | YES      | NULL               |                     | When model was loaded into memory  |
| `created_at`      | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |
| `updated_at`      | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |

**Unique Constraint:** `(model_name, model_version)` — no duplicate versions.

---

### 3.6 `feedback`

User feedback on analysis accuracy. Used for model improvement data collection.

| Column          | Type                     | Nullable | Default            | Constraints         | Notes                              |
| --------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`            | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `analysis_id`   | `UUID`                   | NO       |                    | FK → `analysis_results.id`, INDEX |                    |
| `user_id`       | `UUID`                   | NO       |                    | FK → `users.id`, INDEX |                                 |
| `rating`        | `SMALLINT`               | YES      | NULL               | CHECK (1–5)         | Star rating                        |
| `is_correct`    | `BOOLEAN`                | YES      | NULL               |                     | User confirms if prediction was right |
| `comment`       | `TEXT`                   | YES      | NULL               |                     | Free-text feedback                 |
| `created_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |
| `updated_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            |                     |                                    |

**Unique Constraint:** `(analysis_id, user_id)` — one feedback per user per analysis.

---

### 3.7 `audit_logs`

Immutable log of significant system actions. Write-only — never updated or deleted.

| Column          | Type                     | Nullable | Default            | Constraints         | Notes                              |
| --------------- | ------------------------ | -------- | ------------------ | ------------------- | ---------------------------------- |
| `id`            | `UUID`                   | NO       | `gen_random_uuid()`| PK                  |                                    |
| `user_id`       | `UUID`                   | YES      | NULL               | FK → `users.id`, INDEX | NULL for system actions          |
| `action`        | `VARCHAR(50)`            | NO       |                    | INDEX               | e.g., `user.login`, `analysis.create` |
| `resource_type` | `VARCHAR(50)`            | NO       |                    |                     | e.g., `user`, `analysis_result`    |
| `resource_id`   | `UUID`                   | YES      | NULL               |                     | ID of affected resource            |
| `details`       | `JSONB`                  | YES      | NULL               |                     | Additional context                 |
| `ip_address`    | `INET`                   | YES      | NULL               |                     |                                    |
| `user_agent`    | `VARCHAR(500)`           | YES      | NULL               |                     |                                    |
| `created_at`    | `TIMESTAMPTZ`            | NO       | `NOW()`            | INDEX               |                                    |

**Partitioning (Future):** Consider monthly range partitioning on `created_at` if table grows beyond 1M rows.

---

## 4. Enum Definitions

```sql
-- User roles
CREATE TYPE user_role_enum AS ENUM ('user', 'admin');

-- Input types for analysis
CREATE TYPE input_type_enum AS ENUM ('text', 'url', 'image');

-- Credibility classification labels
CREATE TYPE credibility_enum AS ENUM ('real', 'fake', 'uncertain');

-- Sentiment classification labels
CREATE TYPE sentiment_enum AS ENUM ('positive', 'negative', 'neutral');

-- AI model task types
CREATE TYPE model_task_enum AS ENUM ('detection', 'sentiment', 'translation', 'summarization');
```

---

## 5. JSONB Schema Definitions

### 5.1 `explanation_data` (in `analysis_results`)

```json
{
  "lime": {
    "feature_importances": [
      {"word": "breaking", "weight": 0.82, "direction": "fake"},
      {"word": "confirmed", "weight": 0.65, "direction": "real"},
      {"word": "shocking", "weight": 0.58, "direction": "fake"},
      {"word": "officials", "weight": 0.45, "direction": "real"},
      {"word": "unbelievable", "weight": 0.41, "direction": "fake"}
    ],
    "prediction_probabilities": {
      "real": 0.23,
      "fake": 0.77
    }
  },
  "attention": {
    "layer": 11,
    "head": 0,
    "tokens": ["[CLS]", "breaking", "news", "shocking", "..."],
    "weights": [0.02, 0.18, 0.05, 0.22, 0.03]
  },
  "shap": {
    "base_value": 0.5,
    "values": [0.12, -0.08, 0.15, -0.03, 0.09]
  }
}
```

### 5.2 `model_versions` (in `analysis_results`)

```json
{
  "detection": {
    "name": "xlm-roberta-fakenews",
    "version": "1.0.0",
    "framework": "onnx"
  },
  "sentiment": {
    "name": "xlm-roberta-sentiment",
    "version": "1.0.0",
    "framework": "onnx"
  }
}
```

### 5.3 `metrics` (in `model_metadata`)

```json
{
  "overall": {
    "accuracy": 0.87,
    "f1_macro": 0.86,
    "precision_macro": 0.85,
    "recall_macro": 0.87
  },
  "per_language": {
    "en": {"f1": 0.89, "accuracy": 0.88, "test_size": 2000},
    "hi": {"f1": 0.83, "accuracy": 0.82, "test_size": 800},
    "es": {"f1": 0.85, "accuracy": 0.84, "test_size": 600}
  },
  "training": {
    "epochs": 5,
    "batch_size": 16,
    "learning_rate": 2e-5,
    "training_samples": 15000,
    "training_time_hours": 3.5
  }
}
```

### 5.4 `permissions` (in `api_keys`)

```json
["analyze", "history.read", "export"]
```

---

## 6. Database Triggers & Functions

### 6.1 Auto-Update `updated_at`

```sql
-- Function: auto-set updated_at on row update
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all relevant tables
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- Repeat for: analysis_results, api_keys, model_metadata, feedback
```

### 6.2 Audit Log on User Changes

```sql
-- Automatically log user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_active <> NEW.is_active THEN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    VALUES (
      NEW.id,
      CASE WHEN NEW.is_active THEN 'user.activated' ELSE 'user.deactivated' END,
      'user',
      NEW.id,
      jsonb_build_object('old_status', OLD.is_active, 'new_status', NEW.is_active)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 7. Migration Strategy

### 7.1 Alembic Configuration

| Setting                    | Value                                               |
| -------------------------- | --------------------------------------------------- |
| Migration directory        | `backend/alembic/versions/`                         |
| Naming convention          | `{rev}_{slug}.py` (e.g., `001_create_users.py`)     |
| Auto-generate              | Enabled (from SQLAlchemy models)                    |
| Downgrade support          | Required for all migrations                         |
| Data migrations            | Separate files, clearly labeled                      |

### 7.2 Migration Workflow

```
1. Modify SQLAlchemy model
2. Run: alembic revision --autogenerate -m "description"
3. Review generated migration (ALWAYS review auto-generated code)
4. Run: alembic upgrade head
5. Test: verify schema matches expectations
6. Commit migration file with the model change
```

### 7.3 Implemented Migrations (Active)

| Revision ID | Description | Applied Date | Notes |
| ----------- | ----------- | ------------ | ----- |
| `8a9aac35e684` | `create_analysis_results_table` | 2026-09-08 | Initial `analysis_results` table with UUID, credibility, sentiment, timing, soft delete |
| `671939c98ccd` | `create_users_table` | 2026-09-09 | `users` table + FK constraint `fk_analysis_results_user_id_users` |
| `e1a47b892c01` | `add_source_url_and_title_to_analysis_results` | 2026-09-09 | Adds `source_url` (VARCHAR 2048) and `title` (VARCHAR 500) |

### 7.4 Planned Migrations (Phase 4–5)

```
004_create_feedback_table.py
005_create_audit_logs_table.py
006_create_api_keys_table.py
```


---

## 8. Query Patterns & Optimization

### 8.1 Critical Query Patterns

| Query                                  | Frequency  | Optimization                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------- |
| User history (paginated, by date)      | Very High  | Composite index `(user_id, created_at DESC)`          |
| Cache lookup by input hash             | Very High  | Index on `input_hash`; Redis as primary cache         |
| Analytics: count by language           | Medium     | Index on `detected_language`; materialized view (opt) |
| Analytics: count by credibility label  | Medium     | Index on `credibility_label`                          |
| Analytics: daily trend                 | Medium     | Index on `created_at`; aggregate query                |
| Admin: list active users               | Low        | Partial index on `deleted_at IS NULL`                 |
| Token validation                       | Very High  | Unique index on `token_hash`                          |

### 8.2 Pagination Strategy

| Use Case                     | Strategy           | Rationale                                    |
| ---------------------------- | ------------------ | -------------------------------------------- |
| User analysis history        | Cursor-based       | Consistent results with concurrent inserts   |
| Admin user list              | Offset-based       | Simpler; low concurrency on admin pages      |
| Analytics data points        | Time-range based   | Natural for time-series data                 |

### 8.3 Cursor-Based Pagination Example

```
-- Page 1: latest 20 results
SELECT * FROM analysis_results
WHERE user_id = :user_id
ORDER BY created_at DESC
LIMIT 20;

-- Page 2+: pass last item's created_at as cursor
SELECT * FROM analysis_results
WHERE user_id = :user_id AND created_at < :cursor
ORDER BY created_at DESC
LIMIT 20;
```

---

## 9. Data Retention & Cleanup

| Data Type            | Retention Period | Cleanup Method                                     |
| -------------------- | ---------------- | -------------------------------------------------- |
| Analysis results     | Indefinite       | User can manually delete own results               |
| Refresh tokens       | 30 days          | Scheduled job: delete expired/revoked tokens       |
| Audit logs           | 1 year           | Scheduled job: archive to cold storage (future)    |
| Soft-deleted users   | 90 days          | Scheduled job: hard delete after grace period      |
| OCR uploaded images  | 7 days           | Scheduled job: delete from file storage            |

---

## 10. Seed Data

### 10.1 Development Seeds

| Table              | Seed Data                                                    |
| ------------------ | ------------------------------------------------------------ |
| `users`            | 1 admin (`admin@veritasai.dev`), 2 test users                |
| `analysis_results` | 10 sample analyses (mix of languages and labels)             |
| `model_metadata`   | Entries for each active model                                |

### 10.2 Demo Seeds

| Table              | Seed Data                                                    |
| ------------------ | ------------------------------------------------------------ |
| `users`            | 1 demo user (`demo@veritasai.dev`, password: `demo1234`)     |
| `analysis_results` | 25 analyses with XAI data for impressive demo                |
| `feedback`         | 10 feedback entries                                          |

---

## 11. Connection Pooling

| Setting              | Development | Production                                      |
| -------------------- | ----------- | ----------------------------------------------- |
| Pool size            | 5           | 10                                              |
| Max overflow         | 5           | 20                                              |
| Pool timeout         | 30s         | 30s                                             |
| Pool recycle         | 1800s       | 1800s (30 min)                                  |
| Pool pre-ping        | True        | True (detect stale connections)                 |

```python
# SQLAlchemy async engine configuration (conceptual)
engine = create_async_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)
```

---

## 12. Backup Strategy

| Environment  | Method                      | Frequency     | Retention    |
| ------------ | --------------------------- | ------------- | ------------ |
| Development  | None (disposable)           | —             | —            |
| Staging      | Supabase automatic backups  | Daily         | 7 days       |
| Production   | Supabase automatic backups  | Daily         | 7 days       |
| Pre-release  | Manual `pg_dump`            | Before deploy | 3 copies     |

---

## 13. Security Considerations

| Concern                    | Mitigation                                                    |
| -------------------------- | ------------------------------------------------------------- |
| SQL injection              | SQLAlchemy ORM only; no raw string concatenation              |
| Sensitive data at rest     | `password_hash` uses bcrypt; tokens are SHA-256 hashed        |
| PII access                 | User data accessible only by owner or admin (RBAC enforced)   |
| Database credentials       | Environment variables only; never in code or config files     |
| Connection encryption      | SSL required for production PostgreSQL connections             |
| Least privilege            | Application DB user has only DML rights (no DDL in production)|

---

## 14. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `01_ARCHITECTURE.md`         | Data layer architecture this schema implements      |
| `05_API_SPECIFICATION.md`    | API endpoints that read/write these tables          |
| `06_AI_PIPELINE.md`          | AI models whose output is stored here               |
| `08_CODING_GUIDELINES.md`    | Naming conventions for models and migrations        |
| `15_SECURITY_PLAN.md`        | Security controls for data protection               |

---

## 15. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document is the single source of truth for the VeritasAI database schema. All model changes must go through Alembic migrations and be reviewed before merge.*
