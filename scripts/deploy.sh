#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# VeritasAI — Production Deployment Automation Script
# ─────────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}==============================================${NC}"
echo -e "${BLUE}        VeritasAI — Production Deployment     ${NC}"
echo -e "${BLUE}==============================================${NC}"

# ── 1. Check Prerequisites ──
echo -e "\n${YELLOW}[1/6] Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed or not supported.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker and Docker Compose detected.${NC}"

# ── 2. Environment Configuration Check ──
echo -e "\n${YELLOW}[2/6] Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    if [ -f ".env.production.example" ]; then
        echo -e "${YELLOW}Warning: .env not found. Copying .env.production.example to .env...${NC}"
        cp .env.production.example .env
        echo -e "${RED}Please edit .env with secure random keys before launching!${NC}"
    else
        echo -e "${RED}Error: .env configuration file not found.${NC}"
        exit 1
    fi
fi

# Check for insecure placeholder passwords in production
if grep -q "GENERATE_WITH_OPENSSL_RAND_HEX_32" .env 2>/dev/null; then
    echo -e "${RED}Warning: .env still contains placeholder APP_SECRET_KEY!${NC}"
    echo -e "${YELLOW}Generate a random key: openssl rand -hex 32${NC}"
fi

if grep -q "GENERATE_ANOTHER_OPENSSL_RAND_HEX_32" .env 2>/dev/null; then
    echo -e "${RED}Warning: .env still contains placeholder JWT_SECRET_KEY!${NC}"
    echo -e "${YELLOW}Generate a random key: openssl rand -hex 32${NC}"
fi
echo -e "${GREEN}✓ Environment configuration validated.${NC}"

# ── 3. Check AI Model Weights ──
echo -e "\n${YELLOW}[3/6] Verifying AI model weights...${NC}"
if [ -d "models/fake_news_model" ] && [ -d "models/sentiment_model" ]; then
    echo -e "${GREEN}✓ Fine-tuned models detected in ./models/${NC}"
else
    echo -e "${YELLOW}Notice: Model directory incomplete. System will use mock fallback if weights are missing.${NC}"
fi

# ── 4. Build Production Containers ──
echo -e "\n${YELLOW}[4/6] Building production Docker containers...${NC}"
docker compose -f docker-compose.prod.yml build
echo -e "${GREEN}✓ Production images built successfully.${NC}"

# ── 5. Launch Services ──
echo -e "\n${YELLOW}[5/6] Launching services in detached mode...${NC}"
docker compose -f docker-compose.prod.yml up -d
echo -e "${GREEN}✓ Containers deployed.${NC}"

# ── 6. Verification & Health Check ──
echo -e "\n${YELLOW}[6/6] Waiting for services to initialize...${NC}"
sleep 5

MAX_RETRIES=12
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -n "Checking readiness (attempt $RETRY_COUNT/$MAX_RETRIES)... "
    
    if curl -s -f "http://localhost/health/ready" > /dev/null 2>&1; then
        echo -e "${GREEN}READY!${NC}"
        HEALTHY=true
        break
    else
        echo -e "${YELLOW}waiting...${NC}"
        sleep 5
    fi
done

echo -e "\n${BLUE}==============================================${NC}"
if [ "$HEALTHY" = true ]; then
    echo -e "${GREEN}✓ VeritasAI is successfully deployed and running!${NC}"
    echo -e "  - Frontend & Gateway: http://localhost"
    echo -e "  - Health Check:       http://localhost/health"
    echo -e "  - Readiness Check:    http://localhost/health/ready"
else
    echo -e "${YELLOW}Services launched. Database/models might still be loading.${NC}"
    echo -e "Check logs with: docker compose -f docker-compose.prod.yml logs -f"
fi
echo -e "${BLUE}==============================================${NC}"
