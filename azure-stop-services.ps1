# Stop Azure Services for MyScheduling
# This script stops the App Service and PostgreSQL database to save costs

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "",

    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

Write-Host "=== MyScheduling Azure Services - STOP ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$appServiceName = "myscheduling-api"
$staticWebAppName = "proud-ocean-0c7274110"
$postgresServerName = "myscheduling"

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "✓ Azure CLI found (version $($azVersion.'azure-cli'))" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI not found. Please install from: https://aka.ms/installazurecli" -ForegroundColor Red
    exit 1
}

# Check if logged in
Write-Host "Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "✗ Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "  Subscription: $($account.name)" -ForegroundColor Gray
Write-Host ""

# Get resource group if not specified
if (-not $ResourceGroup) {
    Write-Host "Finding resource group for App Service..." -ForegroundColor Yellow
    $appServiceInfo = az webapp show --name $appServiceName --query "[resourceGroup]" -o json 2>$null | ConvertFrom-Json
    if ($appServiceInfo) {
        $ResourceGroup = $appServiceInfo
        Write-Host "✓ Found resource group: $ResourceGroup" -ForegroundColor Green
    } else {
        Write-Host "✗ Could not find App Service. Please specify -ResourceGroup parameter" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

if ($WhatIf) {
    Write-Host "=== WHAT-IF MODE (No changes will be made) ===" -ForegroundColor Yellow
    Write-Host ""
}

# Function to stop App Service
function Stop-AppService {
    Write-Host "[1/3] Stopping App Service: $appServiceName" -ForegroundColor Yellow

    if ($WhatIf) {
        Write-Host "      Would run: az webapp stop --name $appServiceName --resource-group $ResourceGroup" -ForegroundColor Gray
        Write-Host "      ✓ Would stop App Service (saves ~$50-150/month)" -ForegroundColor Green
        return
    }

    try {
        $state = az webapp show --name $appServiceName --resource-group $ResourceGroup --query "state" -o tsv 2>$null

        if ($state -eq "Running") {
            az webapp stop --name $appServiceName --resource-group $ResourceGroup --output none 2>$null
            Write-Host "      ✓ App Service stopped successfully" -ForegroundColor Green
            Write-Host "      💰 Saving: ~$50-150/month (compute charges)" -ForegroundColor Cyan
        } elseif ($state -eq "Stopped") {
            Write-Host "      ℹ App Service is already stopped" -ForegroundColor Gray
        } else {
            Write-Host "      ⚠ App Service state: $state" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ✗ Failed to stop App Service: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Function to stop PostgreSQL (if supported)
function Stop-PostgreSQL {
    Write-Host "[2/3] Stopping PostgreSQL Database: $postgresServerName" -ForegroundColor Yellow

    if ($WhatIf) {
        Write-Host "      Would run: az postgres flexible-server stop --name $postgresServerName --resource-group $ResourceGroup" -ForegroundColor Gray
        Write-Host "      ✓ Would stop PostgreSQL (saves ~$15-30/month)" -ForegroundColor Green
        return
    }

    try {
        # Try flexible server first
        $serverInfo = az postgres flexible-server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json

        if ($serverInfo) {
            if ($serverInfo.state -eq "Ready") {
                az postgres flexible-server stop --name $postgresServerName --resource-group $ResourceGroup --output none 2>$null
                Write-Host "      ✓ PostgreSQL Flexible Server stopped successfully" -ForegroundColor Green
                Write-Host "      💰 Saving: ~$15-30/month (compute charges, storage still charged)" -ForegroundColor Cyan
            } elseif ($serverInfo.state -eq "Stopped") {
                Write-Host "      ℹ PostgreSQL is already stopped" -ForegroundColor Gray
            } else {
                Write-Host "      ⚠ PostgreSQL state: $($serverInfo.state)" -ForegroundColor Yellow
            }
        } else {
            # Try single server
            $serverInfo = az postgres server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
            if ($serverInfo) {
                Write-Host "      ⚠ PostgreSQL Single Server detected - stopping not supported" -ForegroundColor Yellow
                Write-Host "      ℹ Consider migrating to Flexible Server to enable stop/start" -ForegroundColor Gray
                Write-Host "      ℹ Or scale down to B1ms tier to reduce costs" -ForegroundColor Gray
            } else {
                Write-Host "      ✗ Could not find PostgreSQL server" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "      ✗ Failed to stop PostgreSQL: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Function to check Static Web App
function Check-StaticWebApp {
    Write-Host "[3/3] Checking Static Web App: $staticWebAppName" -ForegroundColor Yellow

    if ($WhatIf) {
        Write-Host "      Static Web App cannot be stopped (already free tier)" -ForegroundColor Gray
        Write-Host "      ℹ No action needed - already $0/month" -ForegroundColor Green
        return
    }

    try {
        $swaInfo = az staticwebapp show --name $staticWebAppName --query "[sku.tier]" -o tsv 2>$null
        if ($swaInfo) {
            Write-Host "      ℹ Static Web App is on '$swaInfo' tier" -ForegroundColor Gray
            Write-Host "      ℹ Static Web Apps cannot be stopped, but Free tier = $0/month" -ForegroundColor Gray
        } else {
            Write-Host "      ⚠ Could not retrieve Static Web App info" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ℹ Static Web App status check skipped" -ForegroundColor Gray
    }
    Write-Host ""
}

# Execute stops
Stop-AppService
Stop-PostgreSQL
Check-StaticWebApp

Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($WhatIf) {
    Write-Host "This was a dry run. No changes were made." -ForegroundColor Yellow
    Write-Host "Run without -WhatIf to actually stop services." -ForegroundColor Yellow
} else {
    Write-Host "Services have been stopped to save costs." -ForegroundColor Green
    Write-Host ""
    Write-Host "To start services again, run: .\azure-start-services.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Expected savings while stopped:" -ForegroundColor Cyan
    Write-Host "  • App Service: ~$50-150/month" -ForegroundColor Gray
    Write-Host "  • PostgreSQL: ~$15-30/month (if flexible server)" -ForegroundColor Gray
    Write-Host "  • Static Web App: $0 (already free)" -ForegroundColor Gray
    Write-Host "  • Total: ~$65-180/month saved" -ForegroundColor Green
}
Write-Host ""
