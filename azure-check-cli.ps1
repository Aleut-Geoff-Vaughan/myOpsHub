# Check Azure CLI Installation
# This script checks if Azure CLI is installed and provides installation instructions

Write-Host "=== Azure CLI Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "Checking for Azure CLI..." -ForegroundColor Yellow

try {
    $azVersion = az version --output json 2>$null | ConvertFrom-Json

    if ($azVersion) {
        Write-Host "✓ Azure CLI is installed!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Version Information:" -ForegroundColor Cyan
        Write-Host "  Azure CLI: $($azVersion.'azure-cli')" -ForegroundColor Gray
        Write-Host "  Python: $($azVersion.python)" -ForegroundColor Gray
        Write-Host "  Extensions: $($azVersion.extensions.Count) installed" -ForegroundColor Gray
        Write-Host ""

        # Check if logged in
        Write-Host "Checking Azure login status..." -ForegroundColor Yellow
        $account = az account show 2>$null | ConvertFrom-Json

        if ($account) {
            Write-Host "✓ Logged in to Azure!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Account Information:" -ForegroundColor Cyan
            Write-Host "  User: $($account.user.name)" -ForegroundColor Gray
            Write-Host "  Subscription: $($account.name)" -ForegroundColor Gray
            Write-Host "  Subscription ID: $($account.id)" -ForegroundColor Gray
            Write-Host "  Tenant: $($account.tenantId)" -ForegroundColor Gray
            Write-Host ""
            Write-Host "Ready to use the Azure management scripts!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Available commands:" -ForegroundColor Cyan
            Write-Host "  .\azure-status-services.ps1  - Check service status" -ForegroundColor Gray
            Write-Host "  .\azure-stop-services.ps1    - Stop services to save money" -ForegroundColor Gray
            Write-Host "  .\azure-start-services.ps1   - Start services" -ForegroundColor Gray
        } else {
            Write-Host "✗ Not logged in to Azure" -ForegroundColor Red
            Write-Host ""
            Write-Host "To login, run:" -ForegroundColor Yellow
            Write-Host "  az login" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "This will open your browser to authenticate with Azure." -ForegroundColor Gray
        }

    } else {
        throw "Azure CLI not found"
    }

} catch {
    Write-Host "✗ Azure CLI is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Installation Options:" -ForegroundColor Cyan
    Write-Host ""

    # Option 1: Windows Package Manager (winget)
    Write-Host "Option 1: Install via Windows Package Manager (Recommended)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Run this command:" -ForegroundColor White
    Write-Host "  winget install Microsoft.AzureCLI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Note: After installation, close and reopen PowerShell" -ForegroundColor Gray
    Write-Host ""

    # Option 2: MSI Installer
    Write-Host "Option 2: Download MSI Installer" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  1. Go to: https://aka.ms/installazurecli" -ForegroundColor White
    Write-Host "  2. Download the MSI installer for Windows" -ForegroundColor White
    Write-Host "  3. Run the installer" -ForegroundColor White
    Write-Host "  4. Restart PowerShell after installation" -ForegroundColor White
    Write-Host ""

    # Option 3: PowerShell command
    Write-Host "Option 3: Install via PowerShell" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Run these commands (as Administrator):" -ForegroundColor White
    Write-Host "  Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi" -ForegroundColor Cyan
    Write-Host "  Start-Process msiexec.exe -Wait -ArgumentList /I,AzureCLI.msi,/quiet" -ForegroundColor Cyan
    Write-Host "  Remove-Item .\AzureCLI.msi" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""

    # Check if winget is available
    Write-Host "Checking for winget..." -ForegroundColor Yellow
    try {
        $wingetVersion = winget --version 2>$null
        if ($wingetVersion) {
            Write-Host "✓ winget is available (version: $wingetVersion)" -ForegroundColor Green
            Write-Host ""
            Write-Host "Quick Install Option:" -ForegroundColor Cyan
            Write-Host ""
            $response = Read-Host "Would you like to install Azure CLI now using winget? (y/n)"

            if ($response -eq "y" -or $response -eq "Y") {
                Write-Host ""
                Write-Host "Installing Azure CLI..." -ForegroundColor Yellow
                Write-Host ""

                try {
                    winget install Microsoft.AzureCLI --accept-package-agreements --accept-source-agreements
                    Write-Host ""
                    Write-Host "✓ Azure CLI installed successfully!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "IMPORTANT: Please close and reopen PowerShell, then run:" -ForegroundColor Yellow
                    Write-Host "  .\azure-check-cli.ps1" -ForegroundColor Cyan
                    Write-Host ""
                } catch {
                    Write-Host ""
                    Write-Host "✗ Installation failed. Please try Option 2 (MSI Installer) instead." -ForegroundColor Red
                    Write-Host ""
                }
            } else {
                Write-Host ""
                Write-Host "Installation cancelled. Use one of the options above when ready." -ForegroundColor Gray
                Write-Host ""
            }
        }
    } catch {
        Write-Host "  winget not found - use Option 2 or 3 above" -ForegroundColor Gray
        Write-Host ""
    }
}

Write-Host ""
