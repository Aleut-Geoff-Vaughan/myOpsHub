# Azure Production Deployment Guide

## Current Status
- ✅ Frontend deployed to: https://proud-ocean-0c7274110.3.azurestaticapps.net
- ❌ Backend API: Not yet deployed

## Quick Start - Deploy Backend to Azure

### Option 1: Azure App Service (Recommended)

1. **Create Azure App Service via Azure Portal:**
   ```bash
   # Or use Azure CLI:
   az webapp create \
     --resource-group <your-resource-group> \
     --plan <your-app-service-plan> \
     --name myscheduling-api \
     --runtime "DOTNET|8.0"
   ```

2. **Create PostgreSQL Database:**
   ```bash
   az postgres flexible-server create \
     --resource-group <your-resource-group> \
     --name myscheduling-db \
     --location <location> \
     --admin-user <admin-username> \
     --admin-password <admin-password> \
     --sku-name Standard_B1ms \
     --tier Burstable \
     --storage-size 32
   ```

3. **Configure App Service Settings:**
   In Azure Portal → Your App Service → Configuration → Application settings:
   ```
   ConnectionStrings__DefaultConnection = Host=myscheduling-db.postgres.database.azure.com;Database=myscheduling;Username=<admin>@myscheduling-db;Password=<password>;SSL Mode=Require
   Jwt__Key = <your-secure-jwt-key>
   Jwt__Issuer = MyScheduling
   Jwt__Audience = MyScheduling
   ASPNETCORE_ENVIRONMENT = Production
   ```

4. **Get Publish Profile:**
   - Azure Portal → Your App Service → Get publish profile (Download)
   - Copy the contents

5. **Add GitHub Secret:**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `AZURE_WEBAPP_PUBLISH_PROFILE`
   - Value: Paste the publish profile contents

6. **Update Frontend API URL:**
   - Add another GitHub secret:
   - Name: `VITE_API_URL`
   - Value: `https://myscheduling-api.azurewebsites.net/api`

7. **Enable CORS on Backend:**
   Your backend needs to allow requests from your frontend domain.
   Add to `Program.cs` (before `app.Run();`):
   ```csharp
   app.UseCors(policy => policy
       .WithOrigins("https://proud-ocean-0c7274110.3.azurestaticapps.net")
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials());
   ```

### Option 2: Azure Container Apps (Containerized)

If you prefer containers:

1. Create `backend/Dockerfile`:
   ```dockerfile
   FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
   WORKDIR /app
   EXPOSE 80

   FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
   WORKDIR /src
   COPY ["src/MyScheduling.Api/MyScheduling.Api.csproj", "MyScheduling.Api/"]
   COPY ["src/MyScheduling.Core/MyScheduling.Core.csproj", "MyScheduling.Core/"]
   COPY ["src/MyScheduling.Infrastructure/MyScheduling.Infrastructure.csproj", "MyScheduling.Infrastructure/"]
   RUN dotnet restore "MyScheduling.Api/MyScheduling.Api.csproj"
   COPY src/ .
   WORKDIR "/src/MyScheduling.Api"
   RUN dotnet build "MyScheduling.Api.csproj" -c Release -o /app/build

   FROM build AS publish
   RUN dotnet publish "MyScheduling.Api.csproj" -c Release -o /app/publish

   FROM base AS final
   WORKDIR /app
   COPY --from=publish /app/publish .
   ENTRYPOINT ["dotnet", "MyScheduling.Api.dll"]
   ```

2. Deploy using Azure Container Apps CLI

## Environment Configuration

### Local Development
- Frontend: http://localhost:5173
- Backend: http://localhost:5107
- Uses `.env.development` (empty VITE_API_URL = uses Vite proxy)

### Production
- Frontend: https://proud-ocean-0c7274110.3.azurestaticapps.net
- Backend: https://myscheduling-api.azurewebsites.net (you need to create this)
- Uses `.env.production` with VITE_API_URL set via GitHub secrets

### Test (Future)
- Placeholder: `.env.test` created for future Azure test environment

## Deployment Workflows

### Frontend (Already Working)
- File: `.github/workflows/azure-static-web-apps-proud-ocean-0c7274110.yml`
- Triggers: Push to `main` branch
- Deploys to: Azure Static Web Apps
- Status: ✅ Active

### Backend (Ready to Configure)
- File: `.github/workflows/azure-backend-deploy.yml`
- Triggers: Push to `main` branch with changes in `backend/**` or manual
- Deploys to: Azure App Service (when configured)
- Status: ⏸️ Waiting for Azure resources and secrets

## Required GitHub Secrets

| Secret Name | Description | Status |
|------------|-------------|--------|
| `AZURE_STATIC_WEB_APPS_API_TOKEN_PROUD_OCEAN_0C7274110` | Frontend deployment | ✅ Configured |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Backend App Service deployment | ❌ Needed |
| `VITE_API_URL` | Production API URL for frontend | ❌ Needed |

## Database Migration

Once the backend is deployed, run migrations:

```bash
# From your local machine, update the connection string in appsettings.json temporarily
dotnet ef database update --project backend/src/MyScheduling.Infrastructure --startup-project backend/src/MyScheduling.Api

# Or enable automatic migrations in production (not recommended)
```

## Testing the Deployment

1. **Backend Health Check:**
   ```bash
   curl https://myscheduling-api.azurewebsites.net/api/health
   ```

2. **Frontend:**
   - Navigate to: https://proud-ocean-0c7274110.3.azurestaticapps.net
   - Try logging in
   - Check browser console for errors

## Troubleshooting

### Issue: Frontend shows 404 for /api calls
**Solution:** Backend not deployed yet or VITE_API_URL not configured

### Issue: CORS errors
**Solution:** Add frontend domain to CORS policy in backend Program.cs

### Issue: Database connection errors
**Solution:** Check connection string in Azure App Service configuration

### Issue: 500 Internal Server Error
**Solution:** Check App Service logs in Azure Portal → Log stream

## Next Steps

1. [ ] Create Azure App Service for backend
2. [ ] Create PostgreSQL database
3. [ ] Configure App Service application settings
4. [ ] Download and add publish profile to GitHub secrets
5. [ ] Add VITE_API_URL to GitHub secrets
6. [ ] Push changes to trigger deployment
7. [ ] Run database migrations
8. [ ] Test the application

## Cost Estimates (Azure)

- **Static Web Apps (Free tier):** $0/month
- **App Service (Basic B1):** ~$13/month
- **PostgreSQL (Burstable B1ms):** ~$12/month
- **Total:** ~$25/month

Adjust based on your needs. Free tiers available for testing.
