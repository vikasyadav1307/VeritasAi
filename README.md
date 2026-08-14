# VeritasAI

> Multilingual Fake News Detection and Sentiment Analysis using Transformer-Based NLP

[![CI](https://github.com/vikas/veritasai/actions/workflows/ci.yml/badge.svg)](https://github.com/vikas/veritasai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

VeritasAI is an AI-powered web application that detects fake news across multiple languages, performs sentiment analysis, and explains every prediction with human-readable reasoning.

### Key Features

- 🔍 **Fake News Detection** — Multilingual classification (5+ languages)
- 💬 **Sentiment Analysis** — Positive, negative, neutral classification
- 🧠 **Explainable AI** — LIME-based feature importance highlighting
- 🌐 **Multi-input** — Text, URL scraping, image OCR
- 🔐 **Authentication** — JWT-based auth with role-based access
- 📊 **Analytics** — Dashboard with trends and statistics
- 🐳 **Dockerized** — One-command local deployment

## Tech Stack

| Layer      | Technologies                                              |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 18, TypeScript, Vite 5, Zustand, TanStack Query    |
| Backend    | FastAPI, Python 3.11+, SQLAlchemy 2, Pydantic V2         |
| AI/ML      | PyTorch, HuggingFace Transformers, XLM-RoBERTa, ONNX     |
| Database   | PostgreSQL 16, Redis 7                                    |
| DevOps     | Docker, GitHub Actions, Nginx                             |

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (v25+)
- [Git](https://git-scm.com/) (v2.40+)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/vikas/veritasai.git
cd veritasai

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Open the application
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000
#    API Docs:  http://localhost:8000/docs
```

### Development (without Docker)

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
veritasai/
├── backend/         # FastAPI backend (Python)
├── frontend/        # React SPA (TypeScript)
├── models/          # AI model weights
├── notebooks/       # Training notebooks
├── e2e/             # E2E tests (Playwright)
├── docs/            # Project documentation
├── docker/          # Docker configs
└── .github/         # CI/CD workflows
```

## Documentation

Full documentation is available in the [`docs/`](docs/) directory:

- [Project Vision](docs/00_PROJECT_VISION.md)
- [Architecture](docs/01_ARCHITECTURE.md)
- [Tech Stack](docs/02_TECH_STACK.md)
- [Development Roadmap](docs/03_DEVELOPMENT_ROADMAP.md)
- [API Specification](docs/05_API_SPECIFICATION.md)
- [AI Pipeline](docs/06_AI_PIPELINE.md)

## Available Commands

```bash
make help              # Show all available commands
make dev               # Start development environment
make test              # Run all tests
make lint              # Lint all code
make down              # Stop all services
```

## License

This project is developed as a Final Year Project for academic purposes.

---

*Built with ❤️ by Vikas*
