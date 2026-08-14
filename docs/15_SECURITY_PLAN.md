# 15 — Security Plan

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-15                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Threat Model (STRIDE)

| Threat                    | Risk Area                  | Mitigation                                              |
| ------------------------- | -------------------------- | ------------------------------------------------------- |
| **Spoofing**              | Authentication             | JWT with RS256/HS256; bcrypt password hashing            |
| **Tampering**             | Data integrity             | Input validation (Pydantic); parameterized SQL (ORM)    |
| **Repudiation**           | Audit trail                | Immutable audit_logs table; structured logging          |
| **Information Disclosure** | Data leakage              | No stack traces in responses; PII access controlled     |
| **Denial of Service**     | Availability               | Rate limiting; input size limits; resource quotas       |
| **Elevation of Privilege** | Authorization             | RBAC middleware; principle of least privilege            |

---

## 2. Authentication Security

| Control                       | Implementation                                           |
| ----------------------------- | -------------------------------------------------------- |
| Password hashing              | bcrypt (12 rounds) via `passlib`                         |
| Password policy               | Min 8 chars; 1 upper, 1 lower, 1 digit                  |
| Brute force protection        | 10 login attempts / min / IP; lockout after 5 failures   |
| JWT algorithm                 | HS256 (symmetric) for v1; RS256 (asymmetric) recommended for prod |
| Access token lifetime         | 15 minutes                                               |
| Refresh token lifetime        | 7 days                                                   |
| Refresh token storage         | HttpOnly, Secure, SameSite=Strict cookie                |
| Refresh token rotation        | New refresh token issued on each refresh; old one revoked|
| Token revocation              | Refresh token blacklist in Redis                        |

---

## 3. Authorization

| Resource                | Guest | User  | Admin |
| ----------------------- | ----- | ----- | ----- |
| `GET /health`           | ✅    | ✅    | ✅    |
| `GET /api/v1/languages` | ✅    | ✅    | ✅    |
| `POST /api/v1/auth/*`   | ✅    | ✅    | ✅    |
| `POST /api/v1/analyze/*`| ❌    | ✅    | ✅    |
| `GET /api/v1/history`   | ❌    | ✅ own| ✅ all|
| `GET /api/v1/analytics` | ❌    | ✅ own| ✅ all|
| `GET /api/v1/admin/*`   | ❌    | ❌    | ✅    |

---

## 4. Input Validation & Sanitization

| Input Type           | Validation                                                  |
| -------------------- | ----------------------------------------------------------- |
| Text input           | Min 20, max 50,000 chars; Unicode NFKC normalized           |
| URL input            | Valid HTTP/HTTPS; blocklist for SSRF targets                |
| Image upload         | JPEG/PNG/WebP only; max 10 MB; file header validation       |
| Email                | RFC 5322 regex; max 255 chars; lowercase before storage     |
| Username             | Alphanumeric + underscore; 3–50 chars                       |
| Password             | 8–128 chars; complexity requirements                         |
| Query params         | Type-validated via Pydantic; bounded ranges                 |
| Path params          | UUID format validated                                        |
| JSON bodies          | Strict Pydantic models; no extra fields allowed             |

### 4.1 SSRF Protection

Blocklisted targets for URL analysis:
- `localhost`, `127.0.0.1`, `::1`
- Private IP ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Link-local: `169.254.0.0/16`
- Cloud metadata endpoints: `169.254.169.254`

---

## 5. Transport Security

| Control                  | Implementation                                          |
| ------------------------ | ------------------------------------------------------- |
| HTTPS                    | TLS 1.2+ enforced; free cert via Let's Encrypt / cloud  |
| HSTS                     | `Strict-Transport-Security: max-age=31536000`           |
| Database connection      | SSL required in production (`sslmode=require`)          |
| Redis connection         | TLS required for Upstash                                |

---

## 6. HTTP Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://api.veritasai.dev
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 7. Data Protection

| Data Type              | At Rest                          | In Transit    | Access Control        |
| ---------------------- | -------------------------------- | ------------- | --------------------- |
| Passwords              | bcrypt hash (never plaintext)    | HTTPS         | Never returned in API |
| Refresh tokens         | SHA-256 hash                     | HttpOnly cookie| Owner only           |
| API keys               | SHA-256 hash (prefix visible)    | HTTPS         | Owner only            |
| User email/PII         | Plaintext in DB                  | HTTPS         | Owner + admin         |
| Analysis results       | Plaintext in DB + JSONB          | HTTPS         | Owner + admin         |
| Audit logs             | Plaintext in DB                  | HTTPS         | Admin only            |

---

## 8. CORS Configuration

```python
# Production CORS (conceptual)
CORSMiddleware(
    allow_origins=["https://veritasai.dev"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    max_age=600,
)
```

- **No wildcards** (`*`) in production
- Credentials allowed (for HttpOnly cookies)
- Only the frontend origin whitelisted

---

## 9. Rate Limiting

| Endpoint Group   | Limit              | Window    | Penalty          |
| ---------------- | ------------------ | --------- | ---------------- |
| Login            | 10 req             | 1 min     | 429 + retry-after|
| Register         | 5 req              | 1 min     | 429 + retry-after|
| Analysis         | 30 req             | 1 hour    | 429 + retry-after|
| General API      | 300 req            | 1 hour    | 429 + retry-after|

Implementation: Redis-backed token bucket algorithm per user (or per IP for unauthenticated routes).

---

## 10. Dependency Security

| Check                      | Tool              | Frequency     | Enforcement     |
| -------------------------- | ----------------- | ------------- | --------------- |
| Python vulnerabilities     | `pip-audit`       | Every CI run  | Fail on Critical|
| Node.js vulnerabilities    | `npm audit`       | Every CI run  | Fail on Critical|
| Container vulnerabilities  | `docker scout`    | Weekly        | Report          |
| License compliance         | `pip-licenses`    | Monthly       | Report          |

---

## 11. Secrets Management

| Secret                    | Storage                          | Never Do                     |
| ------------------------- | -------------------------------- | ----------------------------- |
| Database credentials      | Environment variables            | Commit to Git                 |
| JWT secret key            | Environment variables            | Hardcode in source            |
| API keys (external)       | Environment variables            | Log in plaintext              |
| Redis password            | Environment variables            | Include in Docker image       |

**`.env` file:** Listed in `.gitignore`; `.env.example` committed with placeholder values.

---

## 12. Security Testing

| Test                       | Tool              | Frequency     | Target                  |
| -------------------------- | ----------------- | ------------- | ----------------------- |
| OWASP ZAP scan             | OWASP ZAP         | Pre-release   | 0 Critical, 0 High     |
| SQL injection testing      | Manual + ZAP      | Pre-release   | 0 findings              |
| XSS testing                | Manual + ZAP      | Pre-release   | 0 findings              |
| Auth penetration testing   | Manual             | Pre-release   | No bypass possible      |
| Dependency audit           | pip-audit, npm audit | Every CI run| 0 Critical              |
| Secret scanning            | git-secrets / trufflehog | Pre-commit | 0 leaked secrets   |

---

## 13. Incident Response

| Severity   | Response Time | Action                                                 |
| ---------- | ------------- | ------------------------------------------------------ |
| Critical   | Immediate     | Take service offline; fix; redeploy; notify stakeholders|
| High       | 24 hours      | Patch; redeploy; document in risk analysis             |
| Medium     | 1 week        | Schedule fix in next sprint                             |
| Low        | Backlog       | Log and schedule                                        |

---

## 14. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This document defines all security controls for VeritasAI. All developers must follow these guidelines. Security issues take priority over feature work.*
