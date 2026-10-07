#!/bin/sh
set -e

# Run database migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Checking database connectivity & applying migrations..."
    alembic upgrade head || {
        echo "Warning: Database migrations could not be applied immediately. Continuing startup..."
    }
fi

PORT="${PORT:-8000}"
WORKERS="${WEB_CONCURRENCY:-1}"

# If no arguments passed or gunicorn is requested, start with dynamic PORT & WORKERS
if [ $# -eq 0 ] || [ "$1" = "gunicorn" ]; then
    echo "Starting Gunicorn on port $PORT with $WORKERS worker(s)..."
    exec gunicorn app.main:app \
        --worker-class uvicorn.workers.UvicornWorker \
        --workers "$WORKERS" \
        --bind "0.0.0.0:$PORT" \
        --timeout 120 \
        --access-logfile - \
        --error-logfile -
fi

echo "Executing custom command: $@"
exec "$@"
