# Kubernetes & Multi-Environment Migration Plan

> **myScheduling** - Enterprise Staffing & Work-Location Management Application

**Document Version:** 1.0
**Created:** 2025-12-15
**Status:** Planning

---

## Executive Summary

This document outlines a 3-phase migration plan to establish proper Dev/Test/Prod environments with containerization, culminating in Azure Container Apps deployment with a path to AKS if needed.

| Phase | Scope | Timeline | Cost Impact |
|-------|-------|----------|-------------|
| Phase 1 | Database Environment Separation | 1-2 weeks | +$0 (Docker local) |
| Phase 2 | GitHub Branch Strategy & CI/CD | 2-3 weeks | +$0 (GitHub Enterprise) |
| Phase 3 | Container Apps Migration | 2-4 weeks | +$25-50/mo |

**Current State:** Single production environment on Azure App Service (~$25/mo)
**Target State:** Dev (local) → Test (Azure) → Prod (Azure Container Apps)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEVELOPMENT (Local)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Developer Machine                                                           │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Frontend        │    │ Backend API     │    │ PostgreSQL      │         │
│  │ (npm run dev)   │───▶│ (dotnet run)    │───▶│ (Docker)        │         │
│  │ localhost:5173  │    │ localhost:5107  │    │ localhost:5432  │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                       │                     │
│                                            ┌──────────▼──────────┐         │
│                                            │ Prod Data Refresh   │         │
│                                            │ (pg_dump/restore)   │         │
│                                            └─────────────────────┘         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              TEST (Azure)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Azure Container Apps (Test)                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Frontend        │    │ Backend API     │    │ PostgreSQL      │         │
│  │ Static Web App  │───▶│ Container App   │───▶│ Azure Flexible  │         │
│  │ test.myscheduling│   │ test-api        │    │ myscheduling-test│        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
│  Deploy Trigger: Push to `develop` branch                                   │
│  Migrations: Auto-applied                                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRODUCTION (Azure)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Azure Container Apps (Prod)                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ Frontend        │    │ Backend API     │    │ PostgreSQL      │         │
│  │ Static Web App  │───▶│ Container App   │───▶│ Azure Flexible  │         │
│  │ myscheduling.com│    │ prod-api        │    │ myscheduling    │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                              │
│  Deploy Trigger: Push to `main` branch (after PR approval)                  │
│  Migrations: Manual approval required                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Database Environment Separation

### Goal
Create isolated Dev database (Docker) with easy Prod→Dev refresh capability.

### 1.1 Local Development Database (Docker PostgreSQL)

**docker-compose.yml** (create in project root):
```yaml
version: '3.8'

services:
  postgres-dev:
    image: postgres:16-alpine
    container_name: myscheduling-postgres-dev
    environment:
      POSTGRES_USER: myscheduling
      POSTGRES_PASSWORD: DevPassword123!
      POSTGRES_DB: myscheduling_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
      - ./scripts/db:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U myscheduling -d myscheduling_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_dev_data:
```

**Commands:**
```bash
# Start local database
docker-compose up -d postgres-dev

# Stop database (keeps data)
docker-compose stop postgres-dev

# Reset database (destroys data)
docker-compose down -v postgres-dev
```

### 1.2 Prod-to-Dev Data Refresh Script

**scripts/refresh-dev-from-prod.ps1**:
```powershell
#!/usr/bin/env pwsh
# Refresh local dev database from production
# Usage: ./scripts/refresh-dev-from-prod.ps1

param(
    [switch]$SkipConfirmation
)

$ErrorActionPreference = "Stop"

# Configuration
$PROD_HOST = "myscheduling.postgres.database.azure.com"
$PROD_DB = "myscheduling"
$PROD_USER = "myscheduling_admin"  # Update with your admin user

$DEV_HOST = "localhost"
$DEV_PORT = "5432"
$DEV_DB = "myscheduling_dev"
$DEV_USER = "myscheduling"
$DEV_PASSWORD = "DevPassword123!"

$BACKUP_FILE = "./scripts/db/prod_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Prod → Dev Database Refresh Script   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Source: $PROD_HOST/$PROD_DB" -ForegroundColor Yellow
Write-Host "Target: $DEV_HOST:$DEV_PORT/$DEV_DB" -ForegroundColor Yellow
Write-Host ""

if (-not $SkipConfirmation) {
    $confirm = Read-Host "This will OVERWRITE your local dev database. Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# Step 1: Export from Production
Write-Host "`n[1/4] Exporting from production..." -ForegroundColor Green
Write-Host "  Enter production password when prompted"

$env:PGPASSWORD = Read-Host "Production DB Password" -AsSecureString | ConvertFrom-SecureString -AsPlainText

pg_dump `
    --host=$PROD_HOST `
    --port=5432 `
    --username=$PROD_USER `
    --dbname=$PROD_DB `
    --format=plain `
    --no-owner `
    --no-privileges `
    --file=$BACKUP_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Export failed!" -ForegroundColor Red
    exit 1
}

Write-Host "  Backup created: $BACKUP_FILE" -ForegroundColor Gray

# Step 2: Stop any connections to dev database
Write-Host "`n[2/4] Preparing local database..." -ForegroundColor Green

$env:PGPASSWORD = $DEV_PASSWORD
psql --host=$DEV_HOST --port=$DEV_PORT --username=$DEV_USER --dbname=postgres -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DEV_DB' AND pid <> pg_backend_pid();
" 2>$null

# Step 3: Drop and recreate dev database
Write-Host "`n[3/4] Recreating dev database..." -ForegroundColor Green

psql --host=$DEV_HOST --port=$DEV_PORT --username=$DEV_USER --dbname=postgres -c "DROP DATABASE IF EXISTS $DEV_DB;"
psql --host=$DEV_HOST --port=$DEV_PORT --username=$DEV_USER --dbname=postgres -c "CREATE DATABASE $DEV_DB;"

# Step 4: Restore backup to dev
Write-Host "`n[4/4] Restoring data to dev..." -ForegroundColor Green

psql --host=$DEV_HOST --port=$DEV_PORT --username=$DEV_USER --dbname=$DEV_DB --file=$BACKUP_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "Restore completed with warnings (this is often normal)" -ForegroundColor Yellow
} else {
    Write-Host "Restore completed successfully!" -ForegroundColor Green
}

# Cleanup
Write-Host "`n[Cleanup] Removing backup file..." -ForegroundColor Gray
Remove-Item $BACKUP_FILE -ErrorAction SilentlyContinue

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Dev database refresh complete!       " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection string for appsettings.Development.json:" -ForegroundColor Yellow
Write-Host "Host=$DEV_HOST;Port=$DEV_PORT;Database=$DEV_DB;Username=$DEV_USER;Password=$DEV_PASSWORD" -ForegroundColor Gray
```

### 1.3 Environment-Specific Configuration

**appsettings.Development.json** (local dev - gitignored):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=myscheduling_dev;Username=myscheduling;Password=DevPassword123!"
  },
  "Jwt": {
    "Key": "dev-jwt-key-minimum-32-characters-long!",
    "Issuer": "myscheduling-dev",
    "Audience": "myscheduling-dev"
  },
  "FileStorage": {
    "Provider": "Local"
  }
}
```

**appsettings.Test.json** (new file - committed):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""  // Set via Azure App Configuration
  },
  "Jwt": {
    "Key": "",  // Set via Azure Key Vault
    "Issuer": "myscheduling-test",
    "Audience": "myscheduling-test"
  },
  "FileStorage": {
    "Provider": "AzureBlob"
  }
}
```

### 1.4 Phase 1 Checklist

- [ ] Create `docker-compose.yml` in project root
- [ ] Create `scripts/refresh-dev-from-prod.ps1`
- [ ] Create `appsettings.Test.json`
- [ ] Update `.gitignore` to include dev database volumes
- [ ] Test Docker PostgreSQL startup
- [ ] Test prod-to-dev refresh script
- [ ] Update CLAUDE.md with local dev database instructions

---

## Phase 2: GitHub Branch Strategy & CI/CD

### Goal
Establish proper branching model with environment-specific deployments and centralized secrets.

### 2.1 Branch Strategy (GitHub Flow + Environment Branches)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BRANCH STRATEGY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  feature/xxx ──┬──▶ develop ──────▶ main                                    │
│  feature/yyy ──┘        │            │                                       │
│  bugfix/zzz ───────────┘            │                                       │
│                                      │                                       │
│                    ┌─────────────────┼─────────────────┐                    │
│                    ▼                 ▼                 ▼                    │
│               [LOCAL DEV]        [TEST ENV]       [PROD ENV]               │
│               (manual)           (auto deploy)   (PR + approval)           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

WORKFLOW:
1. Create feature branch from `develop`
2. Work locally against Docker PostgreSQL
3. Push feature branch → CI runs tests
4. Create PR to `develop` → Code review
5. Merge to `develop` → Auto-deploy to TEST
6. Test in TEST environment
7. Create PR from `develop` to `main` → Requires approval
8. Merge to `main` → Deploy to PROD (with migration approval)
```

### 2.2 Branch Protection Rules

**Configure in GitHub → Settings → Branches:**

| Branch | Protection Rules |
|--------|------------------|
| `main` | Require PR, 1 approval, require status checks (tests), require conversation resolution |
| `develop` | Require PR, require status checks (tests) |

### 2.3 GitHub Environments

**Configure in GitHub → Settings → Environments:**

| Environment | Deployment Branch | Reviewers | Secrets |
|-------------|-------------------|-----------|---------|
| `development` | Any | None | Dev secrets |
| `test` | `develop` | None | Test secrets |
| `production` | `main` | You (or team) | Prod secrets |

### 2.4 Centralized Secrets with Azure Key Vault

**Why Key Vault?**
- Single source of truth for all secrets
- Audit logging for secret access
- Automatic rotation capability
- GitHub Actions can pull secrets at deploy time

**Azure Key Vault Structure:**
```
myscheduling-keyvault/
├── secrets/
│   ├── dev-db-connection-string
│   ├── dev-jwt-key
│   ├── test-db-connection-string
│   ├── test-jwt-key
│   ├── test-azure-storage-connection
│   ├── prod-db-connection-string
│   ├── prod-jwt-key
│   ├── prod-azure-storage-connection
│   └── prod-azure-email-connection
```

**Setup Commands:**
```bash
# Create Key Vault
az keyvault create \
  --name myscheduling-keyvault \
  --resource-group myscheduling-rg \
  --location eastus

# Add secrets
az keyvault secret set --vault-name myscheduling-keyvault \
  --name "prod-db-connection-string" \
  --value "Host=myscheduling.postgres.database.azure.com;..."

# Create service principal for GitHub Actions
az ad sp create-for-rbac \
  --name "github-actions-myscheduling" \
  --role "Key Vault Secrets User" \
  --scopes /subscriptions/{sub-id}/resourceGroups/myscheduling-rg/providers/Microsoft.KeyVault/vaults/myscheduling-keyvault

# Output credentials - add these to GitHub Secrets
# AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID
```

### 2.5 Updated GitHub Actions Workflows

**.github/workflows/ci.yml** (new - runs on all branches):
```yaml
name: CI - Build and Test

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main, develop]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - name: Restore dependencies
        run: dotnet restore backend/MyScheduling.sln

      - name: Build
        run: dotnet build backend/MyScheduling.sln --no-restore

      - name: Test
        run: dotnet test backend/MyScheduling.sln --no-build --verbosity normal

  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test
```

**.github/workflows/deploy-test.yml** (deploy to TEST on develop):
```yaml
name: Deploy to TEST

on:
  push:
    branches: [develop]

env:
  AZURE_CONTAINER_APP_NAME: myscheduling-api-test
  AZURE_RESOURCE_GROUP: myscheduling-rg
  CONTAINER_REGISTRY: myschedulingacr.azurecr.io

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    environment: test
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get secrets from Key Vault
        id: keyvault
        run: |
          echo "DB_CONNECTION=$(az keyvault secret show --vault-name myscheduling-keyvault --name test-db-connection-string --query value -o tsv)" >> $GITHUB_OUTPUT
          echo "JWT_KEY=$(az keyvault secret show --vault-name myscheduling-keyvault --name test-jwt-key --query value -o tsv)" >> $GITHUB_OUTPUT

      - name: Build and push container
        run: |
          az acr login --name myschedulingacr
          docker build -t ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:test-${{ github.sha }} -f backend/Dockerfile backend/
          docker push ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:test-${{ github.sha }}

      - name: Deploy to Container App
        run: |
          az containerapp update \
            --name ${{ env.AZURE_CONTAINER_APP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --image ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:test-${{ github.sha }} \
            --set-env-vars \
              "ConnectionStrings__DefaultConnection=${{ steps.keyvault.outputs.DB_CONNECTION }}" \
              "Jwt__Key=${{ steps.keyvault.outputs.JWT_KEY }}"

  deploy-frontend:
    runs-on: ubuntu-latest
    environment: test
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and build
        run: |
          npm ci
          npm run build
        env:
          VITE_API_URL: https://myscheduling-api-test.azurecontainerapps.io

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_TEST }}
          action: "upload"
          app_location: "frontend"
          output_location: "dist"
```

**.github/workflows/deploy-prod.yml** (deploy to PROD on main):
```yaml
name: Deploy to PRODUCTION

on:
  push:
    branches: [main]

env:
  AZURE_CONTAINER_APP_NAME: myscheduling-api-prod
  AZURE_RESOURCE_GROUP: myscheduling-rg
  CONTAINER_REGISTRY: myschedulingacr.azurecr.io

jobs:
  # Check if migrations are pending
  check-migrations:
    runs-on: ubuntu-latest
    environment: production
    outputs:
      has_migrations: ${{ steps.check.outputs.has_migrations }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for migration changes
        id: check
        run: |
          if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q "Migrations/"; then
            echo "has_migrations=true" >> $GITHUB_OUTPUT
            echo "::warning::Database migrations detected - manual approval required"
          else
            echo "has_migrations=false" >> $GITHUB_OUTPUT
          fi

  # Require manual approval if migrations present
  approve-migrations:
    needs: check-migrations
    if: needs.check-migrations.outputs.has_migrations == 'true'
    runs-on: ubuntu-latest
    environment:
      name: production-migrations
      # This environment should require manual approval in GitHub settings
    steps:
      - name: Migration approval gate
        run: echo "Migrations approved by ${{ github.actor }}"

  deploy-backend:
    needs: [check-migrations, approve-migrations]
    if: always() && (needs.check-migrations.outputs.has_migrations == 'false' || needs.approve-migrations.result == 'success')
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login
        uses: azure/login@v1
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Get secrets from Key Vault
        id: keyvault
        run: |
          echo "DB_CONNECTION=$(az keyvault secret show --vault-name myscheduling-keyvault --name prod-db-connection-string --query value -o tsv)" >> $GITHUB_OUTPUT
          echo "JWT_KEY=$(az keyvault secret show --vault-name myscheduling-keyvault --name prod-jwt-key --query value -o tsv)" >> $GITHUB_OUTPUT
          echo "STORAGE_CONNECTION=$(az keyvault secret show --vault-name myscheduling-keyvault --name prod-azure-storage-connection --query value -o tsv)" >> $GITHUB_OUTPUT

      - name: Build and push container
        run: |
          az acr login --name myschedulingacr
          docker build -t ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:prod-${{ github.sha }} -f backend/Dockerfile backend/
          docker push ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:prod-${{ github.sha }}

      - name: Deploy to Container App
        run: |
          az containerapp update \
            --name ${{ env.AZURE_CONTAINER_APP_NAME }} \
            --resource-group ${{ env.AZURE_RESOURCE_GROUP }} \
            --image ${{ env.CONTAINER_REGISTRY }}/myscheduling-api:prod-${{ github.sha }} \
            --set-env-vars \
              "ConnectionStrings__DefaultConnection=${{ steps.keyvault.outputs.DB_CONNECTION }}" \
              "Jwt__Key=${{ steps.keyvault.outputs.JWT_KEY }}" \
              "AZURE_STORAGE_CONNECTION_STRING=${{ steps.keyvault.outputs.STORAGE_CONNECTION }}"

  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    environment: production
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install and build
        run: |
          npm ci
          npm run build
        env:
          VITE_API_URL: https://myscheduling-api-prod.azurecontainerapps.io

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_PROD }}
          action: "upload"
          app_location: "frontend"
          output_location: "dist"
```

### 2.6 Phase 2 Checklist

- [ ] Create `develop` branch from `main`
- [ ] Configure branch protection rules in GitHub
- [ ] Create GitHub environments (test, production, production-migrations)
- [ ] Create Azure Key Vault and add all secrets
- [ ] Create Azure service principal for GitHub Actions
- [ ] Add Azure credentials to GitHub Secrets
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy-test.yml`
- [ ] Create `.github/workflows/deploy-prod.yml`
- [ ] Test CI pipeline on feature branch
- [ ] Test deploy to test environment
- [ ] Document workflow in CLAUDE.md

---

## Phase 3: Azure Container Apps Migration

### Goal
Containerize the backend API and deploy to Azure Container Apps with proper scaling and monitoring.

### 3.1 Backend Dockerfile

**backend/Dockerfile**:
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore
COPY src/MyScheduling.Core/*.csproj ./MyScheduling.Core/
COPY src/MyScheduling.Infrastructure/*.csproj ./MyScheduling.Infrastructure/
COPY src/MyScheduling.Api/*.csproj ./MyScheduling.Api/
RUN dotnet restore MyScheduling.Api/MyScheduling.Api.csproj

# Copy everything and build
COPY src/ .
RUN dotnet publish MyScheduling.Api/MyScheduling.Api.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine AS runtime
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy published app
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "MyScheduling.Api.dll"]
```

**backend/.dockerignore**:
```
**/bin/
**/obj/
**/out/
**/.vs/
**/.idea/
**/node_modules/
**/*.user
**/*.suo
**/Thumbs.db
**/.DS_Store
**/appsettings.Development.json
**/logs/
tests/
*.md
```

### 3.2 Azure Infrastructure Setup

**scripts/azure-setup.ps1**:
```powershell
#!/usr/bin/env pwsh
# Setup Azure infrastructure for myScheduling
# Prerequisites: az login completed

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("test", "prod")]
    [string]$Environment
)

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "myscheduling-rg"
$LOCATION = "eastus"
$ACR_NAME = "myschedulingacr"
$KEYVAULT_NAME = "myscheduling-keyvault"
$CONTAINER_APP_ENV = "myscheduling-env-$Environment"
$CONTAINER_APP_NAME = "myscheduling-api-$Environment"
$POSTGRES_SERVER = "myscheduling-db-$Environment"

Write-Host "Setting up $Environment environment..." -ForegroundColor Cyan

# Create Resource Group (if not exists)
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container Registry (shared across environments)
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name $ACR_NAME \
    --sku Basic \
    --admin-enabled true

# Create Container Apps Environment
az containerapp env create \
    --name $CONTAINER_APP_ENV \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION

# Create PostgreSQL Flexible Server (for test only - prod already exists)
if ($Environment -eq "test") {
    az postgres flexible-server create \
        --resource-group $RESOURCE_GROUP \
        --name $POSTGRES_SERVER \
        --location $LOCATION \
        --admin-user myscheduling_admin \
        --admin-password $(Read-Host "Enter test DB password" -AsSecureString | ConvertFrom-SecureString -AsPlainText) \
        --sku-name Standard_B1ms \
        --tier Burstable \
        --storage-size 32 \
        --version 16

    # Create database
    az postgres flexible-server db create \
        --resource-group $RESOURCE_GROUP \
        --server-name $POSTGRES_SERVER \
        --database-name myscheduling
}

# Create Container App
az containerapp create \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --environment $CONTAINER_APP_ENV \
    --image mcr.microsoft.com/azuredocs/containerapps-helloworld:latest \
    --target-port 8080 \
    --ingress external \
    --min-replicas 1 \
    --max-replicas 3 \
    --cpu 0.5 \
    --memory 1.0Gi

Write-Host "`nContainer App URL:" -ForegroundColor Green
az containerapp show --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "`n$Environment environment setup complete!" -ForegroundColor Cyan
```

### 3.3 Container Apps Configuration

| Setting | Test | Production |
|---------|------|------------|
| Min replicas | 1 | 1 |
| Max replicas | 2 | 5 |
| CPU | 0.5 | 1.0 |
| Memory | 1 GB | 2 GB |
| Ingress | External | External |
| Scale rule | HTTP (10 concurrent) | HTTP (50 concurrent) |

### 3.4 Migration Steps

**Week 1: Containerization**
1. Create Dockerfile and test locally
2. Build and push to Azure Container Registry
3. Verify container runs correctly

**Week 2: Test Environment**
1. Create test Container Apps environment
2. Create test PostgreSQL instance
3. Deploy container to test
4. Migrate test frontend to point to new API

**Week 3: Production Migration**
1. Create production Container Apps environment
2. Deploy container to production (alongside existing App Service)
3. Test with subset of traffic
4. Switch DNS to Container Apps
5. Decommission App Service

### 3.5 Rollback Plan

If issues occur during production migration:

1. **Immediate rollback**: DNS points back to App Service (5 min)
2. **Data rollback**: Restore PostgreSQL from point-in-time backup (15 min)
3. **Code rollback**: Redeploy previous container image (5 min)

### 3.6 Cost Comparison

| Resource | Current (App Service) | Container Apps |
|----------|----------------------|----------------|
| Backend API | ~$13/mo (B1) | ~$25/mo (0.5 vCPU, 1GB) |
| PostgreSQL | ~$15/mo (existing) | ~$15/mo (existing) |
| Static Web App | Free | Free |
| Container Registry | N/A | ~$5/mo (Basic) |
| Key Vault | N/A | ~$3/mo |
| **Total** | **~$28/mo** | **~$48/mo** |

*Note: Container Apps cost increases with scaling. With <50 users/day, costs stay minimal.*

### 3.7 Phase 3 Checklist

- [ ] Create `backend/Dockerfile`
- [ ] Create `backend/.dockerignore`
- [ ] Test Docker build locally
- [ ] Create Azure Container Registry
- [ ] Create `scripts/azure-setup.ps1`
- [ ] Run setup for test environment
- [ ] Deploy to test Container App
- [ ] Verify test deployment
- [ ] Run setup for production environment
- [ ] Deploy to production Container App
- [ ] Configure custom domain and SSL
- [ ] Update DNS
- [ ] Decommission old App Service

---

## Future: AKS Migration Path

If you outgrow Container Apps (e.g., need service mesh, custom networking, advanced scheduling), the migration to AKS is straightforward:

1. **Same Dockerfile** - No changes needed
2. **Add Kubernetes manifests** - Deployment, Service, Ingress, ConfigMap
3. **Add Helm charts** - For templated deployments
4. **Consider ArgoCD** - For GitOps deployment model

**When to consider AKS:**
- Need multiple interconnected services
- Require advanced networking (VNet integration, private endpoints)
- Need custom resource scheduling
- Traffic exceeds Container Apps limits
- Need service mesh (Istio, Linkerd)

---

## Quick Reference Commands

```bash
# === LOCAL DEVELOPMENT ===
# Start local database
docker-compose up -d postgres-dev

# Refresh dev from prod
./scripts/refresh-dev-from-prod.ps1

# Run backend locally
cd backend/src/MyScheduling.Api && dotnet run

# Run frontend locally
cd frontend && VITE_API_PROXY_TARGET=http://localhost:5107 npm run dev


# === DOCKER ===
# Build container locally
docker build -t myscheduling-api -f backend/Dockerfile backend/

# Run container locally
docker run -p 8080:8080 -e ASPNETCORE_ENVIRONMENT=Development myscheduling-api


# === AZURE ===
# Login to Azure
az login

# Login to Container Registry
az acr login --name myschedulingacr

# View Container App logs
az containerapp logs show --name myscheduling-api-test --resource-group myscheduling-rg

# View Container App metrics
az containerapp show --name myscheduling-api-test --resource-group myscheduling-rg


# === GIT WORKFLOW ===
# Create feature branch
git checkout develop
git pull
git checkout -b feature/my-feature

# Push and create PR to develop
git push -u origin feature/my-feature
# Create PR in GitHub UI

# After merge to develop, create release PR to main
# In GitHub UI: New PR from develop to main
```

---

## Appendix: GitHub Secrets Required

| Secret Name | Environment | Description |
|-------------|-------------|-------------|
| `AZURE_CLIENT_ID` | All | Service principal client ID |
| `AZURE_CLIENT_SECRET` | All | Service principal secret |
| `AZURE_TENANT_ID` | All | Azure AD tenant ID |
| `AZURE_SUBSCRIPTION_ID` | All | Azure subscription ID |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_TEST` | test | Test SWA deploy token |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` | production | Prod SWA deploy token |

*All database connection strings and JWT keys are stored in Azure Key Vault and retrieved at deploy time.*

---

*Last updated: 2025-12-15*
