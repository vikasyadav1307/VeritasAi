# ──────────────────────────────────────────────
# VeritasAI — Makefile
# Common commands for development
# ──────────────────────────────────────────────

.PHONY: help dev down build test lint format clean logs

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ──

dev: ## Start all services in development mode
	docker-compose up --build

down: ## Stop all services
	docker-compose down

build: ## Build all Docker images
	docker-compose build

logs: ## Tail logs from all services
	docker-compose logs -f

# ── Backend ──

backend-shell: ## Open a shell in the backend container
	docker-compose exec backend bash

backend-test: ## Run backend tests
	cd backend && python -m pytest tests/ -v

backend-lint: ## Lint backend code
	cd backend && python -m ruff check app/ tests/

backend-format: ## Format backend code
	cd backend && python -m ruff format app/ tests/

backend-typecheck: ## Type-check backend code
	cd backend && python -m mypy app/

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

seed-dev: ## Seed development data
	docker-compose exec backend python -m scripts.seed_dev

# ── Frontend ──

frontend-test: ## Run frontend tests
	cd frontend && npx vitest run

frontend-lint: ## Lint frontend code
	cd frontend && npx eslint src/

frontend-build: ## Build frontend for production
	cd frontend && npm run build

# ── Combined ──

test: backend-test frontend-test ## Run all tests

lint: backend-lint frontend-lint ## Lint all code

clean: ## Remove all containers, volumes, and build artifacts
	docker-compose down -v --remove-orphans
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache
	rm -rf frontend/dist frontend/node_modules/.vite
