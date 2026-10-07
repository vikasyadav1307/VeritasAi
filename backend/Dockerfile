# ──────────────────────────────────────────────
# VeritasAI Backend — Production Dockerfile
# Multi-stage build for minimal production image
# ──────────────────────────────────────────────

# ── Stage 1: Builder ──
FROM python:3.11-slim AS builder

WORKDIR /build

# Install system dependencies needed for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency specification
COPY pyproject.toml ./

# Install Python dependencies: CPU-only torch to keep image lean, plus all AI/OCR packages
ARG INSTALL_AI_DEPS=true
RUN pip install --no-cache-dir --upgrade pip setuptools wheel \
    && if [ "$INSTALL_AI_DEPS" = "true" ]; then \
         pip install --no-cache-dir torch==2.3.0 --index-url https://download.pytorch.org/whl/cpu \
         && pip install --no-cache-dir ".[ai]"; \
       else \
         pip install --no-cache-dir .; \
       fi


# ── Stage 2: Runtime ──
FROM python:3.11-slim AS runtime

LABEL maintainer="Vikas" \
      description="VeritasAI Backend API" \
      version="0.1.0"

# Install runtime system dependencies including Tesseract OCR language packs
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    tesseract-ocr \
    tesseract-ocr-hin \
    tesseract-ocr-spa \
    tesseract-ocr-fra \
    tesseract-ocr-ara \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 veritas \
    && useradd --uid 1000 --gid veritas --create-home veritas

WORKDIR /app

# Copy installed Python packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source, migrations config, and entrypoint
COPY app/ ./app/
COPY alembic.ini ./
COPY docker-entrypoint.sh ./

# Make entrypoint executable and set non-root permissions
RUN chmod +x docker-entrypoint.sh \
    && chown -R veritas:veritas /app

# Switch to non-root user
USER veritas

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command handled dynamically by entrypoint script (respects $PORT and $WEB_CONCURRENCY)
CMD ["gunicorn"]
