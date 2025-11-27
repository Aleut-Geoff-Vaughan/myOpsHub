# Check Status of Azure Services for MyScheduling
# This script displays the current status of all services

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = ""
)

Write-Host "=== MyScheduling Azure Services - STATUS ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$appServiceName = "myscheduling-api"
$staticWebAppName = "proud-ocean-0c7274110"
$postgresServerName = "myscheduling"

# Check if Azure CLI is installed
try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json
    Write-Host "Azure CLI found (version $($azVersion.'azure-cli'))" -ForegroundColor Green
} catch {
    Write-Host "Azure CLI not found. Please install from: https://aka.ms/installazurecli" -ForegroundColor Red
    Write-Host "Or run: .\azure-check-cli.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged in to Azure. Please run: az login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in as: $($account.user.name)" -ForegroundColor Green
Write-Host "Subscription: $($account.name)" -ForegroundColor Gray
Write-Host ""

# Get resource group if not specified
if (-not $ResourceGroup) {
    $appServiceInfo = az webapp show --name $appServiceName --query "[resourceGroup]" -o json 2>$null | ConvertFrom-Json
    if ($appServiceInfo) {
        $ResourceGroup = $appServiceInfo
    } else {
        Write-Host "Could not find App Service" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Check App Service
Write-Host "App Service: $appServiceName" -ForegroundColor Cyan
try {
    $webapp = az webapp show --name $appServiceName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
    if ($webapp) {
        $state = $webapp.state
        $sku = $webapp.sku

        if ($state -eq "Running") {
            Write-Host "   Status: RUNNING" -ForegroundColor Green
            Write-Host "   URL: https://$appServiceName.azurewebsites.net" -ForegroundColor Gray

            # Try to check health
            try {
                $health = Invoke-RestMethod -Uri "https://$appServiceName.azurewebsites.net/api/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
                Write-Host "   Health: $($health.status)" -ForegroundColor Green
            } catch {
                Write-Host "   Health: Not responding (may be starting)" -ForegroundColor Yellow
            }
        } elseif ($state -eq "Stopped") {
            Write-Host "   Status: STOPPED" -ForegroundColor Red
            Write-Host "   Saving compute costs" -ForegroundColor Cyan
        } else {
            Write-Host "   Status: $state" -ForegroundColor Yellow
        }

        Write-Host "   Tier: $sku" -ForegroundColor Gray
    } else {
        Write-Host "   Could not retrieve App Service info" -ForegroundColor Red
    }
} catch {
    Write-Host "   Failed to get App Service status" -ForegroundColor Red
}
Write-Host ""

# Check PostgreSQL
Write-Host "PostgreSQL: $postgresServerName" -ForegroundColor Cyan
try {
    # Try flexible server
    $postgres = az postgres flexible-server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
    if ($postgres) {
        $state = $postgres.state
        $sku = $postgres.sku.name
        $tier = $postgres.sku.tier

        if ($state -eq "Ready") {
            Write-Host "   Status: RUNNING" -ForegroundColor Green
        } elseif ($state -eq "Stopped") {
            Write-Host "   Status: STOPPED" -ForegroundColor Red
            Write-Host "   Saving compute costs (storage still charged)" -ForegroundColor Cyan
        } else {
            Write-Host "   Status: $state" -ForegroundColor Yellow
        }

        Write-Host "   Tier: $tier - $sku" -ForegroundColor Gray
        Write-Host "   Server Type: Flexible Server" -ForegroundColor Gray
    } else {
        # Try single server
        $postgres = az postgres server show --name $postgresServerName --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
        if ($postgres) {
            Write-Host "   Status: RUNNING (always on)" -ForegroundColor Green
            Write-Host "   Tier: $($postgres.sku.tier) - $($postgres.sku.name)" -ForegroundColor Gray
            Write-Host "   Server Type: Single Server (cannot be stopped)" -ForegroundColor Yellow
        } else {
            Write-Host "   Could not retrieve PostgreSQL info" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "   Failed to get PostgreSQL status" -ForegroundColor Red
}
Write-Host ""

# Check Static Web App
Write-Host "Static Web App: $staticWebAppName" -ForegroundColor Cyan
try {
    $swa = az staticwebapp show --name $staticWebAppName 2>$null | ConvertFrom-Json
    if ($swa) {
        Write-Host "   Status: ACTIVE" -ForegroundColor Green
        Write-Host "   URL: https://$staticWebAppName.3.azurestaticapps.net" -ForegroundColor Gray
        Write-Host "   Tier: $($swa.sku.tier) ($($swa.sku.name))" -ForegroundColor Gray

        if ($swa.sku.tier -eq "Free") {
            Write-Host "   Cost: `$0/month" -ForegroundColor Cyan
        }
    } else {
        Write-Host "   Could not retrieve Static Web App info" -ForegroundColor Red
    }
} catch {
    Write-Host "   Could not get Static Web App status" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host ""

# Cost estimate
Write-Host "Estimated Monthly Costs:" -ForegroundColor Cyan
Write-Host "   (Actual costs depend on your tier and usage)" -ForegroundColor Gray
Write-Host ""

if (($webapp -and $webapp.state -eq "Stopped") -or ($postgres -and $postgres.state -eq "Stopped")) {
    Write-Host "   Some services are stopped - saving money!" -ForegroundColor Green
}

Write-Host ""
Write-Host "Available commands:" -ForegroundColor Cyan
Write-Host "   Start services:  .\azure-start-services.ps1" -ForegroundColor Gray
Write-Host "   Stop services:   .\azure-stop-services.ps1" -ForegroundColor Gray
Write-Host "   Check status:    .\azure-status-services.ps1" -ForegroundColor Gray
Write-Host ""
