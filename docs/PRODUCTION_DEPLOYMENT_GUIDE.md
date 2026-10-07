# Production Deployment Guide — VeritasAI

This guide provides end-to-end instructions for deploying **VeritasAI** to production with high availability, security hardening, automated database migrations, and SSL/TLS encryption.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │          Internet / Clients            │
                      └──────────────────┬─────────────────────┘
                                         │ HTTPS (:443) / HTTP (:80)
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     Nginx Gateway & Reverse Proxy      │
                      │  - Rate Limiting (20 req/s, 40 burst)  │
                      │  - SSL/TLS Termination                 │
                      │  - Gzip Compression                    │
                      │  - 25MB OCR Image Upload Buffer        │
                      └────────────┬──────────────┬────────────┘
                                   │              │
                   /api/*, /health │              │ /* (SPA)
                                   ▼              ▼
           ┌─────────────────────────────┐  ┌─────────────────────────────┐
           │      Backend API            │  │     Frontend Web App        │
           │  (FastAPI + Gunicorn        │  │  (Vite React 19 SPA        │
           │   + 2 Uvicorn Workers)      │  │   served via Nginx)         │
           └──────┬───────────────┬──────┘  └─────────────────────────────┘
                  │               │
                  ▼               ▼
         ┌────────────────┐ ┌────────────────┐
         │ PostgreSQL 16  │ │    Redis 7     │
         │ (Metadata/DB)  │ │ (Rate Limits & │
         │                │ │  Translations) │
         └────────────────┘ └────────────────┘
```

---

## Deployment Option A: Self-Hosted VPS / Cloud Server (Recommended)

Best for single-server production deployment (AWS EC2, DigitalOcean, Hetzner, Linode, GCP Compute Engine).

### 1. Server Prerequisites
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS (or Debian 12)
- **RAM**: Minimum 4GB RAM (8GB recommended for XLM-RoBERTa inference)
- **Disk**: 20GB+ SSD
- **Software**: Docker & Docker Compose v2 (`docker compose`)

Install Docker on Ubuntu:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

---

### 2. Clone the Repository & Configure Environment

```bash
git clone https://github.com/vikasyadav1307/VeritasAi.git
cd VeritasAi

# Copy production environment configuration template
cp .env.production.example .env
```

Generate secure 64-character random secrets for production:
```bash
openssl rand -hex 32
```

Edit `.env` using `nano .env` and replace:
1. `APP_SECRET_KEY`: Set to generated 64-hex string.
2. `JWT_SECRET_KEY`: Set to a separate generated 64-hex string.
3. `POSTGRES_PASSWORD`: Strong password (e.g. `openssl rand -hex 16`).
4. `CORS_ORIGINS`: Set to your production domain(s), e.g.:
   ```env
   CORS_ORIGINS=https://veritasai.yourdomain.com,http://localhost
   ```
5. `VITE_API_BASE_URL`: Leave empty when behind Nginx gateway (uses same origin).

---

### 3. Ensure Model Weights are in Place
Ensure model weights exist in `./models`:
```bash
ls -la models/fake_news_model
ls -la models/sentiment_model
```
Both folders should contain `model.safetensors`, `config.json`, and `tokenizer.json`.
*(If weights are not present, VeritasAI runs in safe fallback mock mode).*

---

### 4. Deploy with One Command

Using the automated deployment script:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Or using Docker Compose directly:
```bash
# Build production images
docker compose -f docker-compose.prod.yml build

# Start services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Verify all services are running and healthy
docker compose -f docker-compose.prod.yml ps
```

---

### 5. Automated Database Migrations

The backend container automatically applies Alembic migrations on startup via `backend/docker-entrypoint.sh`:
```bash
# To manually run migrations or check history:
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

### 6. SSL / HTTPS Configuration (Let's Encrypt / Certbot)

To secure your production domain with free SSL:

1. Point your domain DNS `A` record (e.g. `veritasai.yourdomain.com`) to your server's public IP.
2. Install Certbot on the host:
   ```bash
   sudo apt-get install -y certbot
   ```
3. Generate the certificates (temporarily stop Nginx container if port 80 is occupied):
   ```bash
   docker compose -f docker-compose.prod.yml stop nginx
   sudo certbot certonly --standalone -d veritasai.yourdomain.com
   ```
4. Copy or link certificates to `./docker/nginx/certs`:
   ```bash
   mkdir -p docker/nginx/certs
   sudo cp /etc/letsencrypt/live/veritasai.yourdomain.com/fullchain.pem docker/nginx/certs/
   sudo cp /etc/letsencrypt/live/veritasai.yourdomain.com/privkey.pem docker/nginx/certs/
   sudo chmod 644 docker/nginx/certs/*
   ```
5. Enable SSL in Nginx:
   ```bash
   cp docker/nginx/nginx.ssl.conf.template docker/nginx/nginx.conf
   sed -i 's/YOUR_DOMAIN.com/veritasai.yourdomain.com/g' docker/nginx/nginx.conf
   docker compose -f docker-compose.prod.yml up -d nginx
   ```
6. Setup auto-renewal cronjob:
   ```bash
   echo "0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/veritasai.yourdomain.com/*.pem /path/to/VeritasAi/docker/nginx/certs/ && docker compose -f /path/to/VeritasAi/docker-compose.prod.yml restart nginx" | sudo crontab -
   ```

---

## Deployment Option B: Split Cloud Deployment (PaaS)

For serverless / managed cloud hosting:

### 1. Managed Database & Cache
- **PostgreSQL**: Create a managed database on [Supabase](https://supabase.com) or [Neon](https://neon.tech). Copy the `postgresql+asyncpg://...` connection string.
- **Redis**: Create a free serverless Redis database on [Upstash](https://upstash.com).

### 2. Backend on Render / Railway / Fly.io
1. Connect your GitHub repository to [Render](https://render.com) or [Railway](https://railway.app).
2. Choose **Docker** environment pointing to `backend/Dockerfile`.
3. Set environment variables in the dashboard:
   - `APP_ENV=production`
   - `APP_DEBUG=false`
   - `APP_SECRET_KEY=<your-secret>`
   - `JWT_SECRET_KEY=<your-secret>`
   - `DATABASE_URL=postgresql+asyncpg://<supabase-user>:<supabase-password>@<host>:5432/<dbname>`
   - `REDIS_URL=redis://<upstash-host>:<port>`
   - `RATE_LIMIT_ENABLED=true`
   - `CORS_ORIGINS=https://your-frontend.vercel.app`
4. Deploy and verify health endpoint: `https://your-backend.onrender.com/health/ready`.

### 3. Frontend on Vercel / Netlify
1. Connect your repository to [Vercel](https://vercel.com).
2. Set root directory to `frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set environment variable:
   - `VITE_API_BASE_URL=https://your-backend.onrender.com`
6. Deploy.

---

## Operations & Maintenance

### Checking Logs
```bash
# View backend logs (JSON structured)
docker compose -f docker-compose.prod.yml logs -f backend

# View Nginx access & error logs
docker compose -f docker-compose.prod.yml logs -f nginx
```

### Health & Readiness Probes
```bash
# Shallow health check (process alive)
curl http://localhost/health

# Deep readiness check (verifies PostgreSQL and Redis connections)
curl http://localhost/health/ready
```

### Database Backups
```bash
# Create timestamped SQL dump
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U veritas veritasai > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from dump
docker compose -f docker-compose.prod.yml exec -T postgres psql -U veritas -d veritasai < backup.sql
```

### Stopping or Updating Services
```bash
# Zero-downtime rolling update
git pull origin master
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d --no-deps backend frontend

# Stop services cleanly
docker compose -f docker-compose.prod.yml down
```
