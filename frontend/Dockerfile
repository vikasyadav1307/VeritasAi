# ──────────────────────────────────────────────
# VeritasAI Frontend — Dockerfile
# Multi-stage build: Node build → Nginx serve
# ──────────────────────────────────────────────

# ── Stage 1: Build ──
FROM node:18-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# ── Stage 2: Serve ──
FROM nginx:alpine AS runtime

LABEL maintainer="Vikas" \
      description="VeritasAI Frontend SPA" \
      version="0.1.0"

# Copy build output
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
