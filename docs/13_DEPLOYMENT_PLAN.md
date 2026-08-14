# 13 — Deployment Plan

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-13                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Deployment Architecture

### 1.1 Environment Matrix

| Environment  | Purpose              | Backend         | Frontend     | Database          | Redis        | URL Pattern                       |
| ------------ | -------------------- | --------------- | ------------ | ----------------- | ------------ | --------------------------------- |
| **Local**    | Development          | Docker (8000)   | Vite (3000)  | Docker (5432)     | Docker (6379)| `localhost:3000`                  |
| **CI**       | Automated testing    | GitHub Actions  | GitHub Actions| SQLite (in-memory)| Mock         | N/A                               |
| **Staging**  | Pre-production       | Render (free)   | Vercel       | Supabase (free)   | Upstash (free)| `staging.veritasai.dev`          |
| **Production** | Live demo          | Render (free)   | Vercel       | Supabase (free)   | Upstash (free)| `veritasai.dev`                  |

### 1.2 Container Topology (Local)

```
docker-compose.yml
├── nginx         (port 80)       ── Reverse proxy, SSL termination
├── backend       (port 8000)     ── FastAPI + Uvicorn
├── frontend      (port 3000)     ── Vite dev server (dev) / Nginx (prod)
├── postgres      (port 5432)     ── PostgreSQL 16
├── redis         (port 6379)     ── Redis 7
└── worker        (none)          ── Celery worker (optional)
```

---

## 2. Local Development Setup

### 2.1 Prerequisites

| Tool            | Version  | Purpose                               |
| --------------- | -------- | ------------------------------------- |
| Docker Desktop  | 25+      | Container runtime                     |
| Docker Compose  | 2.x      | Multi-container orchestration         |
| Node.js         | 18+      | Frontend development                  |
| Python          | 3.11+    | Backend development                   |
| Git             | 2.40+    | Version control                       |

### 2.2 Quick Start

```bash
# 1. Clone repository
git clone https://github.com/vikas/veritasai.git
cd veritasai

# 2. Copy environment files
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Seed development data
docker-compose exec backend python -m scripts.seed_dev

# 6. Access the application
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000
#    API Docs:  http://localhost:8000/docs
```

### 2.3 Environment Variables

```bash
# ──── Application ────
APP_ENV=development          # development | staging | production
APP_DEBUG=true
APP_SECRET_KEY=<random-64-char-string>
APP_VERSION=0.1.0

# ──── Database ────
DATABASE_URL=postgresql+asyncpg://veritas:veritas@postgres:5432/veritasai
DATABASE_ECHO=false

# ──── Redis ────
REDIS_URL=redis://redis:6379/0

# ──── JWT ────
JWT_SECRET_KEY=<random-64-char-string>
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# ──── CORS ────
CORS_ORIGINS=http://localhost:3000

# ──── AI Models ────
MODEL_DIR=./models
MODEL_DEVICE=cpu
MODEL_LAZY_LOAD=true

# ──── OCR ────
TESSERACT_CMD=/usr/bin/tesseract

# ──── Rate Limiting ────
RATE_LIMIT_ENABLED=false     # Disabled in dev

# ──── Logging ────
LOG_LEVEL=DEBUG
LOG_FORMAT=console           # console | json
```

---

## 3. Docker Configuration

### 3.1 Backend Dockerfile

```dockerfile
# Key stages (conceptual, not implementation)
# 1. Base: python:3.11-slim
# 2. System deps: tesseract-ocr, tesseract-ocr-hin, libpq-dev
# 3. Python deps: pip install from pyproject.toml
# 4. Copy source code
# 5. Expose port 8000
# 6. CMD: gunicorn with uvicorn workers
```

**Key considerations:**
- Multi-stage build to reduce image size
- Non-root user for security
- `.dockerignore` to exclude models, tests, docs
- Health check: `CMD curl -f http://localhost:8000/health`

### 3.2 Frontend Dockerfile

```dockerfile
# Key stages (conceptual)
# 1. Build: node:18-alpine, npm ci, npm run build
# 2. Serve: nginx:alpine, copy build output to /usr/share/nginx/html
# 3. Copy nginx.conf for SPA routing
```

### 3.3 Docker Compose Profiles

| Profile      | Services Started                                    | Use Case           |
| ------------ | --------------------------------------------------- | ------------------- |
| `default`    | backend, frontend, postgres, redis                 | Standard dev        |
| `full`       | All + nginx + worker                               | Full production sim |
| `backend`    | backend, postgres, redis                           | API-only dev        |
| `infra`      | postgres, redis                                    | External tooling    |

---

## 4. Cloud Deployment

### 4.1 Backend — Render

| Setting              | Value                                          |
| -------------------- | ---------------------------------------------- |
| Service type         | Web Service                                    |
| Runtime              | Docker                                         |
| Region               | Oregon (US West) or Frankfurt (EU)             |
| Plan                 | Free (750 hours/month)                         |
| Health check path    | `/health`                                      |
| Auto-deploy          | On push to `main` branch                       |
| Build command        | Docker build from `backend/Dockerfile`         |
| Start command        | `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker` |

**Free tier limitations:**
- Spins down after 15 min of inactivity (cold start ~30s)
- 512 MB RAM
- Shared CPU

**Mitigation:** Use a health check ping service (UptimeRobot) to keep alive during demo windows.

### 4.2 Frontend — Vercel

| Setting              | Value                                          |
| -------------------- | ---------------------------------------------- |
| Framework preset     | Vite                                           |
| Build command        | `npm run build`                                |
| Output directory     | `dist`                                         |
| Node version         | 18                                             |
| Auto-deploy          | On push to `main` branch                       |
| Environment vars     | `VITE_API_BASE_URL=https://api.veritasai.dev`  |

### 4.3 Database — Supabase

| Setting              | Value                                          |
| -------------------- | ---------------------------------------------- |
| Plan                 | Free                                           |
| Region               | Closest to Render region                       |
| Storage              | 500 MB                                         |
| Connection string    | Provided by Supabase dashboard                 |
| SSL                  | Required (sslmode=require)                     |
| Connection pooling   | Use Supabase connection pooler (port 6543)     |

### 4.4 Redis — Upstash

| Setting              | Value                                          |
| -------------------- | ---------------------------------------------- |
| Plan                 | Free                                           |
| Max commands/day     | 10,000                                         |
| Max storage          | 256 MB                                         |
| TLS                  | Required                                       |
| Region               | Closest to Render region                       |

### 4.5 Model Hosting

| Option                    | Pros                                  | Cons                                |
| ------------------------- | ------------------------------------- | ----------------------------------- |
| Bundle in Docker image    | Simple; no external deps              | Large image (~2 GB); slow deploy    |
| Hugging Face Hub (download on start) | Small image; version control | Cold start latency; network dep    |
| Cloud storage (S3/GCS)    | Fast download; versioned              | Needs credentials; slight latency  |

**Chosen approach:** Bundle quantized ONNX models in the Docker image for reliability. Total model size after INT8 quantization: ~500 MB.

---

## 5. CI/CD Pipeline

### 5.1 GitHub Actions Workflow

```
Push to main / PR
       │
       ▼
┌──────────────────┐
│   Lint & Format  │  Ruff (Python) + ESLint (TS)
└──────┬───────────┘
       ▼
┌──────────────────┐
│   Type Check     │  mypy (Python) + tsc (TS)
└──────┬───────────┘
       ▼
┌──────────────────┐
│   Unit Tests     │  pytest + vitest
└──────┬───────────┘
       ▼
┌──────────────────┐
│   Build          │  Docker build (backend + frontend)
└──────┬───────────┘
       ▼ (main branch only)
┌──────────────────┐
│   Deploy         │  Render auto-deploy + Vercel auto-deploy
└──────────────────┘
```

### 5.2 CI Jobs

| Job             | Trigger       | Runtime   | Timeout |
| --------------- | ------------- | --------- | ------- |
| `lint`          | Push, PR      | 2 min     | 5 min   |
| `type-check`    | Push, PR      | 3 min     | 5 min   |
| `test-backend`  | Push, PR      | 5 min     | 10 min  |
| `test-frontend` | Push, PR      | 3 min     | 10 min  |
| `build-docker`  | Push to main  | 10 min    | 15 min  |
| `e2e` (opt)     | Push to main  | 10 min    | 15 min  |

---

## 6. Deployment Checklist

### 6.1 Pre-Deployment

- [ ] All CI checks pass
- [ ] No critical or high security findings
- [ ] Database migrations reviewed
- [ ] Environment variables configured in cloud dashboard
- [ ] Models uploaded / bundled
- [ ] Health endpoint verified

### 6.2 Deployment

- [ ] Push to `main` branch
- [ ] Verify Render build succeeds
- [ ] Verify Vercel build succeeds
- [ ] Run database migrations on production
- [ ] Seed demo data (if first deploy)
- [ ] Smoke test all critical endpoints

### 6.3 Post-Deployment

- [ ] Verify health endpoint returns 200
- [ ] Verify login flow works
- [ ] Verify analysis flow works end-to-end
- [ ] Check error rates in logs
- [ ] Monitor response times
- [ ] Update `12_CHANGELOG.md`

---

## 7. Rollback Strategy

| Scenario                  | Action                                              |
| ------------------------- | --------------------------------------------------- |
| Backend deploy fails      | Render auto-rolls back to previous deploy           |
| Frontend deploy fails     | Vercel auto-rolls back; or manually revert commit   |
| Database migration fails  | Run `alembic downgrade -1`; fix and retry           |
| Model fails in production | Swap to fallback model via env var; restart service |

---

## 8. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This document defines how VeritasAI is deployed across all environments. Follow the checklists for every deployment.*
