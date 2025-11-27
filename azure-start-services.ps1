# Start Azure Services for MyScheduling
# This script starts the App Service and PostgreSQL database

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "",

    [Parameter(Mandatory=$false)]
    [switch]$WhatIf
)

Write-Host "=== MyScheduling Azure Services - START ===" -ForegroundColor Cyan
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

# Function to start PostgreSQL
function Start-PostgreSQL {
    Write-Host "[1/2] Starting PostgreSQL Database: $postgresServerName" -ForegroundColor Yellow

    if ($WhatIf) {
        Write-Host "      Would run: az postgres flexible-server start --name $postgresServerName --resource-group $ResourceGroup" -ForegroundColor Gray
        Write-Host "      ✓ Would start PostgreSQL" -ForegroundColor Green
        return
    }

    try {
        # Try flexible server
        $serverInfo = az postgres flexible-server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json

        if ($serverInfo) {
            if ($serverInfo.state -eq "Stopped") {
                Write-Host "      Starting PostgreSQL Flexible Server (this may take 1-2 minutes)..." -ForegroundColor Gray
                az postgres flexible-server start --name $postgresServerName --resource-group $ResourceGroup --output none 2>$null
                Write-Host "      ✓ PostgreSQL started successfully" -ForegroundColor Green
            } elseif ($serverInfo.state -eq "Ready") {
                Write-Host "      ℹ PostgreSQL is already running" -ForegroundColor Gray
            } else {
                Write-Host "      ⚠ PostgreSQL state: $($serverInfo.state)" -ForegroundColor Yellow
            }
        } else {
            # Try single server
            $serverInfo = az postgres server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
            if ($serverInfo) {
                Write-Host "      ℹ PostgreSQL Single Server - already running (cannot be stopped/started)" -ForegroundColor Gray
            } else {
                Write-Host "      ✗ Could not find PostgreSQL server" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "      ✗ Failed to start PostgreSQL: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Function to start App Service
function Start-AppService {
    Write-Host "[2/2] Starting App Service: $appServiceName" -ForegroundColor Yellow

    if ($WhatIf) {
        Write-Host "      Would run: az webapp start --name $appServiceName --resource-group $ResourceGroup" -ForegroundColor Gray
        Write-Host "      ✓ Would start App Service" -ForegroundColor Green
        return
    }

    try {
        $state = az webapp show --name $appServiceName --resource-group $ResourceGroup --query "state" -o tsv 2>$null

        if ($state -eq "Stopped") {
            Write-Host "      Starting App Service (this may take 30-60 seconds)..." -ForegroundColor Gray
            az webapp start --name $appServiceName --resource-group $ResourceGroup --output none 2>$null
            Write-Host "      ✓ App Service started successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "      Waiting for service to be ready..." -ForegroundColor Gray
            Start-Sleep -Seconds 10

            # Test health endpoint
            try {
                $healthUrl = "https://$appServiceName.azurewebsites.net/api/health"
                $response = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 30 -ErrorAction SilentlyContinue
                if ($response.status -eq "Healthy") {
                    Write-Host "      ✓ API is healthy and ready!" -ForegroundColor Green
                    Write-Host "      🌐 URL: $healthUrl" -ForegroundColor Cyan
                }
            } catch {
                Write-Host "      ⚠ Service started but may still be warming up" -ForegroundColor Yellow
                Write-Host "      ℹ Try accessing the API in 1-2 minutes" -ForegroundColor Gray
            }
        } elseif ($state -eq "Running") {
            Write-Host "      ℹ App Service is already running" -ForegroundColor Gray
            Write-Host "      🌐 URL: https://$appServiceName.azurewebsites.net/api/health" -ForegroundColor Cyan
        } else {
            Write-Host "      ⚠ App Service state: $state" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "      ✗ Failed to start App Service: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Execute starts (PostgreSQL first, then App Service)
Start-PostgreSQL
Start-AppService

Write-Host "=== Summary ===" -ForegroundColor Cyan
if ($WhatIf) {
    Write-Host "This was a dry run. No changes were made." -ForegroundColor Yellow
    Write-Host "Run without -WhatIf to actually start services." -ForegroundColor Yellow
} else {
    Write-Host "Services have been started." -ForegroundColor Green
    Write-Host ""
    Write-Host "Your application should now be accessible at:" -ForegroundColor Cyan
    Write-Host "  • API: https://$appServiceName.azurewebsites.net" -ForegroundColor Gray
    Write-Host "  • Frontend: https://$staticWebAppName.3.azurestaticapps.net" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Note: First request may be slow (cold start)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To stop services again, run: .\azure-stop-services.ps1" -ForegroundColor Cyan
}
Write-Host ""
