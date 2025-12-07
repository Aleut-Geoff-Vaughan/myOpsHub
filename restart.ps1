# Restart helper for MyScheduling (backend + frontend build)
# Usage: .\restart.ps1 [-Stop] [-Help]

param(
    [switch]$Stop,
    [switch]$Help
)

$ErrorActionPreference = "Continue"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ApiProject = Join-Path $RootDir "backend\src\MyScheduling.Api\MyScheduling.Api.csproj"
$ApiUrl = "http://localhost:5107"
$FrontendDir = Join-Path $RootDir "frontend"

function Stop-Backend {
    Write-Host "=== Stopping backend servers ===" -ForegroundColor Yellow

    # Kill any dotnet processes running MyScheduling
    $dotnetProcs = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*MyScheduling*"
    }
    if ($dotnetProcs) {
        Write-Host "Stopping dotnet processes: $($dotnetProcs.Id -join ', ')"
        $dotnetProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    }

    # Kill MyScheduling.Api.exe directly
    $apiProcs = Get-Process -Name "MyScheduling.Api" -ErrorAction SilentlyContinue
    if ($apiProcs) {
        Write-Host "Stopping MyScheduling.Api processes: $($apiProcs.Id -join ', ')"
        $apiProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    }

    # Kill processes on port 5107
    $portProcs = netstat -ano 2>$null | Select-String ":5107\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique

    foreach ($procId in $portProcs) {
        if ($procId -and $procId -ne "0") {
            Write-Host "Stopping process on port 5107: $procId"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "Backend stopped." -ForegroundColor Green
}

function Stop-Frontend {
    Write-Host "=== Stopping frontend servers ===" -ForegroundColor Yellow

    # Kill node processes related to vite/frontend
    $nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
        $_.CommandLine -like "*vite*" -or $_.CommandLine -like "*myScheduling*"
    }
    if ($nodeProcs) {
        Write-Host "Stopping node/vite processes: $($nodeProcs.Id -join ', ')"
        $nodeProcs | Stop-Process -Force -ErrorAction SilentlyContinue
    }

    # Kill processes on port 5173 (Vite default)
    $portProcs = netstat -ano 2>$null | Select-String ":5173\s" | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Where-Object { $_ -match '^\d+$' } | Select-Object -Unique

    foreach ($procId in $portProcs) {
        if ($procId -and $procId -ne "0") {
            Write-Host "Stopping process on port 5173: $procId"
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "Frontend stopped." -ForegroundColor Green
}

function Stop-All {
    Stop-Backend
    Stop-Frontend
    Start-Sleep -Seconds 1
    Write-Host "`nAll servers stopped." -ForegroundColor Cyan
}

function Build-Backend {
    Write-Host "`n=== Building backend ===" -ForegroundColor Yellow
    Push-Location (Split-Path -Parent $ApiProject)
    dotnet build
    $result = $LASTEXITCODE
    Pop-Location
    if ($result -ne 0) {
        Write-Host "Backend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Backend built successfully." -ForegroundColor Green
}

function Build-Frontend {
    Write-Host "`n=== Building frontend ===" -ForegroundColor Yellow
    Push-Location $FrontendDir
    npm run build
    $result = $LASTEXITCODE
    Pop-Location
    if ($result -ne 0) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Frontend built successfully." -ForegroundColor Green
}

function Start-Api {
    Write-Host "`n=== Starting API on $ApiUrl ===" -ForegroundColor Yellow
    Push-Location (Split-Path -Parent $ApiProject)
    Start-Process -FilePath "dotnet" -ArgumentList "run", "--urls", $ApiUrl -NoNewWindow
    Pop-Location
    Write-Host "API starting... (check console for output)" -ForegroundColor Green
}

function Start-Frontend {
    Write-Host "`n=== Starting frontend dev server ===" -ForegroundColor Yellow
    $npmCmd = "C:\Program Files\nodejs\npm.cmd"
    $env:VITE_API_PROXY_TARGET = $ApiUrl
    Start-Process -FilePath $npmCmd -ArgumentList "run", "dev" -WorkingDirectory $FrontendDir
    Write-Host "Frontend starting on http://localhost:5173..." -ForegroundColor Green
}

function Show-Help {
    Write-Host @"
Usage: .\restart.ps1 [OPTIONS]

Options:
  -Stop     Stop all backend and frontend servers
  -Help     Show this help message

Without options: Stops servers, rebuilds both projects, and starts the backend API

Examples:
  .\restart.ps1           # Full restart
  .\restart.ps1 -Stop     # Just stop all servers
"@
}

# Main
if ($Help) {
    Show-Help
    exit 0
}

if ($Stop) {
    Stop-All
    exit 0
}

# Full restart
Stop-All
Build-Backend
Build-Frontend
Start-Api
Start-Frontend

Write-Host "`n=== Restart complete ===" -ForegroundColor Cyan
Write-Host "Backend API: $ApiUrl"
Write-Host "Swagger: $ApiUrl/swagger"
Write-Host "Health: $ApiUrl/health"
Write-Host "Frontend: http://localhost:5173"
