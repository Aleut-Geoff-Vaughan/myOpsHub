# Azure Services Management for MyScheduling

## ✅ Current Status

Your MyScheduling application is **successfully deployed to Azure** and fully operational!

### Production URLs
- **Frontend**: https://proud-ocean-0c7274110.3.azurestaticapps.net
- **Backend API**: https://myscheduling-api.azurewebsites.net
- **Health Check**: https://myscheduling-api.azurewebsites.net/api/health

### Deployed Services
1. **Azure App Service** - `myscheduling-api` (Backend .NET 8 API)
2. **Azure Static Web Apps** - `proud-ocean-0c7274110` (Frontend React app)
3. **Azure PostgreSQL** - `myscheduling.postgres.database.azure.com` (Database)

## 🚀 CI/CD Pipelines

### Automatic Deployments
- **Backend**: Pushes to `main` with changes in `backend/**` trigger automatic deployment
- **Frontend**: All pushes to `main` trigger automatic deployment

### GitHub Secrets Configured
- ✅ `AZURE_WEBAPP_PUBLISH_PROFILE` - Backend deployment credentials
- ✅ `VITE_API_URL` - Frontend API endpoint configuration
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN_PROUD_OCEAN_0C7274110` - Frontend deployment token

## 💰 Cost Savings Scripts

I've created PowerShell scripts to help you manage costs when not actively using the application:

### 1. azure-check-cli.ps1
Checks if Azure CLI is installed and provides installation instructions.

**Prerequisites**: You need Azure CLI installed first.

**Install Azure CLI** (choose one method):

**Option A: Using winget (easiest)**
```powershell
winget install Microsoft.AzureCLI
```

**Option B: Download MSI**
- Go to: https://aka.ms/installazurecliwindows
- Download and run the installer

**Option C: PowerShell**
```powershell
Invoke-WebRequest -Uri https://aka.ms/installazurecliwindows -OutFile .\AzureCLI.msi
Start-Process msiexec.exe -Wait -ArgumentList /I,AzureCLI.msi,/quiet
Remove-Item .\AzureCLI.msi
```

After installation, **restart PowerShell**, then run:
```powershell
az login
```

### 2. azure-status-services.ps1
Checks the current status of all your Azure services.

```powershell
.\azure-status-services.ps1
```

Shows:
- App Service status (Running/Stopped)
- PostgreSQL status (Running/Stopped)
- Static Web App status
- API health check
- Current tier/SKU information

### 3. azure-stop-services.ps1
Stops services to save money when not in use.

```powershell
# Dry run (see what would happen)
.\azure-stop-services.ps1 -WhatIf

# Actually stop services
.\azure-stop-services.ps1
```

**What it stops**:
- ✅ App Service (API) - Saves ~$50-150/month
- ✅ PostgreSQL Database - Saves ~$15-30/month (if Flexible Server)
- ℹ️ Static Web App - Already free, cannot be stopped

### 4. azure-start-services.ps1
Starts services when you need to test.

```powershell
# Dry run
.\azure-start-services.ps1 -WhatIf

# Actually start services
.\azure-start-services.ps1
```

**What it does**:
- Starts PostgreSQL first (takes 1-2 minutes)
- Starts App Service (takes 30-60 seconds)
- Tests health endpoint to verify API is ready

## 📊 Cost Estimates

### Currently Running (Full Production)
- App Service: $50-150/month (depends on tier)
- PostgreSQL: $15-50/month (depends on tier)
- Static Web App: $0/month (Free tier)
- **Total**: ~$65-200/month

### Stopped Services (Development Phase)
- App Service: $0/month (compute stopped, minimal storage charge)
- PostgreSQL: $5-10/month (storage only if stopped, or $15+ if Single Server)
- Static Web App: $0/month
- **Total**: ~$5-15/month

### Recommended: Scale Down During Development
- App Service: F1 (Free) tier = $0/month
- PostgreSQL: B1ms Burstable = ~$15/month
- Static Web App: Free tier = $0/month
- **Total**: ~$15/month

## 🎯 Recommended Workflow

### During Active Development/Testing
```powershell
# 1. Start services when you need them
.\azure-start-services.ps1

# 2. Do your testing

# 3. Stop services when done for the day
.\azure-stop-services.ps1
```

### Check Status Anytime
```powershell
.\azure-status-services.ps1
```

## ⚙️ Scaling Down to Save Costs

### Option 1: Stop Services (Best for weekends/evenings)
Use the `azure-stop-services.ps1` script

### Option 2: Scale Down Tiers (Best for continuous development)

**Scale App Service to Free Tier**:
1. Go to Azure Portal → myscheduling-api
2. Click "Scale up (App Service plan)"
3. Select "Dev/Test" tab → "F1 (Free)"
4. Click "Apply"

**Scale PostgreSQL to Smallest Tier**:
1. Go to Azure Portal → PostgreSQL server
2. Click "Compute + storage"
3. Select "Burstable" tier → "B1ms"
4. Reduce storage if possible
5. Click "Save"

### Option 3: Manual Stop via Azure Portal
1. Go to https://portal.azure.com
2. Navigate to **myscheduling-api**
3. Click **Stop** button
4. When needed, click **Start** button

## 🔍 Troubleshooting

### Script Says "Azure CLI not found"
- Install Azure CLI using one of the methods above
- Restart PowerShell after installation
- Run `az login` to authenticate

### Script Says "Not logged in"
```powershell
az login
```
This will open your browser to authenticate

### Services Won't Stop
- Check if you have the right permissions
- PostgreSQL Single Server cannot be stopped (only Flexible Server supports stop/start)
- Try stopping manually via Azure Portal

### First Request is Slow After Starting
This is normal - "cold start" behavior. The first request after starting can take 10-30 seconds.

## 📝 Notes

- **Static Web App**: Already on Free tier, costs $0, cannot be stopped
- **PostgreSQL**: If you have "Single Server" (older type), it cannot be stopped. Consider migrating to "Flexible Server" for stop/start capability
- **Stopped databases**: Still incur storage charges (~$5/month) but no compute charges
- **Free tier App Service**: Limited to 60 CPU minutes/day, will cold-start on first request

## 🎉 Summary

Your application is production-ready with:
- ✅ Automated CI/CD deployments
- ✅ Frontend and backend successfully connected
- ✅ Database operational
- ✅ Authentication working
- ✅ Cost management scripts ready

You can now develop with confidence knowing you can easily start/stop services to manage costs during the development phase!
