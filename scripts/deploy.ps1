# ─────────────────────────────────────────────────────────────
# VeritasAI — Production Deployment Script (PowerShell)
# ─────────────────────────────────────────────────────────────

$ErrorActionPreference = "Stop"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "       VeritasAI — Production Deployment      " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# ── 1. Check Prerequisites ──
Write-Host "`n[1/6] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Docker is not installed or not in PATH." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker detected." -ForegroundColor Green

# ── 2. Check Environment ──
Write-Host "`n[2/6] Checking environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.production.example") {
        Write-Host "Copying .env.production.example to .env..." -ForegroundColor Yellow
        Copy-Item ".env.production.example" ".env"
        Write-Host "Please review and customize .env before running in public production." -ForegroundColor Yellow
    } else {
        Write-Host "Error: .env configuration file not found." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Environment file verified." -ForegroundColor Green

# ── 3. Check AI Model Weights ──
Write-Host "`n[3/6] Verifying AI model weights..." -ForegroundColor Yellow
if ((Test-Path "models/fake_news_model") -and (Test-Path "models/sentiment_model")) {
    Write-Host "✓ Model directory found." -ForegroundColor Green
} else {
    Write-Host "Notice: Fine-tuned model weights not found in ./models/. Fallback mocks will be used." -ForegroundColor Yellow
}

# ── 4. Build Containers ──
Write-Host "`n[4/6] Building production Docker containers..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml build
Write-Host "✓ Containers built successfully." -ForegroundColor Green

# ── 5. Start Containers ──
Write-Host "`n[5/6] Launching services in detached mode..." -ForegroundColor Yellow
docker compose -f docker-compose.prod.yml up -d
Write-Host "✓ Services started." -ForegroundColor Green

# ── 6. Verification ──
Write-Host "`n[6/6] Verifying service readiness..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$ready = $false
for ($i = 1; $i -le 12; $i++) {
    Write-Host -NoNewline "Checking readiness ($i/12)... "
    try {
        $res = Invoke-RestMethod -Uri "http://localhost/health/ready" -Method Get -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($res.status -eq "ready") {
            Write-Host "READY!" -ForegroundColor Green
            $ready = $true
            break
        }
    } catch {
        # continue waiting
    }
    Write-Host "waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "`n==============================================" -ForegroundColor Cyan
if ($ready) {
    Write-Host "✓ VeritasAI is successfully deployed and running!" -ForegroundColor Green
    Write-Host "  - Frontend & Gateway: http://localhost"
    Write-Host "  - Health Check:       http://localhost/health"
    Write-Host "  - Readiness Check:    http://localhost/health/ready"
} else {
    Write-Host "Containers launched. Check logs using: docker compose -f docker-compose.prod.yml logs -f" -ForegroundColor Yellow
}
Write-Host "==============================================" -ForegroundColor Cyan
