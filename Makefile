# ──────────────────────────────────────────────
# VeritasAI — Makefile
# Common commands for development
# ──────────────────────────────────────────────

.PHONY: help dev down build test lint format clean logs

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Docker ──

dev: ## Start all services in development mode
	docker compose up --build

down: ## Stop development services
	docker compose down

build: ## Build development Docker images
	docker compose build

logs: ## Tail development logs
	docker compose logs -f

# ── Production Docker ──

prod-build: ## Build production Docker images
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start all services in production mode
	docker compose -f docker-compose.prod.yml up -d

prod-down: ## Stop production services
	docker compose -f docker-compose.prod.yml down

prod-logs: ## Tail production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-status: ## Check health and status of production containers
	docker compose -f docker-compose.prod.yml ps

prod-health: ## Verify production readiness endpoint
	curl -f http://localhost/health/ready || echo "Readiness check failed"

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
