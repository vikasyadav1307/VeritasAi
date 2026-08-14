# 05 — API Specification

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-05                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |
| **Parent**         | `01_ARCHITECTURE.md`, `04_DATABASE_DESIGN.md`                      |
| **Base URL**       | `http://localhost:8000/api/v1` (dev) / `https://api.veritasai.dev/api/v1` (prod) |
| **Format**         | JSON (application/json) unless otherwise noted                     |
| **Auth**           | Bearer JWT in `Authorization` header                               |

---

## 1. API Design Principles

| Principle                | Implementation                                                          |
| ------------------------ | ----------------------------------------------------------------------- |
| **RESTful**              | Resource-oriented URLs; standard HTTP methods                           |
| **Versioned**            | URL prefix `/api/v1/`; additive changes only within a major version     |
| **Consistent**           | Uniform response envelope, error format, pagination format              |
| **Documented**           | Auto-generated OpenAPI 3.1 at `/docs` (Swagger UI) and `/redoc`        |
| **Idempotent**           | GET, PUT, DELETE are idempotent; POST creates new resources             |
| **Secure**               | JWT auth on all non-public routes; input validated via Pydantic         |

---

## 2. Response Envelope

### 2.1 Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "request_id": "req_abc123def456",
    "timestamp": "2026-08-13T12:00:00Z",
    "processing_time_ms": 1250
  }
}
```

### 2.2 Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false,
    "next_cursor": "2026-08-12T23:59:59Z"
  },
  "meta": {
    "request_id": "req_abc123def456",
    "timestamp": "2026-08-13T12:00:00Z"
  }
}
```

### 2.3 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_TEXT_TOO_SHORT",
    "message": "Input text must be at least 20 characters.",
    "details": {
      "field": "text",
      "min_length": 20,
      "actual_length": 8
    }
  },
  "meta": {
    "request_id": "req_abc123def456",
    "timestamp": "2026-08-13T12:00:00Z"
  }
}
```

---

## 3. Authentication Headers

| Header            | Value                        | Required On           |
| ----------------- | ---------------------------- | --------------------- |
| `Authorization`   | `Bearer <access_token>`      | All protected routes  |
| `Content-Type`    | `application/json`           | POST, PUT, PATCH      |
| `Accept`          | `application/json`           | All requests          |
| `X-Request-ID`    | UUID (client-generated)      | Optional (tracing)    |

---

## 4. Endpoint Reference

### 4.1 Route Map

```
/api/v1/
├── auth/
│   ├── POST   /register           Register new user
│   ├── POST   /login              Obtain JWT tokens
│   ├── POST   /refresh            Refresh access token
│   ├── POST   /logout             Revoke refresh token
│   ├── GET    /me                 Get current user profile
│   ├── PUT    /me                 Update profile
│   └── PUT    /password           Change password
│
├── analyze/
│   ├── POST   /text               Analyze plain text
│   ├── POST   /url                Analyze article from URL
│   └── POST   /image              Analyze text in image (OCR)
│
├── history/
│   ├── GET    /                   List analysis history
│   ├── GET    /{id}               Get single analysis detail
│   └── DELETE /{id}               Delete analysis record
│
├── translate/
│   └── POST   /                   Translate text
│
├── summarize/
│   └── POST   /                   Summarize text
│
├── export/
│   ├── GET    /{analysis_id}/pdf  Export as PDF
│   └── GET    /{analysis_id}/json Export as JSON
│
├── analytics/
│   ├── GET    /summary            Aggregate statistics
│   ├── GET    /trends             Time-series trends
│   └── GET    /languages          Analysis by language
│
├── admin/
│   ├── GET    /users              List all users
│   ├── GET    /users/{id}         Get user details
│   ├── PUT    /users/{id}/status  Activate/deactivate user
│   └── GET    /stats              System statistics
│
├── feedback/
│   └── POST   /{analysis_id}     Submit feedback on analysis
│
├── languages/
│   └── GET    /                   List supported languages
│
└── models/
    └── GET    /                   List loaded models
```

---

## 5. Endpoint Specifications

---

### 5.1 Authentication — `POST /api/v1/auth/register`

Register a new user account.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | None (public)                   |
| **Rate Limit** | 5 requests / minute / IP        |
| **Phase**      | Phase 2                         |

**Request Body:**

```json
{
  "email": "priya@example.com",
  "username": "priya_veritas",
  "password": "SecurePass123!",
  "full_name": "Priya Sharma"
}
```

| Field       | Type     | Required | Validation                                          |
| ----------- | -------- | -------- | --------------------------------------------------- |
| `email`     | string   | Yes      | Valid email format; max 255 chars; unique            |
| `username`  | string   | Yes      | 3–50 chars; alphanumeric + underscore; unique        |
| `password`  | string   | Yes      | 8–128 chars; 1 uppercase, 1 lowercase, 1 digit      |
| `full_name` | string   | No       | Max 100 chars                                        |

**Success Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "priya@example.com",
    "username": "priya_veritas",
    "full_name": "Priya Sharma",
    "role": "user",
    "created_at": "2026-08-13T12:00:00Z"
  }
}
```

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 400    | `VALIDATION_INVALID_EMAIL`    | Email format invalid              |
| 409    | `AUTH_EMAIL_EXISTS`           | Email already registered          |
| 409    | `AUTH_USERNAME_EXISTS`        | Username already taken            |
| 429    | `RATE_LIMIT_EXCEEDED`        | Too many registration attempts    |

---

### 5.2 Authentication — `POST /api/v1/auth/login`

Authenticate user and issue JWT tokens.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | None (public)                   |
| **Rate Limit** | 10 requests / minute / IP       |
| **Phase**      | Phase 2                         |

**Request Body:**

```json
{
  "email": "priya@example.com",
  "password": "SecurePass123!"
}
```

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "priya@example.com",
      "username": "priya_veritas",
      "role": "user"
    }
  }
}
```

*Refresh token is set as an HttpOnly cookie (`veritas_refresh_token`).*

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 401    | `AUTH_INVALID_CREDENTIALS`    | Wrong email or password           |
| 403    | `AUTH_ACCOUNT_DEACTIVATED`    | Account deactivated by admin      |
| 429    | `RATE_LIMIT_EXCEEDED`        | Too many login attempts           |

---

### 5.3 Authentication — `POST /api/v1/auth/refresh`

Issue a new access token using the refresh token.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Refresh token (HttpOnly cookie) |
| **Rate Limit** | 30 requests / minute / user     |
| **Phase**      | Phase 2                         |

**Request:** No body. Refresh token read from cookie.

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 401    | `AUTH_REFRESH_TOKEN_MISSING`  | No refresh token cookie           |
| 401    | `AUTH_REFRESH_TOKEN_EXPIRED`  | Token past expiry                 |
| 401    | `AUTH_REFRESH_TOKEN_REVOKED`  | Token has been revoked            |

---

### 5.4 Authentication — `POST /api/v1/auth/logout`

Revoke the current refresh token.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 2                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "message": "Successfully logged out."
  }
}
```

---

### 5.5 Authentication — `GET /api/v1/auth/me`

Get current authenticated user's profile.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 2                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "priya@example.com",
    "username": "priya_veritas",
    "full_name": "Priya Sharma",
    "role": "user",
    "is_active": true,
    "avatar_url": null,
    "created_at": "2026-08-13T12:00:00Z",
    "last_login_at": "2026-08-13T12:00:00Z",
    "analysis_count": 42
  }
}
```

---

### 5.6 Authentication — `PUT /api/v1/auth/me`

Update current user's profile.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 2                         |

**Request Body:**

```json
{
  "full_name": "Priya S. Sharma",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

| Field        | Type   | Required | Validation          |
| ------------ | ------ | -------- | ------------------- |
| `full_name`  | string | No       | Max 100 chars       |
| `avatar_url` | string | No       | Valid URL; max 500   |

**Success Response:** `200 OK` — returns updated user object.

---

### 5.7 Authentication — `PUT /api/v1/auth/password`

Change current user's password.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 2                         |

**Request Body:**

```json
{
  "current_password": "SecurePass123!",
  "new_password": "EvenMoreSecure456!"
}
```

**Error Responses:**

| Status | Code                               | When                          |
| ------ | ---------------------------------- | ----------------------------- |
| 400    | `VALIDATION_PASSWORD_TOO_WEAK`     | New password doesn't meet rules |
| 401    | `AUTH_INVALID_CURRENT_PASSWORD`    | Current password is wrong      |

---

### 5.8 Analysis — `POST /api/v1/analyze/text`

Submit plain text for fake news detection and sentiment analysis.

| Property       | Value                              |
| -------------- | ---------------------------------- |
| **Auth**       | Bearer JWT                         |
| **Rate Limit** | 30 requests / hour / user          |
| **Phase**      | Phase 1 (backend) / Phase 2 (full) |

**Request Body:**

```json
{
  "text": "Breaking news: Scientists discover revolutionary...",
  "options": {
    "include_explanation": true,
    "include_translation": true,
    "include_summary": true,
    "target_language": "en"
  }
}
```

| Field                        | Type    | Required | Validation                    |
| ---------------------------- | ------- | -------- | ----------------------------- |
| `text`                       | string  | Yes      | 20–50,000 chars               |
| `options.include_explanation` | boolean | No       | Default: `true`               |
| `options.include_translation` | boolean | No       | Default: `false`              |
| `options.include_summary`    | boolean | No       | Default: `false`              |
| `options.target_language`    | string  | No       | ISO 639-1 code; default: `en` |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "input_type": "text",
    "detected_language": "en",
    "credibility": {
      "label": "fake",
      "score": 0.2314,
      "confidence": 0.8721
    },
    "sentiment": {
      "label": "negative",
      "score": 0.7823,
      "confidence": 0.9102
    },
    "explanation": {
      "lime": {
        "feature_importances": [
          {"word": "shocking", "weight": 0.82, "direction": "fake"},
          {"word": "unbelievable", "weight": 0.65, "direction": "fake"},
          {"word": "scientists", "weight": 0.45, "direction": "real"},
          {"word": "discover", "weight": 0.38, "direction": "real"},
          {"word": "breaking", "weight": 0.31, "direction": "fake"}
        ],
        "prediction_probabilities": {
          "real": 0.2314,
          "fake": 0.7686
        }
      },
      "attention": {
        "tokens": ["breaking", "news", "scientists", "discover", "..."],
        "weights": [0.15, 0.05, 0.22, 0.18, 0.03]
      }
    },
    "translation": {
      "original_language": "en",
      "target_language": "en",
      "translated_text": null
    },
    "summary": "The article claims a revolutionary scientific discovery but uses sensational language without citing specific sources.",
    "model_versions": {
      "detection": {"name": "xlm-roberta-fakenews", "version": "1.0.0"},
      "sentiment": {"name": "xlm-roberta-sentiment", "version": "1.0.0"}
    },
    "processing_time_ms": 1842,
    "is_cached": false,
    "created_at": "2026-08-13T12:00:00Z"
  }
}
```

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 400    | `VALIDATION_TEXT_TOO_SHORT`   | Text under 20 characters          |
| 400    | `VALIDATION_TEXT_TOO_LONG`    | Text over 50,000 characters       |
| 422    | `PROCESSING_LANGUAGE_UNSUPPORTED` | Detected language not supported |
| 429    | `RATE_LIMIT_EXCEEDED`        | Hourly analysis limit exceeded    |
| 500    | `INTERNAL_MODEL_INFERENCE_FAILED` | AI model error                |

---

### 5.9 Analysis — `POST /api/v1/analyze/url`

Submit a URL for article extraction and analysis.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Rate Limit** | 20 requests / hour / user       |
| **Phase**      | Phase 3                         |

**Request Body:**

```json
{
  "url": "https://example.com/news/article-123",
  "options": {
    "include_explanation": true,
    "include_translation": false,
    "include_summary": true
  }
}
```

| Field   | Type   | Required | Validation                                   |
| ------- | ------ | -------- | -------------------------------------------- |
| `url`   | string | Yes      | Valid HTTP/HTTPS URL; max 2048 chars          |

**Success Response:** `200 OK` — same structure as text analysis, with additional fields:

```json
{
  "data": {
    "source_url": "https://example.com/news/article-123",
    "extracted_title": "Scientists Discover Revolutionary...",
    "extracted_text": "The full article body...",
    ...
  }
}
```

**Error Responses:**

| Status | Code                              | When                              |
| ------ | --------------------------------- | --------------------------------- |
| 400    | `VALIDATION_INVALID_URL`          | Malformed URL                     |
| 422    | `PROCESSING_URL_UNREACHABLE`      | URL returned non-200 or timeout   |
| 422    | `PROCESSING_CONTENT_EXTRACTION_FAILED` | Could not extract article body |

---

### 5.10 Analysis — `POST /api/v1/analyze/image`

Submit an image for OCR text extraction and analysis.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Rate Limit** | 15 requests / hour / user       |
| **Content-Type** | `multipart/form-data`         |
| **Phase**      | Phase 3                         |

**Request:** Multipart form data

| Field     | Type   | Required | Validation                                         |
| --------- | ------ | -------- | -------------------------------------------------- |
| `image`   | file   | Yes      | JPEG, PNG, or WebP; max 10 MB                      |
| `options` | string | No       | JSON string with same options as text analysis     |

**Success Response:** `200 OK` — same structure as text analysis, with additional fields:

```json
{
  "data": {
    "ocr_extracted_text": "The text extracted from the image...",
    "ocr_confidence": 0.94,
    ...
  }
}
```

**Error Responses:**

| Status | Code                              | When                              |
| ------ | --------------------------------- | --------------------------------- |
| 400    | `VALIDATION_INVALID_IMAGE_FORMAT` | Unsupported file type             |
| 400    | `VALIDATION_FILE_TOO_LARGE`      | File exceeds 10 MB                |
| 422    | `PROCESSING_OCR_FAILED`          | OCR could not extract text        |
| 422    | `PROCESSING_OCR_TEXT_TOO_SHORT`  | Extracted text under 20 chars     |

---

### 5.11 History — `GET /api/v1/history`

List the current user's analysis history.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 2                         |

**Query Parameters:**

| Param       | Type    | Default | Validation                                |
| ----------- | ------- | ------- | ----------------------------------------- |
| `page`      | integer | 1       | ≥ 1                                       |
| `per_page`  | integer | 20      | 1–100                                     |
| `sort`      | string  | `-created_at` | `created_at`, `-created_at`, `credibility_score`, `-credibility_score` |
| `language`  | string  | —       | ISO 639-1 code filter                     |
| `label`     | string  | —       | `real`, `fake`, `uncertain`               |
| `input_type`| string  | —       | `text`, `url`, `image`                    |
| `q`         | string  | —       | Search in original_text (partial match)   |
| `from_date` | string  | —       | ISO 8601 date                             |
| `to_date`   | string  | —       | ISO 8601 date                             |

**Success Response:** `200 OK` — paginated list of analysis summaries (without full explanation data).

---

### 5.12 History — `GET /api/v1/history/{id}`

Get full details of a single analysis.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (owner only)         |
| **Phase**      | Phase 2                         |

**Success Response:** `200 OK` — full analysis object (same as analysis response).

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 404    | `NOT_FOUND_ANALYSIS`          | Analysis ID doesn't exist         |
| 403    | `FORBIDDEN_NOT_OWNER`         | User doesn't own this analysis    |

---

### 5.13 History — `DELETE /api/v1/history/{id}`

Delete an analysis record (soft delete).

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (owner only)         |
| **Phase**      | Phase 2                         |

**Success Response:** `204 No Content`

---

### 5.14 Translation — `POST /api/v1/translate`

Translate text between supported languages.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Rate Limit** | 30 requests / hour / user       |
| **Phase**      | Phase 3                         |

**Request Body:**

```json
{
  "text": "यह एक परीक्षण है।",
  "source_language": "hi",
  "target_language": "en"
}
```

| Field              | Type   | Required | Validation                      |
| ------------------ | ------ | -------- | ------------------------------- |
| `text`             | string | Yes      | 1–10,000 chars                  |
| `source_language`  | string | No       | ISO 639-1; auto-detect if omitted |
| `target_language`  | string | Yes      | ISO 639-1                        |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "original_text": "यह एक परीक्षण है।",
    "translated_text": "This is a test.",
    "source_language": "hi",
    "target_language": "en",
    "confidence": 0.95
  }
}
```

---

### 5.15 Summarization — `POST /api/v1/summarize`

Generate a summary of input text.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Rate Limit** | 20 requests / hour / user       |
| **Phase**      | Phase 3                         |

**Request Body:**

```json
{
  "text": "A very long article text...",
  "max_length": 150,
  "min_length": 50
}
```

| Field        | Type    | Required | Validation                    |
| ------------ | ------- | -------- | ----------------------------- |
| `text`       | string  | Yes      | 100–50,000 chars              |
| `max_length` | integer | No       | Default: 150; max: 500        |
| `min_length` | integer | No       | Default: 50; min: 20          |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "original_length": 2500,
    "summary": "The article discusses...",
    "summary_length": 127,
    "compression_ratio": 0.051
  }
}
```

---

### 5.16 Export — `GET /api/v1/export/{analysis_id}/pdf`

Download analysis result as a formatted PDF report.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (owner only)         |
| **Content-Type** | `application/pdf`             |
| **Phase**      | Phase 4                         |

**Success Response:** `200 OK` — PDF file download.

**Headers:**

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="veritasai-report-{id}.pdf"
```

---

### 5.17 Export — `GET /api/v1/export/{analysis_id}/json`

Download analysis result as a JSON file.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (owner only)         |
| **Content-Type** | `application/json`            |
| **Phase**      | Phase 4                         |

**Success Response:** `200 OK` — JSON file download with full analysis object.

---

### 5.18 Analytics — `GET /api/v1/analytics/summary`

Get aggregate statistics for the current user's analyses.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 4                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total_analyses": 142,
    "credibility_breakdown": {
      "real": 68,
      "fake": 52,
      "uncertain": 22
    },
    "sentiment_breakdown": {
      "positive": 45,
      "negative": 72,
      "neutral": 25
    },
    "language_breakdown": {
      "en": 80,
      "hi": 35,
      "es": 15,
      "fr": 8,
      "ar": 4
    },
    "input_type_breakdown": {
      "text": 100,
      "url": 30,
      "image": 12
    },
    "avg_credibility_score": 0.5423,
    "avg_processing_time_ms": 1650
  }
}
```

---

### 5.19 Analytics — `GET /api/v1/analytics/trends`

Get time-series data for analysis trends.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 4                         |

**Query Parameters:**

| Param       | Type   | Default    | Validation                       |
| ----------- | ------ | ---------- | -------------------------------- |
| `period`    | string | `daily`    | `daily`, `weekly`, `monthly`     |
| `from_date` | string | 30 days ago| ISO 8601 date                    |
| `to_date`   | string | today      | ISO 8601 date                    |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "period": "daily",
    "data_points": [
      {"date": "2026-08-01", "total": 5, "fake": 3, "real": 2, "uncertain": 0},
      {"date": "2026-08-02", "total": 8, "fake": 2, "real": 5, "uncertain": 1}
    ]
  }
}
```

---

### 5.20 Analytics — `GET /api/v1/analytics/languages`

Get analysis distribution by detected language.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 4                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "languages": [
      {"code": "en", "name": "English", "count": 80, "percentage": 56.3},
      {"code": "hi", "name": "Hindi", "count": 35, "percentage": 24.6},
      {"code": "es", "name": "Spanish", "count": 15, "percentage": 10.6}
    ]
  }
}
```

---

### 5.21 Admin — `GET /api/v1/admin/users`

List all users (admin only).

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (admin role)         |
| **Phase**      | Phase 4                         |

**Query Parameters:**

| Param       | Type    | Default | Validation                     |
| ----------- | ------- | ------- | ------------------------------ |
| `page`      | integer | 1       | ≥ 1                            |
| `per_page`  | integer | 20      | 1–100                          |
| `q`         | string  | —       | Search email or username       |
| `role`      | string  | —       | `user`, `admin`                |
| `is_active` | boolean | —       | Filter by active status        |

**Success Response:** `200 OK` — paginated user list.

**Error Responses:**

| Status | Code                          | When                              |
| ------ | ----------------------------- | --------------------------------- |
| 403    | `FORBIDDEN_ADMIN_ONLY`        | Non-admin user                    |

---

### 5.22 Admin — `PUT /api/v1/admin/users/{id}/status`

Activate or deactivate a user account.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (admin role)         |
| **Phase**      | Phase 4                         |

**Request Body:**

```json
{
  "is_active": false,
  "reason": "Suspicious activity"
}
```

---

### 5.23 Admin — `GET /api/v1/admin/stats`

Get system-wide statistics (admin only).

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT (admin role)         |
| **Phase**      | Phase 4                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "total_users": 256,
    "active_users_today": 42,
    "total_analyses": 3847,
    "analyses_today": 128,
    "avg_response_time_ms": 1520,
    "cache_hit_rate": 0.34,
    "models_loaded": 4,
    "system_uptime_hours": 168.5
  }
}
```

---

### 5.24 Feedback — `POST /api/v1/feedback/{analysis_id}`

Submit user feedback on an analysis result.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 4                         |

**Request Body:**

```json
{
  "rating": 4,
  "is_correct": true,
  "comment": "The detection was accurate."
}
```

| Field        | Type    | Required | Validation          |
| ------------ | ------- | -------- | ------------------- |
| `rating`     | integer | No       | 1–5                 |
| `is_correct` | boolean | No       |                     |
| `comment`    | string  | No       | Max 1000 chars      |

---

### 5.25 Languages — `GET /api/v1/languages`

List all supported languages.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | None (public)                   |
| **Phase**      | Phase 1                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "languages": [
      {"code": "en", "name": "English", "detection": true, "sentiment": true, "translation": true},
      {"code": "hi", "name": "Hindi", "detection": true, "sentiment": true, "translation": true},
      {"code": "es", "name": "Spanish", "detection": true, "sentiment": true, "translation": true},
      {"code": "fr", "name": "French", "detection": true, "sentiment": true, "translation": true},
      {"code": "ar", "name": "Arabic", "detection": true, "sentiment": true, "translation": true}
    ]
  }
}
```

---

### 5.26 Models — `GET /api/v1/models`

List loaded AI models and their metadata.

| Property       | Value                           |
| -------------- | ------------------------------- |
| **Auth**       | Bearer JWT                      |
| **Phase**      | Phase 1                         |

**Success Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "name": "xlm-roberta-fakenews",
        "version": "1.0.0",
        "task": "detection",
        "framework": "onnx",
        "supported_languages": ["en", "hi", "es", "fr", "ar"],
        "metrics": {"f1_macro": 0.86, "accuracy": 0.87}
      }
    ]
  }
}
```

---

### 5.27 Health — `GET /health`

Shallow health check (no auth).

**Success Response:** `200 OK`

```json
{"status": "healthy", "version": "1.0.0"}
```

---

### 5.28 Health — `GET /health/ready`

Deep readiness check — verifies database, Redis, and model availability.

**Success Response:** `200 OK`

```json
{
  "status": "ready",
  "checks": {
    "database": {"status": "up", "latency_ms": 2},
    "redis": {"status": "up", "latency_ms": 1},
    "models": {"status": "loaded", "count": 4}
  }
}
```

**Failure Response:** `503 Service Unavailable`

---

## 6. Rate Limiting

| Endpoint Group | Limit                   | Window    | Scope   |
| -------------- | ----------------------- | --------- | ------- |
| Auth (register)| 5 requests              | 1 minute  | Per IP  |
| Auth (login)   | 10 requests             | 1 minute  | Per IP  |
| Analysis       | 30 requests             | 1 hour    | Per user|
| Translation    | 30 requests             | 1 hour    | Per user|
| Summarization  | 20 requests             | 1 hour    | Per user|
| Export         | 60 requests             | 1 hour    | Per user|
| General API    | 300 requests            | 1 hour    | Per user|

**Rate Limit Headers:**

```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 27
X-RateLimit-Reset: 1691928000
```

---

## 7. Status Codes Summary

| Code | Meaning                | Used For                                    |
| ---- | ---------------------- | ------------------------------------------- |
| 200  | OK                     | Successful GET, PUT, POST (with result)     |
| 201  | Created                | Successful resource creation (register)     |
| 204  | No Content             | Successful DELETE                           |
| 400  | Bad Request            | Validation errors                           |
| 401  | Unauthorized           | Missing or invalid JWT                      |
| 403  | Forbidden              | Insufficient permissions (RBAC)             |
| 404  | Not Found              | Resource doesn't exist                      |
| 409  | Conflict               | Duplicate resource (email, username)        |
| 422  | Unprocessable Entity   | Processing errors (OCR, scrape failures)    |
| 429  | Too Many Requests      | Rate limit exceeded                         |
| 500  | Internal Server Error  | Unexpected server error                     |
| 503  | Service Unavailable    | Health check failure                        |

---

## 8. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `01_ARCHITECTURE.md`         | Architecture these APIs expose                      |
| `04_DATABASE_DESIGN.md`      | Schema backing these endpoints                      |
| `06_AI_PIPELINE.md`          | AI models powering analysis endpoints               |
| `08_CODING_GUIDELINES.md`    | API naming and response conventions                 |
| `14_TESTING_STRATEGY.md`     | API test strategy                                   |
| `15_SECURITY_PLAN.md`        | Security controls on API layer                      |

---

## 9. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document is the contract between frontend and backend. Any endpoint change must be reflected here before implementation.*
