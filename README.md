# VeritasAI

> **Multilingual Fake News Detection and Sentiment Analysis using Transformer-Based NLP**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB.svg?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2+-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)

---

## Overview

**VeritasAI** is an advanced AI-powered web platform designed to analyze textual content for misinformation and emotional tone. Built upon fine-tuned cross-lingual transformer architectures (**XLM-RoBERTa**), VeritasAI provides unified credibility scoring (Fake vs. Real) alongside sentiment classification (Positive, Negative, Neutral) through an interactive web interface.

---

## Project Status

### Current Phase: Phase 2 — Frontend Integration & Verification (Sprint 4 Completed)

| Feature | Status | Details |
|---------|--------|---------|
| **XLM-R Fake News Classifier** | **COMPLETED** | Fine-tuned XLM-RoBERTa (98.39% accuracy, 98.39% F1) |
| **XLM-R Sentiment Classifier** | **COMPLETED** | Fine-tuned XLM-RoBERTa (97.95% accuracy, 97.94% F1) |
| **FastAPI Analysis API** | **COMPLETED** | `POST /api/v1/analyze/text` with Pydantic V2 validation & timing telemetry |
| **Backend Health Checks** | **COMPLETED** | `GET /health` and `GET /health/ready` (PostgreSQL + Redis readiness) |
| **Interactive Analyze Page** | **COMPLETED** | React SPA with validation (10–50k chars), live counters, loading states, and result cards |
| **End-to-End Pipeline** | **COMPLETED** | Browser (`:5173`) → FastAPI (`:8000`) → XLM-R models → Live response verified |
| **CORS & Dev Host Alignment** | **COMPLETED** | Dual origin support (`localhost` & `127.0.0.1` on ports 3000 and 5173) |
| **URL Analysis** | **PLANNED** | Web scraping pipeline for automated article extraction |
| **Image Analysis / OCR** | **PLANNED** | Tesseract OCR integration for infographic analysis |
| **Explainable AI (XAI)** | **PLANNED** | LIME / token-level feature attribution highlighting |
| **User Authentication** | **PLANNED** | JWT authentication with refresh tokens and user history |
| **ONNX Runtime Optimization** | **PLANNED** | Sub-100ms model quantization and optimization |

---

## Technology Stack

| Component | Technologies |
|-----------|-------------|
| **Frontend** | React 19, TypeScript, Vite 8, Zustand, Lucide Icons, Vanilla CSS Design System |
| **Backend** | FastAPI, Python 3.11+, Pydantic V2, Structlog, Uvicorn |
| **AI / NLP** | PyTorch, HuggingFace Transformers, XLM-RoBERTa (`xlm-roberta-base`) |
| **Database & Cache** | PostgreSQL 16 (metadata/history), Redis 7 (caching/sessions) |
| **DevOps & Containers** | Docker, Docker Compose |

---

## Project Structure

```
aiproject/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Application lifecycle, base settings
│   │   ├── infrastructure/   # Database (SQLAlchemy) & Redis cache clients
│   │   ├── middleware/       # CORS, request ID, security headers, error handling
│   │   └── modules/
│   │       ├── analysis/     # Unified analysis router & service
│   │       ├── detection/    # XLM-RoBERTa fake news model wrapper
│   │       └── sentiment/    # XLM-RoBERTa sentiment model wrapper
│   └── tests/                # Integration & unit test suite
├── frontend/                 # React 19 + TypeScript SPA (Vite)
│   ├── src/
│   │   ├── features/
│   │   │   ├── analyze/      # Text analysis UI, character counter, result cards
│   │   │   ├── auth/         # Login & Register views (planned)
│   │   │   ├── dashboard/    # Trends & metrics overview (planned)
│   │   │   └── history/      # Analysis history (planned)
│   │   ├── services/         # Axios API client & endpoints
│   │   └── styles/           # CSS design tokens & global variables
│   └── vite.config.ts        # Vite configuration & dev proxy
├── models/                   # Fine-tuned Model Directory
│   ├── fake_news_model/      # Config, tokenizer, and metrics (weights excluded from Git)
│   └── sentiment_model/      # Config, tokenizer, and metrics (weights excluded from Git)
├── notebooks/                # Google Colab training scripts
├── datasets/                 # Training and validation dataset splits
├── docs/                     # Full system documentation (ADRs, roadmap, progress logs)
├── docker-compose.yml        # Multi-container orchestration (Postgres, Redis, Backend, Frontend)
└── .env.example              # Environment variables template
```

---

## Quick Start & Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vikasyadav1307/VeritasAi.git
cd VeritasAi
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env
```

Default settings connect to `http://127.0.0.1:8000` (FastAPI) and `http://127.0.0.1:5173` (Vite).

---

### 3. Infrastructure (PostgreSQL & Redis)

PostgreSQL and Redis are required for health checks and session persistence. Run them using Docker Compose:

```bash
docker compose up -d postgres redis
```

Verify services are running:
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`

---

### 4. Model Setup

Model weight files (`model.safetensors`, ~1.1 GB each) are excluded from the Git repository to keep the codebase lightweight.

- Model configurations, tokenizers, and training evaluation results are tracked in:
  - `models/fake_news_model/`
  - `models/sentiment_model/`
- To generate or restore model weights:
  - Run the Colab training scripts provided in `notebooks/`:
    - `notebooks/03_train_fake_news.py`
    - `notebooks/04_train_sentiment.py`
  - Download the resulting `model.safetensors` files and place them into their respective directories under `models/`.
- **Note on Fallback:** If weight files are absent, the application gracefully initializes in mock fallback mode (`is_mock: true`) so frontend development can proceed without heavy weights.

---

### 5. Backend Startup (FastAPI)

```bash
# Activate virtual environment
# Windows:
.\.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# Start Uvicorn development server
python -m uvicorn app.main:app --reload --port 8000
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive API Docs (Swagger): `http://127.0.0.1:8000/docs`
- Health Readiness: `http://127.0.0.1:8000/health/ready`

---

### 6. Frontend Startup (React + Vite)

In a separate terminal:

```bash
cd frontend
npm install
npm run dev -- --port 5173
```

- Open: `http://127.0.0.1:5173/analyze`

---

## API Specification

### `POST /api/v1/analyze/text`

Analyzes input text for credibility and sentiment.

**Request:**
```json
{
  "text": "The Indian government announced a new public transportation initiative today...",
  "language": "en"
}
```

**Response (`200 OK`):**
```json
{
  "credibility": {
    "label": "Real",
    "confidence": 0.9998,
    "is_mock": false
  },
  "sentiment": {
    "label": "Positive",
    "confidence": 0.9745,
    "is_mock": false
  },
  "processing_time_ms": 142.5
}
```

---

## Current Limitations

- **Text Length Bounds:** Inputs must be between 10 and 50,000 characters.
- **CPU Inference:** Warm inference takes ~140–210 ms on an 8-core CPU. The initial cold start (first request loading 2.2 GB weights from disk into memory) takes ~15–20 seconds.
- **Input Modality:** Currently text analysis is operational. URL scraping and Image OCR tabs are disabled pending Phase 3.

---

## License

This project is developed as a Final Year Project for academic and research purposes under the MIT License.
